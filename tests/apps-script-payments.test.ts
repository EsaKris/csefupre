import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAppsScriptHarness } from '../scripts/lib/appsScriptHarness'

const year = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', year: 'numeric' }).format(new Date())

function setup() {
  const h = createAppsScriptHarness()
  h.run('setupSheets')
  const r = h.call('createApplication', {
    firstName: 'Ada', lastName: 'Okafor', email: 'ada@example.com', phone: '08028487246', dateOfBirth: '1994-05-12',
    gender: 'Female', country: 'Nigeria', state: 'Delta', address: '12 Refinery Road', programme: 'pgd',
    programmeName: 'Postgraduate Diploma in Health, Environment, Safety and Security', highestQualification: 'Higher National Diploma (HND)',
    institution: 'Fed Poly', courseOfStudy: 'Chemistry', graduationYear: '2015', grade: 'Upper Credit', employmentStatus: 'Student',
    organization: '', jobTitle: '', yearsExperience: 'No work experience', applicationReason: 'Career change into HSE.',
    referralSource: 'ISPON', preferredContact: 'Email', submissionId: 'sub-12345678',
  })
  const id = r.applicationId as string
  const app = () => h.records('Applications').find((x) => x['Application ID'] === id)!
  const pay = (ref: string) => h.records('Payments').find((x) => x['Payment Reference'] === ref)
  return { h, id, app, pay }
}

const ref = (id: string, suffix: string) => `${id}-P${suffix}`

test('recordPaymentInit adds a Payments row and marks the application Pending', () => {
  const { h, id, app, pay } = setup()
  const reference = ref(id, 'ABC123')
  assert.equal(h.call('recordPaymentInit', { applicationId: id, reference, amount: 20000 }).recorded, true)
  assert.equal(pay(reference)!['Status'], 'Pending')
  assert.equal(pay(reference)!['Amount'], 20000)
  assert.equal(app()['Payment Status'], 'Pending')
  assert.equal(app()['Payment Reference'], reference)
  assert.equal(h.call('recordPaymentInit', { applicationId: id, reference, amount: 20000 }).duplicate, true)
  assert.equal(h.records('Payments').length, 1)
})

test('recordPaymentInit rejects unknown applications and malformed references', () => {
  const { h } = setup()
  assert.equal(h.call('recordPaymentInit', { applicationId: `CSE-${year}-999999`, reference: `CSE-${year}-999999-PABCDEF`, amount: 1 }).code, 'NOT_FOUND')
  assert.equal(h.call('recordPaymentInit', { applicationId: `CSE-${year}-000001`, reference: 'hack', amount: 1 }).code, 'INVALID_PAYLOAD')
  assert.equal(h.call('recordPaymentInit', { applicationId: `CSE-${year}-000001`, reference: `CSE-${year}-000001-PABCDEF`, amount: -5 }).code, 'INVALID_PAYLOAD')
})

test('success marks the application paid once; repeat results change nothing', () => {
  const { h, id, app } = setup()
  const reference = ref(id, 'SUCC01')
  h.call('recordPaymentInit', { applicationId: id, reference, amount: 20000 })
  const first = h.call('recordPaymentResult', { reference, status: 'Success', transactionId: '555001', channel: 'card', paidAt: '2026-09-10T10:00:00.000Z', amount: 20000, event: 'webhook:charge.success' })
  assert.equal(first.changed, true)
  assert.equal(first.becameSuccess, true)
  assert.equal(first.application.email, 'ada@example.com')
  assert.equal(app()['Payment Status'], 'Success')
  assert.equal(app()['Paystack Transaction ID'], '555001')
  assert.ok(app()['Payment Date'] instanceof Date)

  const again = h.call('recordPaymentResult', { reference, status: 'Success', transactionId: '555001', event: 'verify' })
  assert.equal(again.changed, false)
  assert.equal(again.becameSuccess, undefined)
})

