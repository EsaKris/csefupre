import { enquirySchema } from '../../shared/schemas/enquiry.js'
import { COURSE_SLUGS, COURSE_TITLES, type CourseSlug } from '../../shared/catalog.js'
import { fieldErrors, HONEYPOT_FIELD } from '../../shared/validation.js'
import type { Deps } from '../deps.js'
import { clientIp, isSameOrigin, json, MESSAGES, methodNotAllowed, readJsonBody } from '../http.js'
import { SheetsError } from '../sheets.js'
import { escapeHtml } from '../email/templates.js'

const SEND_ERROR = 'Your enquiry could not be sent. Please try again, or email admissions directly at cse@fupre.edu.ng.'

/** POST /api/enquiries — validates and records a contact-form enquiry */
export async function handleEnquiries(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST')

  if (!/^https:\/\/script\.google\.com\//.test(deps.config.sheetsEndpoint) || deps.config.sheetsSecret.length < 32) {
    deps.log.error('enquiries.misconfigured')
    return json(503, { ok: false, message: SEND_ERROR })
  }
  if (!isSameOrigin(request)) return json(403, { ok: false, message: MESSAGES.generic })
  if (!deps.limiters.enquiries.allow(clientIp(request))) return json(429, { ok: false, message: MESSAGES.rateLimited })

  const body = await readJsonBody(request, 8_000)
  if (!body.ok) return body.response
  const raw = body.data

  if (typeof raw[HONEYPOT_FIELD] === 'string' && raw[HONEYPOT_FIELD] !== '') {
    deps.log.warn('enquiries.honeypot_triggered')
    return json(200, { ok: true, data: { status: 'received' } })
  }

  const parsed = enquirySchema.safeParse(raw)
  if (!parsed.success) return json(422, { ok: false, message: MESSAGES.invalid, fieldErrors: fieldErrors(parsed.error) })
  const e = parsed.data
  // Only accept a course slug we publish; store its readable title
  const courseTitle = (COURSE_SLUGS as readonly string[]).includes(e.course) ? COURSE_TITLES[e.course as CourseSlug] : ''

  try {
    const result = await deps.sheets.call<{ enquiryId: string }>('createEnquiry', {
      fullName: e.fullName,
      email: e.email,
      phone: e.phone,
      enquiryType: e.enquiryType,
      course: courseTitle,
      message: e.message,
    })
    deps.log.info('enquiries.created', { enquiryId: result.enquiryId })

    if (deps.config.admissionsEmail) {
      await deps.sendEmail(
        {
          to: deps.config.admissionsEmail,
          replyTo: e.email,
          subject: `New website enquiry ${result.enquiryId}: ${e.enquiryType}`,
          text: `Enquiry ${result.enquiryId}\nType: ${e.enquiryType}\n${courseTitle ? `Course: ${courseTitle}\n` : ''}\nOpen the Enquiries sheet to read and respond.`,
          html: `<p>Enquiry <strong>${escapeHtml(result.enquiryId)}</strong></p><p>Type: ${escapeHtml(e.enquiryType)}${courseTitle ? `<br>Course: ${escapeHtml(courseTitle)}` : ''}</p><p>Open the Enquiries sheet to read and respond.</p>`,
        },
        'enquiry_staff_notification',
      )
    }
    return json(201, { ok: true, data: { status: 'received' } })
  } catch (err) {
    deps.log.error('enquiries.store_failed', { code: err instanceof SheetsError ? err.code : 'UNEXPECTED' })
    return json(502, { ok: false, message: SEND_ERROR })
  }
}
