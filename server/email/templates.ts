/** Plain, institutional email templates. All dynamic values are HTML-escaped. */

const CENTRE = 'Centre for Safety Education, Federal University of Petroleum Resources, Effurun'
const CONTACT = 'cse@fupre.edu.ng | 0802 848 7246 | 0703 594 1999'

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f2f4f2;font-family:Arial,Helvetica,sans-serif;color:#1f2522">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-top:4px solid #0e3b25">
<tr><td style="padding:20px 28px;border-bottom:1px solid #d3dad5"><p style="margin:0;font-size:13px;color:#1a5e3c;font-weight:bold">FUPRE</p><p style="margin:2px 0 0;font-size:18px;font-weight:bold;color:#0e3b25">Centre for Safety Education</p></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;color:#0e3b25">${escapeHtml(title)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #d3dad5;font-size:12px;color:#616a65">${escapeHtml(CENTRE)}<br>${escapeHtml(CONTACT)}</td></tr>
</table></td></tr></table></body></html>`
}

function detailRows(rows: [string, string][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e3e8e4;font-size:14px;color:#616a65;width:40%">${escapeHtml(k)}</td><td style="padding:8px 0;border-bottom:1px solid #e3e8e4;font-size:14px;font-weight:bold">${escapeHtml(v)}</td></tr>`,
    )
    .join('')}</table>`
}

function p(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">${escapeHtml(text)}</p>`
}

export function applicationReceivedEmail(input: { firstName: string; applicationId: string; programmeName: string; paymentUrl: string; feeText: string | null }) {
  const title = 'Application received'
  const lines = [
    `Dear ${input.firstName},`,
    'Thank you for applying to the Centre for Safety Education. Your application has been received.',
  ]
  const payment = input.feeText
    ? `Your application is awaiting payment of the application fee (${input.feeText}). To pay, go to ${input.paymentUrl} and enter your Application ID and this email address.`
    : 'Admissions will contact you about the application fee.'
  const html = layout(
    title,
    lines.map(p).join('') +
      detailRows([
        ['Application ID', input.applicationId],
        ['Programme', input.programmeName],
      ]) +
      p(payment) +
      p('Keep your Application ID. You will need it, with this email address, to continue a payment or ask about your application.'),
  )
  const text = [...lines, '', `Application ID: ${input.applicationId}`, `Programme: ${input.programmeName}`, '', payment, '', CENTRE, CONTACT].join('\n')
  return { subject: `Application received — ${input.applicationId}`, html, text }
}

export function existingApplicationReminderEmail(input: { firstName: string; applicationId: string; programmeName: string; paymentStatus: string; paymentUrl: string }) {
  const title = 'Your existing application'
  const paid = input.paymentStatus === 'Success'
  const next = paid
    ? 'Payment for this application has already been received.'
    : `If you have not completed payment, go to ${input.paymentUrl} and enter your Application ID and this email address.`
  const intro = [
    `Dear ${input.firstName},`,
    'Someone tried to start a new application using your email address or phone number. An application already exists, so a new one was not created.',
  ]
  const html = layout(
    title,
    intro.map(p).join('') +
      detailRows([
        ['Application ID', input.applicationId],
        ['Programme', input.programmeName],
      ]) +
      p(next) +
      p('If this was not you, you can ignore this email, or contact admissions.'),
  )
  const text = [...intro, '', `Application ID: ${input.applicationId}`, `Programme: ${input.programmeName}`, '', next, '', CENTRE, CONTACT].join('\n')
  return { subject: `Your Application ID — ${input.applicationId}`, html, text }
}

export function paymentSuccessEmail(input: { firstName: string; applicationId: string; programmeName: string; reference: string; amountText: string; paidAt: string | null }) {
  const title = 'Payment successful'
  const intro = [`Dear ${input.firstName},`, 'We have received your application fee. Your application has been submitted successfully.']
  const rows: [string, string][] = [
    ['Application ID', input.applicationId],
    ['Programme', input.programmeName],
    ['Amount paid', input.amountText],
    ['Payment reference', input.reference],
  ]
  if (input.paidAt) rows.push(['Date', new Date(input.paidAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' })])
  const next = 'Admissions will contact you using the details in your application. Keep this email as your payment confirmation.'
  const html = layout(title, intro.map(p).join('') + detailRows(rows) + p(next))
  const text = [...intro, '', ...rows.map(([k, v]) => `${k}: ${v}`), '', next, '', CENTRE, CONTACT].join('\n')
  return { subject: `Payment received — ${input.applicationId}`, html, text }
}

export function paymentIncompleteEmail(input: { firstName: string; applicationId: string; programmeName: string; paymentUrl: string }) {
  const title = 'Your application payment is not complete'
  const intro = [`Dear ${input.firstName},`, 'Your application has been saved, but payment of the application fee has not been completed.']
  const next = `To continue, go to ${input.paymentUrl} and enter your Application ID and this email address. If you have already paid and money left your account, do not pay again — reply to admissions with your Application ID.`
  const html = layout(title, intro.map(p).join('') + detailRows([['Application ID', input.applicationId], ['Programme', input.programmeName]]) + p(next))
  const text = [...intro, '', `Application ID: ${input.applicationId}`, `Programme: ${input.programmeName}`, '', next, '', CENTRE, CONTACT].join('\n')
  return { subject: `Complete your application payment — ${input.applicationId}`, html, text }
}
