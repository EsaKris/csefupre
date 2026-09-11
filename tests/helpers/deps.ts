import { createAppsScriptHarness } from '../../scripts/lib/appsScriptHarness'
import { createFakePaystack } from '../../scripts/lib/fakePaystack'
import { createRateLimiter } from '../../server/rateLimit'
import { SheetsError } from '../../server/sheets'
import type { Deps } from '../../server/deps'
import type { EmailMessage } from '../../server/email/send'

export const SECRET = 's'.repeat(40)
export const PAYSTACK_KEY = 'sk_test_' + 'a'.repeat(40)
export const RECONCILE_SECRET = 'r'.repeat(40)

export function makeDeps(overrides: Partial<Deps> = {}) {
  const harness = createAppsScriptHarness()
  harness.run('setupSheets')
  const paystack = createFakePaystack({ secretKey: PAYSTACK_KEY })
  const emails: { message: EmailMessage; event: string }[] = []
  const logs: { event: string; ctx?: unknown }[] = []
  let counter = 0
  const deps: Deps = {
    config: {
      sheetsEndpoint: 'https://script.google.com/macros/s/test/exec',
      sheetsSecret: SECRET,
      signingSecret: SECRET,
      siteUrl: 'https://cse.example.edu.ng',
      emailApiKey: '',
      emailFrom: '',
      admissionsEmail: '',
      paystackSecretKey: PAYSTACK_KEY,
      reconcileSecret: RECONCILE_SECRET,
    },
    sheets: {
      call: async (action, payload) => {
        const r = harness.call(action, payload)
        if (!r.ok) throw new SheetsError(r.code)
        return r
      },
    },
    paystack,
    sendEmail: async (message, event) => {
      emails.push({ message, event })
      return { sent: true }
    },
    limiters: {
      applications: createRateLimiter({ limit: 100, windowMs: 60_000 }),
      enquiries: createRateLimiter({ limit: 100, windowMs: 60_000 }),
      lookups: createRateLimiter({ limit: 100, windowMs: 60_000 }),
      payments: createRateLimiter({ limit: 100, windowMs: 60_000 }),
    },
    log: {
      info: (event, ctx) => logs.push({ event, ctx }),
      warn: (event, ctx) => logs.push({ event, ctx }),
      error: (event, ctx) => logs.push({ event, ctx }),
    },
    randomToken: () => `TEST${String(++counter).padStart(6, '0')}`,
    allowedCheckoutOrigins: [],
    ...overrides,
  }
  return { deps, harness, paystack, emails, logs }
}

export const validApplication = {
  firstName: 'Ada', lastName: 'Okafor', email: 'ada@example.com', phone: '0802 848 7246', dateOfBirth: '1994-05-12',
  gender: 'Female', country: 'Nigeria', state: 'Delta', address: '12 Refinery Road, Effurun', programme: 'masters',
  highestQualification: "Bachelor's degree", institution: 'University of Benin', courseOfStudy: 'Chemical Engineering',
  graduationYear: '2017', grade: 'Second Class (Upper Division)', employmentStatus: 'Employed full-time',
  organization: 'Example Energy', jobTitle: 'Safety Officer', yearsExperience: '3 to 5 years',
  applicationReason: 'I want to move into HSE management leadership.', referralSource: 'Friend or colleague',
  preferredContact: 'WhatsApp', acceptPrivacy: true, acceptTerms: true, confirmAccuracy: true,
  submissionId: 'b3f1c1c2-0000-4000-8000-000000000001', companyWebsite: '',
}

export function jsonRequest(path: string, body: unknown, headers: Record<string, string> = {}, method = 'POST') {
  return new Request(`https://cse.example.edu.ng${path}`, {
    method,
    headers: { 'content-type': 'application/json', host: 'cse.example.edu.ng', origin: 'https://cse.example.edu.ng', 'x-forwarded-for': '203.0.113.5', ...headers },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  })
}

export const read = async (r: Response) => ({ status: r.status, body: await r.json() })
