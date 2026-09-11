/**
 * Email delivery. Uses Resend's HTTP API when EMAIL_PROVIDER_API_KEY and
 * EMAIL_FROM are configured; otherwise emails are skipped (and logged by event
 * name only). Swapping to SendGrid or Brevo means replacing this one function.
 */
import type { ServerConfig } from '../config.js'
import { log } from '../log.js'

export type EmailMessage = { to: string; subject: string; html: string; text: string; replyTo?: string }
export type EmailSender = (message: EmailMessage, event: string) => Promise<{ sent: boolean }>

export function createEmailSender(config: ServerConfig, fetchImpl: typeof fetch = fetch): EmailSender {
  return async (message, event) => {
    if (!config.emailApiKey || !config.emailFrom) {
      log.info('email.skipped_not_configured', { detail: event })
      return { sent: false }
    }
    try {
      const res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.emailApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: config.emailFrom,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        }),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) {
        log.warn('email.failed', { detail: event, status: res.status })
        return { sent: false }
      }
      return { sent: true }
    } catch {
      log.warn('email.failed', { detail: event, code: 'NETWORK' })
      return { sent: false }
    }
  }
}
