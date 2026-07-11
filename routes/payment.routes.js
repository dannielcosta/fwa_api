const router = require("express").Router();
const stripe = require("../stripe/stripe.config");
const pool = require("../db/index");
const paypalClient = require("../paypal/paypal.config");
const paypal = require("@paypal/checkout-server-sdk");

/* const logDir = path.join(process.cwd(), "logs");
const logFilePath = path.join(logDir, "payments.log"); */

/*if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function writeLog(level, message, meta = null) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}${
    meta ? ` | ${typeof meta === "string" ? meta : JSON.stringify(meta)}`
    : ""
  }\n`;

  fs.appendFile(logFilePath, logLine, (err) => {
    if (err) {
      console.error("Erro ao escrever no ficheiro de log:", err);
    }
  });
}*/


router.post("/create-checkout-session", async (req, res) => {
  try {

    const { userId, selectedPlan, pendingCardIds, customerId } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: selectedPlan.name,
            },
            unit_amount: Math.round(selectedPlan.price * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId: selectedPlan.id,
        cardIds: JSON.stringify(pendingCardIds),
        name: customerId,
      },
    });

    return res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err);
        /*writeLog("ERROR", "Erro ao criar Stripe checkout session", err.stack || err.message || String(err));*/

    res.status(500).json({ error: "Stripe session error" });
  }
});

// routes/payment.routes.js
router.get("/session/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT * FROM payments WHERE stripe_session_id = ? LIMIT 1`,
      [sessionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Pagamento n達o encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar pagamento:", err);
        /*writeLog("ERROR", "Erro ao criar Stripe checkout session", err.stack || err.message || String(err));*/

    return res.status(500).json({ error: "Erro ao buscar pagamento" });
  }
});

/* PAYPAL */
router.post("/paypal/create-order", async (req, res) => {
  try {
    const { selectedPlan, pendingCardIds, userId } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: selectedPlan.price.toFixed(2),
          },
          custom_id: userId,
        },
      ],
    });

    const order = await paypalClient.execute(request);

    res.json({ orderId: order.result.id });
  } catch (err) {
    console.error("PayPal create order error:", err);
        /*writeLog("ERROR", "Erro ao criar Stripe checkout session", err.stack || err.message || String(err));*/

    res.status(500).json({ error: "PayPal create order failed" });
  }
});

router.post("/paypal/capture-order", async (req, res) => {
  try {
    const { paypalOrderId, selectedPlan, pendingCardIds, userId } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const capture = await paypalClient.execute(request);

    if (capture.result.status !== "COMPLETED") {
      return res.status(400).json({ success: false });
    }

    await pool.query(
      `
      INSERT INTO payments 
        (user_id, provider, payment_id, status, plan_id, card_ids)
      VALUES (?, 'paypal', ?, 'PAID', ?, ?)
      `,
      [userId, paypalOrderId, selectedPlan.id, JSON.stringify(pendingCardIds)]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("PayPal capture error:", err);
    res.status(500).json({ success: false });
  }
});



module.exports = router;
