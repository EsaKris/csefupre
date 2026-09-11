import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAppsScriptHarness } from '../scripts/lib/appsScriptHarness'

const application = (overrides: Record<string, string> = {}) => ({
  firstName: 'Ada',
  lastName: 'Okafor',
  email: 'Ada@Example.com',
  phone: '08028487246',
  dateOfBirth: '1994-05-12',
  gender: 'Female',
  country: 'Nigeria',
  state: 'Delta',
  address: '12 Refinery Road',
  programme: 'masters',
  programmeName: "Master's Degree in Health, Environment, Safety and Security",
  highestQualification: "Bachelor's degree",
  institution: 'University of Benin',
  courseOfStudy: 'Chemical Engineering',
  graduationYear: '2017',
  grade: 'Second Class (Upper Division)',
  employmentStatus: 'Employed full-time',
  organization: 'Example Energy',
  jobTitle: 'Safety Officer',
  yearsExperience: '3 to 5 years',
  applicationReason: 'Moving into HSE leadership.',
  referralSource: 'Friend or colleague',
  preferredContact: 'WhatsApp',
  submissionId: 'sub-00000001',
  ...overrides,
})

const year = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', year: 'numeric' }).format(new Date())

test('rejects requests without the correct shared secret', () => {
  const h = createAppsScriptHarness()
  assert.deepEqual(h.post({ action: 'ping' }), { ok: false, code: 'UNAUTHORIZED' })
  assert.deepEqual(h.post({ secret: 'wrong'.padEnd(40, 'x'), action: 'ping' }), { ok: false, code: 'UNAUTHORIZED' })
  assert.deepEqual(h.post('not json'), { ok: false, code: 'BAD_REQUEST' })
  assert.equal(h.call('ping', {}).ok, true)
})

test('refuses all requests when SHARED_SECRET is missing or too short', () => {
  const h = createAppsScriptHarness({ secret: 'short' })
  assert.equal(h.call('ping', {}).code, 'UNAUTHORIZED')
})

test('creates an application with a sequential yearly ID and initial statuses', () => {
  const h = createAppsScriptHarness()
  const r1 = h.call('createApplication', application())
  const r2 = h.call('createApplication', application({ email: 'b@example.com', phone: '07035941999', submissionId: 'sub-00000002' }))
  assert.equal(r1.applicationId, `CSE-${year}-000001`)
  assert.equal(r2.applicationId, `CSE-${year}-000002`)
  const [row] = h.records('Applications')
  assert.equal(row['Email'], 'ada@example.com')
  assert.equal(row['Application Status'], 'Submitted')
  assert.equal(row['Payment Status'], 'Not Started')
  assert.equal(row['Follow-up Status'], 'Not Contacted')
  assert.equal(row['Programme Code'], 'masters')
  assert.ok(row['Submitted At'] instanceof Date)
})

test('keeps phone numbers as text (leading zero preserved)', () => {
  const h = createAppsScriptHarness()
  h.call('createApplication', application())
  assert.equal(h.records('Applications')[0]['Phone'], '08028487246')
})

test('escapes formula-like input so it is stored as text', () => {
  const h = createAppsScriptHarness()
  const r = h.call('createApplication', application({ organization: '=HYPERLINK("http://evil","x")', address: '+1 Main St' }))
  assert.equal(r.ok, true)
  assert.equal(h.records('Applications')[0]['Organization'], '=HYPERLINK("http://evil","x")')
})

test('same submissionId returns the original application (safe retry)', () => {
  const h = createAppsScriptHarness()
  const a = h.call('createApplication', application())
  const b = h.call('createApplication', application())
  assert.equal(b.status, 'created')
  assert.equal(b.applicationId, a.applicationId)
  assert.equal(b.idempotent, true)
  assert.equal(h.records('Applications').length, 1)
})

test('a new submission with the same email or phone is a duplicate', () => {
  const h = createAppsScriptHarness()
  h.call('createApplication', application())
  const byEmail = h.call('createApplication', application({ email: 'ADA@example.com', phone: '07000000000', submissionId: 'sub-00000009' }))
  const byPhone = h.call('createApplication', application({ email: 'other@example.com', phone: '+2348028487246', submissionId: 'sub-00000010' }))
  assert.equal(byEmail.status, 'duplicate')
  assert.equal(byPhone.status, 'duplicate')
  assert.equal(byEmail.existing.applicationId, `CSE-${year}-000001`)
  assert.equal(h.records('Applications').length, 1)
})

test('rebuilds the ID counter from the sheet if the property is lost', () => {
  const h = createAppsScriptHarness()
  h.call('createApplication', application())
  h.call('createApplication', application({ email: 'b@example.com', phone: '07035941999', submissionId: 'sub-00000002' }))
  h.props.delete(`SEQ_APPLICATION_${year}`)
  const r = h.call('createApplication', application({ email: 'c@example.com', phone: '09011112222', submissionId: 'sub-00000003' }))
  assert.equal(r.applicationId, `CSE-${year}-000003`)
})

test('rejects invalid payloads without writing', () => {
  const h = createAppsScriptHarness()
  assert.equal(h.call('createApplication', application({ programme: 'mba' })).code, 'INVALID_PAYLOAD')
  assert.equal(h.call('createApplication', application({ applicationReason: 'x'.repeat(1501) })).code, 'INVALID_PAYLOAD')
  assert.equal(h.call('createApplication', application({ email: 'not-an-email' })).code, 'INVALID_PAYLOAD')
  assert.equal(h.call('createApplication', { ...application(), firstName: { $gt: '' } }).code, 'INVALID_PAYLOAD')
  assert.equal(h.records('Applications').length, 0)
})

test('getApplication requires a matching email and never leaks on mismatch', () => {
  const h = createAppsScriptHarness()
  const { applicationId } = h.call('createApplication', application())
  const found = h.call('getApplication', { applicationId: applicationId.toLowerCase(), email: ' ADA@example.com ' })
  assert.equal(found.found, true)
  assert.equal(found.application.programme, 'masters')
  assert.deepEqual(h.call('getApplication', { applicationId, email: 'someone@else.com' }), { ok: true, found: false })
  assert.deepEqual(h.call('getApplication', { applicationId: 'CSE-1-2', email: 'ada@example.com' }), { ok: true, found: false })
})

test('creates enquiries with their own ID sequence', () => {
  const h = createAppsScriptHarness()
  const r = h.call('createEnquiry', { fullName: 'Tunde Bello', email: 'tunde@example.com', phone: '', enquiryType: 'Short courses', course: 'H₂S Safety', message: 'When is the next course?' })
  assert.equal(r.enquiryId, `ENQ-${year}-000001`)
  assert.equal(h.records('Enquiries')[0]['Status'], 'New')
})

test('setupSheets creates all three sheets with headers', () => {
  const h = createAppsScriptHarness()
  h.run('setupSheets')
  for (const name of ['Applications', 'Payments', 'Enquiries']) assert.ok(h.sheet(name)!.data[0].length > 5, name)
  assert.ok((h.sheet('Applications')!.data[0] as string[]).includes('Grade / Classification'))
})

test('unknown actions are rejected', () => {
  const h = createAppsScriptHarness()
  assert.equal(h.call('deleteEverything', {}).code, 'UNKNOWN_ACTION')
})
