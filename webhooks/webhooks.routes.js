const router = require("express").Router();
const stripe = require("../stripe/stripe.config");
const bodyParser = require("body-parser");
const pool = require("../db");
const {
  generatePhysicalCardPDF,
} = require("../services/pdf/generatePhysicalCardPDF.js");
const { sendEmail } = require("../services/email/email.service");

router.post(
  "/stripe-webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {

    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send("Webhook Error");
    }

    // ⚡ RESPONDE LOGO AO STRIPE
    res.status(200).json({ received: true });

    // ⚡ PROCESSA DEPOIS
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      try {
        const userId = String(session.metadata.userId);
        const planId = session.metadata.planId;
        const cardIds = JSON.parse(session.metadata.cardIds || "[]");

        // 💰 1. GUARDAR PAGAMENTO
        await pool.query(
          `INSERT INTO payments (
            user_id, plan_id, amount, stripe_session_id,
            stripe_payment_intent, stripe_status, payment_type, metadata
          ) VALUES (?,?,?,?,?,'paid','purchase',?)
          ON DUPLICATE KEY UPDATE stripe_session_id = stripe_session_id`,
          [
            userId,
            planId,
            session.amount_total / 100,
            session.id,
            session.payment_intent,
            JSON.stringify(session.metadata),
          ]
        );

        if (!cardIds.length) return;

        // 📦 2. BUSCAR CARDS
        const [cards] = await pool.query(
          `SELECT id, design_mode, design_meta
           FROM business_cards
           WHERE id IN (?)`,
          [cardIds]
        );

        for (const card of cards) {
          let pdfBuffer;

          try {
            pdfBuffer = await generatePhysicalCardPDF(card.design_meta);
          } catch {
            continue;
          }

          // 📧 3. ENVIAR EMAIL
          await sendEmail({
            to: "suporte@nfc-me.pt",
            subject: `Cartão NFC (#${card.id})`,
            text: `Card ID: ${card.id}`,
            attachments: [
              {
                filename: `card_${card.id}.pdf`,
                content: pdfBuffer,
              },
            ],
          });

          // 🟢 4. ATUALIZAR CARD
          await pool.query(
            `UPDATE business_cards
             SET status = 'active', design_meta = NULL
             WHERE id = ?`,
            [card.id]
          );
        }

        // 👤 5. ATUALIZAR USER
        await pool.query(
          `UPDATE users SET status = 'active' WHERE id = ?`,
          [userId]
        );

      } catch (err) {
        // ❗ nunca responder erro aqui
      }
    }
  }
);

module.exports = router;
