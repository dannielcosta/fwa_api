require("dotenv").config();
const nodemailer = require("nodemailer");

/**
 * Serviço genérico para enviar emails
 * @param {Object} options - Opções de envio
 * @param {string|string[]} options.to - Destinatário(s)
 * @param {string} options.subject - Assunto do email
 * @param {string} options.text - Corpo em texto simples
 * @param {string} [options.html] - Corpo em HTML (opcional)
 * @param {Array} [options.attachments] - Lista de anexos (opcional)
 * 
 */


async function sendEmail({ to, subject, text, html, attachments = [] }) {
  console.log('start sendingEmail')
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"NFC-ME" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(", ") : to, // suporta um ou vários destinatários
      subject,
      text,
      html,
      attachments, // ← permite anexos (PDFs, imagens, etc.)
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };
