import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

const transporter =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 465,
        secure: (env.SMTP_PORT ?? 465) === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null

export async function sendMail(options: { to: string; subject: string; html: string }) {
  if (!transporter) {
    console.warn(
      `[mailer] SMTP não configurado — email para ${options.to} não foi enviado.\n${options.subject}\n${options.html}`,
    )
    return
  }

  await transporter.sendMail({
    from: env.EMAIL_FROM ?? env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })
}
