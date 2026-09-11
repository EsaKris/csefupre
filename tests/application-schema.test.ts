import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applicationSchema, stepSchemas, emptyApplication } from '../shared/schemas/application'
import { isValidPhone } from '../shared/validation'

const valid = {
  ...emptyApplication,
  firstName: 'Ada',
  lastName: 'Okafor',
  email: '  Ada.Okafor@Example.com ',
  phone: '0802 848 7246',
  dateOfBirth: '1994-05-12',
  gender: 'Female',
  country: 'Nigeria',
  state: 'Delta',
  address: '12 Refinery Road, Effurun',
  programme: 'masters',
  highestQualification: "Bachelor's degree",
  institution: 'University of Benin',
  courseOfStudy: 'Chemical Engineering',
  graduationYear: '2017',
  grade: 'Second Class (Upper Division)',
  employmentStatus: 'Employed full-time',
  organization: 'Example Energy Ltd',
  jobTitle: 'Safety Officer',
  yearsExperience: '3 to 5 years',
  applicationReason: 'I want to move into HSE management leadership.',
  referralSource: 'Friend or colleague',
  preferredContact: 'WhatsApp',
  acceptPrivacy: true,
  acceptTerms: true,
  confirmAccuracy: true,
}

const errorPaths = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  r.success ? [] : r.error!.issues.map((i) => String(i.path[0]))

test('accepts a complete valid application and normalises values', () => {
  const r = applicationSchema.safeParse(valid)
  assert.equal(r.success, true, JSON.stringify(r.error?.issues))
  assert.equal(r.data!.email, 'ada.okafor@example.com')
  assert.equal(r.data!.phone, '08028487246')
})

test('rejects values outside the allowed lists', () => {
  const r = applicationSchema.safeParse({ ...valid, programme: 'mba', gender: 'X', preferredContact: 'Telegram' })
  assert.deepEqual(errorPaths(r).sort(), ['gender', 'preferredContact', 'programme'])
})

test('requires a Nigerian state from the list when country is Nigeria', () => {
  assert.deepEqual(errorPaths(stepSchemas.personal.safeParse({ ...valid, state: 'Atlantis' })), ['state'])
  assert.equal(stepSchemas.personal.safeParse({ ...valid, country: 'Ghana', state: 'Greater Accra' }).success, true)
})

test('rejects implausible dates of birth', () => {
  for (const dob of ['2023-01-01', '1900-01-01', '1994-02-30', 'not-a-date']) {
    assert.deepEqual(errorPaths(stepSchemas.personal.safeParse({ ...valid, dateOfBirth: dob })), ['dateOfBirth'], dob)
  }
})

test("requires a degree class for Bachelor's and an HND grade for HND", () => {
  assert.deepEqual(errorPaths(stepSchemas.education.safeParse({ ...valid, grade: 'Very good' })), ['grade'])
  const hnd = { ...valid, highestQualification: 'Higher National Diploma (HND)', grade: 'Upper Credit' }
  assert.equal(stepSchemas.education.safeParse(hnd).success, true)
})

test("does not require course of study for O'Level", () => {
  const ol = { ...valid, highestQualification: "O'Level (WAEC, NECO or NABTEB)", courseOfStudy: '', grade: '6 credits' }
  assert.equal(stepSchemas.education.safeParse(ol).success, true)
})

test('rejects a future graduation year', () => {
  const next = String(new Date().getFullYear() + 1)
  assert.deepEqual(errorPaths(stepSchemas.education.safeParse({ ...valid, graduationYear: next })), ['graduationYear'])
})

test('requires organisation and job title only when employed', () => {
  assert.deepEqual(errorPaths(stepSchemas.professional.safeParse({ ...valid, organization: '', jobTitle: '' })).sort(), ['jobTitle', 'organization'])
  assert.equal(stepSchemas.professional.safeParse({ ...valid, employmentStatus: 'Student', organization: '', jobTitle: '' }).success, true)
})

test('requires all three consents to be exactly true', () => {
  assert.deepEqual(errorPaths(applicationSchema.safeParse({ ...valid, acceptTerms: 'true', confirmAccuracy: false })).sort(), ['acceptTerms', 'confirmAccuracy'])
})

test('enforces maximum lengths and strips control characters', () => {
  assert.deepEqual(errorPaths(applicationSchema.safeParse({ ...valid, address: 'x'.repeat(301) })), ['address'])
  const r = applicationSchema.safeParse({ ...valid, firstName: 'Ada\u0000\u0007' })
  assert.equal(r.data?.firstName, 'Ada')
})

test('phone validation accepts Nigerian and international formats only', () => {
  for (const ok of ['0802 848 7246', '+234 802 848 7246', '07035941999', '+44 20 7946 0958']) assert.equal(isValidPhone(ok), true, ok)
  for (const bad of ['12345', '0802848724', '+234 123 456 7890', 'call me']) assert.equal(isValidPhone(bad), false, bad)
})

test('cross-field rules report together with other missing fields', () => {
  const r = stepSchemas.professional.safeParse({ ...emptyApplication, employmentStatus: 'Employed full-time' })
  const paths = errorPaths(r)
  assert.ok(paths.includes('organization') && paths.includes('jobTitle') && paths.includes('yearsExperience'), paths.join(','))
})

test('empty required text says "Enter", not a length rule', () => {
  const r = stepSchemas.professional.safeParse({ ...emptyApplication })
  const msg = r.success ? '' : r.error.issues.find((i) => i.path[0] === 'applicationReason')?.message
  assert.equal(msg, 'Enter your reason for applying')
})

import { APPLICATION_FEES, COURSE_FEES, FEES_ARE_PLACEHOLDERS, assertFeesAllowedForKey, toKobo } from '../shared/fees'

test('every short course has its own distinct price', () => {
  const set = Object.values(COURSE_FEES).filter((v): v is number => v !== null)
  assert.equal(new Set(set).size, set.length, 'two or more courses share the same fee')
})

test('fees are positive whole Naira amounts or null', () => {
  for (const [k, v] of [...Object.entries(APPLICATION_FEES), ...Object.entries(COURSE_FEES)]) {
    assert.ok(v === null || (Number.isInteger(v) && v > 0), k)
  }
  assert.equal(toKobo(15000), 1500000)
})

test('sample fees cannot be charged with a live Paystack key', () => {
  if (!FEES_ARE_PLACEHOLDERS) return
  assert.throws(() => assertFeesAllowedForKey('sk_live_abc'))
  assert.doesNotThrow(() => assertFeesAllowedForKey('sk_test_abc'))
})
