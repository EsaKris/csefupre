import { applicationSchema } from '../../shared/schemas/application.js'
import { PROGRAMME_NAMES } from '../../shared/catalog.js'
import { APPLICATION_FEES, formatNaira } from '../../shared/fees.js'
import { fieldErrors, HONEYPOT_FIELD } from '../../shared/validation.js'
import { missingForSubmissions } from '../config.js'
import type { Deps } from '../deps.js'
import { clientIp, isSameOrigin, json, MESSAGES, methodNotAllowed, readJsonBody } from '../http.js'
import { describeError } from '../log.js'
import { SheetsError } from '../sheets.js'
import { signResumeToken } from '../tokens.js'
import { applicationReceivedEmail, existingApplicationReminderEmail } from '../email/templates.js'

type CreateResult =
  | { status: 'created'; applicationId: string; idempotent: boolean }
  | {
      status: 'duplicate'
      existing?: { applicationId: string; email: string; firstName: string; programmeName: string; paymentStatus: string }
    }

const SUBMIT_ERROR =
  'We could not submit your application at this time. Please try again, or contact admissions at cse@fupre.edu.ng.'

/**
 * POST /api/applications
 * Validates the full application (never trusting the browser), stores it via the
 * Sheets data layer, and returns an Application ID plus a short-lived resume token.
 */
export async function handleApplications(request: Request, deps: Deps): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed('POST')

  const missing = missingForSubmissions(deps.config)
  if (missing.length) {
    deps.log.error('applications.misconfigured', { detail: missing.join(',') })
    return json(503, { ok: false, message: SUBMIT_ERROR })
  }

  if (!isSameOrigin(request)) {
    deps.log.warn('applications.cross_origin_rejected')
    return json(403, { ok: false, message: MESSAGES.generic })
  }

  if (!deps.limiters.applications.allow(clientIp(request))) {
    deps.log.warn('applications.rate_limited')
    return json(429, { ok: false, message: MESSAGES.rateLimited })
  }

  const body = await readJsonBody(request, 24_000)
  if (!body.ok) return body.response
  const raw = body.data

  // Honeypot: answer like a duplicate so automated submitters learn nothing, and store nothing
  if (typeof raw[HONEYPOT_FIELD] === 'string' && raw[HONEYPOT_FIELD] !== '') {
    deps.log.warn('applications.honeypot_triggered')
    return json(200, { ok: true, data: { status: 'duplicate', reminderSent: false } })
  }

  const submissionId = typeof raw.submissionId === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(raw.submissionId) ? raw.submissionId : null
  if (!submissionId) return json(400, { ok: false, message: SUBMIT_ERROR })

  const parsed = applicationSchema.safeParse(raw)
  if (!parsed.success) {
    return json(422, { ok: false, message: MESSAGES.invalid, fieldErrors: fieldErrors(parsed.error) })
  }
  const a = parsed.data

  let result: CreateResult
  try {
    result = await deps.sheets.call<CreateResult>('createApplication', {
      firstName: a.firstName,
      lastName: a.lastName,
      email: a.email,
      phone: a.phone,
      dateOfBirth: a.dateOfBirth,
      gender: a.gender,
      country: a.country,
      state: a.state,
      address: a.address,
      programme: a.programme,
      programmeName: PROGRAMME_NAMES[a.programme],
      highestQualification: a.highestQualification,
      institution: a.institution,
      courseOfStudy: a.courseOfStudy,
      graduationYear: a.graduationYear,
      grade: a.grade,
      employmentStatus: a.employmentStatus,
      organization: a.organization,
      jobTitle: a.jobTitle,
      yearsExperience: a.yearsExperience,
      applicationReason: a.applicationReason,
      referralSource: a.referralSource,
      preferredContact: a.preferredContact,
      submissionId,
    })
  } catch (err) {
    deps.log.error('applications.store_failed', { code: err instanceof SheetsError ? err.code : 'UNEXPECTED', detail: err instanceof SheetsError ? undefined : describeError(err) })
    const status = err instanceof SheetsError && err.code === 'BUSY' ? 503 : 502
    return json(status, { ok: false, message: SUBMIT_ERROR })
  }

  const paymentUrl = `${deps.config.siteUrl || new URL(request.url).origin}/payment`

  if (result.status === 'duplicate') {
    let reminderSent = false
    if (result.existing?.email) {
      const mail = existingApplicationReminderEmail({ ...result.existing, paymentUrl })
      reminderSent = (await deps.sendEmail({ to: result.existing.email, ...mail }, 'application_duplicate_reminder')).sent
    }
    deps.log.info('applications.duplicate', { applicationId: result.existing?.applicationId })
    // The browser learns only that an application exists — never whose, or its ID
    return json(200, { ok: true, data: { status: 'duplicate', reminderSent } })
  }

  const resumeToken = signResumeToken(result.applicationId, deps.config.signingSecret)

  if (!result.idempotent) {
    const fee = APPLICATION_FEES[a.programme]
    const mail = applicationReceivedEmail({
      firstName: a.firstName,
      applicationId: result.applicationId,
      programmeName: PROGRAMME_NAMES[a.programme],
      paymentUrl,
      feeText: fee === null ? null : formatNaira(fee),
    })
    await deps.sendEmail({ to: a.email, ...mail }, 'application_received')
    deps.log.info('applications.created', { applicationId: result.applicationId })
  }

  return json(201, { ok: true, data: { status: 'created', applicationId: result.applicationId, resumeToken } })
}
