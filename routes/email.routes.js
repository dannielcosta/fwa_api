const express = require("express");
const router = express.Router();
const multer = require("multer");
const sendEmail = require("../services/email/email.service");

const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ========================================================
   1️⃣  ROTA - FORMULÁRIO DE CONTACTO (sem anexos)
   ======================================================== */
router.post("/send-email", async (req, res) => {
  const { name, email, company, message } = req.body;

  if (!name || !email || !company || !message) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  const text = `
📩 Novo pedido de contacto:

👤 Nome: ${name}
🏢 Empresa: ${company}
✉️ Email: ${email}
💬 Mensagem:
${message}
  `;

  try {
    const response = await sendEmail({
      to: "suporte@nfc-me.pt",
      subject: "📩 Novo contacto através do site",
      text,
    });

    if (response.success) {
      res.json({ success: true, messageId: response.messageId });
    } else {
      res.status(500).json({ error: "Falha no envio de email", details: response.error });
    }
  } catch (error) {
    console.error("❌ Erro no /send-email:", error);
    res.status(500).json({ error: "Erro interno ao enviar email", details: error.message });
  }
});

/* ========================================================
   2️⃣  ROTA - ENVIO DE PDFs DE ENCOMENDAS
   ======================================================== */
router.post("/send-pdfs", upload.array("pdfs"), async (req, res) => {
  try {
    const { name, email, company } = req.body;
    const pdfFiles = req.files || [];

    if (!name || !email || pdfFiles.length === 0) {
      return res.status(400).json({
        error: "Campos obrigatórios em falta ou sem ficheiros PDF.",
      });
    }

    const attachments = pdfFiles.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
    }));

    const text = `
🧾 Nova encomenda de cartões NFC recebida!

👤 Cliente: ${name}
🏢 Empresa: ${company || "N/A"}
✉️ Email: ${email}
📎 Anexos: ${pdfFiles.length} ficheiro(s)
    `;

    const response = await sendEmail({
      to: "suporte@nfc-me.pt",
      subject: `📇 Nova encomenda de cartões NFC - ${company || "Cliente"}`,
      text,
      attachments,
    });

    if (response.success) {
      console.log(`✅ Encomenda enviada por ${email} com ${pdfFiles.length} PDF(s).`);
      res.json({ success: true, message: "PDFs enviados com sucesso!" });
    } else {
      res.status(500).json({ error: "Falha no envio de email", details: response.error });
    }
  } catch (error) {
    console.error("❌ Erro no /send-pdfs:", error);
    res.status(500).json({
      error: "Erro interno ao enviar PDFs",
      details: error.message,
    });
  }
});

module.exports = router;