test('a successful payment is never downgraded by a later stale status', () => {
  const { h, id, app, pay } = setup()
  const reference = ref(id, 'KEEP01')
  h.call('recordPaymentInit', { applicationId: id, reference, amount: 20000 })
  h.call('recordPaymentResult', { reference, status: 'Success', transactionId: '1' })
  const stale = h.call('recordPaymentResult', { reference, status: 'Abandoned' })
  assert.equal(stale.changed, false)
  assert.equal(pay(reference)!['Status'], 'Success')
  assert.equal(app()['Payment Status'], 'Success')
})

test('abandoned attempt flags follow-up; a later payment converts it', () => {
  const { h, id, app } = setup()
  const first = ref(id, 'ABND01')
  h.call('recordPaymentInit', { applicationId: id, reference: first, amount: 20000 })
  const r = h.call('recordPaymentResult', { reference: first, status: 'Abandoned', event: 'reconcile' })
  assert.equal(r.becameAbandoned, true)
  assert.equal(app()['Payment Status'], 'Abandoned')
  assert.equal(app()['Follow-up Status'], 'Pending')
  assert.equal(app()['Application Status'], 'Submitted')

  h.run('setupSheets')
  const second = ref(id, 'RETRY1')
  h.call('recordPaymentInit', { applicationId: id, reference: second, amount: 20000 })
  h.call('recordPaymentResult', { reference: second, status: 'Success', transactionId: '777' })
  assert.equal(app()['Payment Status'], 'Success')
  assert.equal(app()['Follow-up Status'], 'Converted')
})

test('an old attempt failing does not overwrite the status of the newer attempt', () => {
  const { h, id, app } = setup()
  const older = ref(id, 'OLD001')
  const newer = ref(id, 'NEW001')
  h.call('recordPaymentInit', { applicationId: id, reference: older, amount: 20000 })
  h.call('recordPaymentInit', { applicationId: id, reference: newer, amount: 20000 })
  h.call('recordPaymentResult', { reference: newer, status: 'Ongoing' })
  h.call('recordPaymentResult', { reference: older, status: 'Failed' })
  assert.equal(app()['Payment Status'], 'Ongoing')
  assert.equal(app()['Payment Reference'], newer)
})

test('a late success for an older attempt still marks the application paid', () => {
  const { h, id, app } = setup()
  const older = ref(id, 'OLD002')
  const newer = ref(id, 'NEW002')
  h.call('recordPaymentInit', { applicationId: id, reference: older, amount: 20000 })
  h.call('recordPaymentInit', { applicationId: id, reference: newer, amount: 20000 })
  h.call('recordPaymentResult', { reference: older, status: 'Success', transactionId: '42' })
  assert.equal(app()['Payment Status'], 'Success')
  assert.equal(app()['Payment Reference'], older)
})

test('a result for an unrecorded reference is recovered into the Payments sheet', () => {
  const { h, id, app, pay } = setup()
  const reference = ref(id, 'LOST01')
  const r = h.call('recordPaymentResult', { reference, status: 'Success', transactionId: '9', amount: 20000 })
  assert.equal(r.changed, true)
  assert.equal(pay(reference)!['Status'], 'Success')
  assert.equal(app()['Payment Status'], 'Success')
})

test('reversal of the paid transaction sets Reversed and flags follow-up', () => {
  const { h, id, app } = setup()
  const reference = ref(id, 'REV001')
  h.call('recordPaymentInit', { applicationId: id, reference, amount: 20000 })
  h.call('recordPaymentResult', { reference, status: 'Success', transactionId: '88' })
  h.call('recordPaymentResult', { reference, status: 'Reversed', transactionId: '88' })
  assert.equal(app()['Payment Status'], 'Reversed')
  assert.equal(app()['Follow-up Status'], 'Pending')
})

test('listPendingPayments returns only pending attempts older than the threshold', () => {
  const { h, id } = setup()
  const a = ref(id, 'PEND01')
  const b = ref(id, 'PEND02')
  h.call('recordPaymentInit', { applicationId: id, reference: a, amount: 20000 })
  h.call('recordPaymentInit', { applicationId: id, reference: b, amount: 20000 })
  // Age the first attempt by two hours
  const sheet = h.sheet('Payments')!
  const headers = sheet.data[0] as string[]
  const initCol = headers.indexOf('Initialized At')
  const rowA = sheet.data.findIndex((r) => r[0] === a)
  sheet.data[rowA][initCol] = new Date(Date.now() - 2 * 3600_000)
  const res = h.call('listPendingPayments', { olderThanMinutes: 60, limit: 10 })
  assert.deepEqual(res.payments.map((p: { reference: string }) => p.reference), [a])
  h.call('recordPaymentResult', { reference: a, status: 'Abandoned' })
  assert.equal(h.call('listPendingPayments', { olderThanMinutes: 60 }).payments.length, 0)
})

test('listPendingPayments honours an explicit 0-minute threshold for tooling, but omission still uses 60', () => {
  const { h, id } = setup()
  const reference = ref(id, 'FRESH1')
  h.call('recordPaymentInit', { applicationId: id, reference, amount: 20000 })
  assert.equal(h.call('listPendingPayments', { olderThanMinutes: 60 }).payments.length, 0, 'a brand-new attempt is not stale under the normal window')
  assert.deepEqual(h.call('listPendingPayments', { olderThanMinutes: 0 }).payments.map((p: { reference: string }) => p.reference), [reference])
  assert.equal(h.call('listPendingPayments', {}).payments.length, 0, 'omitting the field must not accidentally sweep everything')
})

test('getPayment returns amount and programme for verification', () => {
  const { h, id } = setup()
  const reference = ref(id, 'GET001')
  h.call('recordPaymentInit', { applicationId: id, reference, amount: 20000 })
  const r = h.call('getPayment', { reference })
  assert.equal(r.found, true)
  assert.equal(r.payment.amount, 20000)
  assert.equal(r.payment.programme, 'pgd')
  assert.equal(h.call('getPayment', { reference: 'nope' }).found, false)
})

test('verifySetup reports failure when nothing is configured', () => {
  const h = createAppsScriptHarness({ secret: 'short' })
  const result = h.run('verifySetup')
  assert.equal(result, false)
})

test('verifySetup passes once sheets, secrets and the trigger are all in place', () => {
  const h = createAppsScriptHarness()
  h.run('setupSheets')
  h.props.set('RECONCILE_URL', 'https://example.com/api/paystack/reconcile')
  h.props.set('RECONCILE_SECRET', 'r'.repeat(40))
  h.run('installReconcileTrigger')
  assert.equal(h.run('verifySetup'), true)
})

test('installReconcileTrigger is idempotent (re-running does not duplicate the trigger)', () => {
  const h = createAppsScriptHarness()
  h.run('setupSheets')
  h.props.set('RECONCILE_URL', 'https://example.com/api/paystack/reconcile')
  h.props.set('RECONCILE_SECRET', 'r'.repeat(40))
  h.run('installReconcileTrigger')
  h.run('installReconcileTrigger')
  h.run('installReconcileTrigger')
  assert.equal(h.run('verifySetup'), true, 'still passes with exactly one trigger after repeated installs')
})

test('verifySetup catches a missing sheet header without failing the whole check', () => {
  const h = createAppsScriptHarness()
  h.run('setupSheets')
  h.props.set('RECONCILE_URL', 'https://example.com/api/paystack/reconcile')
  h.props.set('RECONCILE_SECRET', 'r'.repeat(40))
  h.run('installReconcileTrigger')
  const sheet = h.sheet('Applications')!
  sheet.data[0][0] = 'Renamed By Mistake'
  assert.equal(h.run('verifySetup'), false)
})

test('reconcilePayments (the Apps Script trigger) does nothing gracefully when unconfigured', () => {
  const h = createAppsScriptHarness()
  // Should not throw even though RECONCILE_URL/RECONCILE_SECRET are unset
  h.run('reconcilePayments')
})
