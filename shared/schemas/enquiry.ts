import { z } from 'zod'
import { email, optionalPhone, text } from '../validation.js'

export const ENQUIRY_TYPES = [
  'Programmes',
  'Admission requirements',
  'Application or payment',
  'Short courses',
  'Other',
] as const

export const enquirySchema = z.object({
  fullName: text('full name', { min: 2, max: 120 }),
  email,
  phone: optionalPhone,
  enquiryType: z.enum(ENQUIRY_TYPES, { error: 'Choose what your enquiry is about' }),
  course: z.string().trim().max(80).optional().default(''),
  message: text('message', { min: 10, max: 2000 }),
})

export type EnquiryInput = z.input<typeof enquirySchema>
export type Enquiry = z.output<typeof enquirySchema>
