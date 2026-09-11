/**
 * FAQ content. Answers describe how the website and application process work.
 * They do not state fees, deadlines or refund terms — those are confirmed by the Centre.
 * `{tbd}` in an answer is rendered as a visible placeholder.
 */

export type FaqItem = { id: string; question: string; answer: string[] }
export type FaqGroup = { title: string; items: FaqItem[] }

export const faqGroups: FaqGroup[] = [
  {
    title: 'Programmes',
    items: [
      {
        id: 'programmes-offered',
        question: 'What programmes are offered?',
        answer: [
          "The Centre for Safety Education offers a Professional Diploma, a Postgraduate Diploma (PGD), a Master's Degree and a Doctor of Philosophy (Ph.D.), all in Health, Environment, Safety and Security.",
          'The Centre also runs short and professional courses, listed on the Courses page.',
        ],
      },
      {
        id: 'programme-duration',
        question: 'How long are the programmes?',
        answer: [
          "The Professional Diploma and Postgraduate Diploma each run for 12 months. The Master's Degree runs for 18 months.",
          'The duration of the Ph.D. programme is confirmed by the Centre on enquiry.',
        ],
      },
    ],
  },
  {
    title: 'Admission',
    items: [
      {
        id: 'who-can-apply',
        question: 'Who can apply?',
        answer: [
          "Professional Diploma: five O'Level credit passes including Mathematics and English.",
          "Postgraduate Diploma: a Bachelor's degree, or an HND from a recognized tertiary institution.",
          "Master's: a Bachelor's degree with a minimum of Second Class (Lower Division), or an acceptable PGD.",
          "Ph.D.: a Master's degree in Health, Environment, Safety, or a related discipline.",
          'Applicants should confirm the latest official admission requirements with the Centre before submitting an application.',
        ],
      },
      {
        id: 'how-to-apply',
        question: 'How do I apply?',
        answer: [
          'Complete the online application form. It has five short sections: personal details, programme, education, professional background and a final review.',
          'When you submit, you receive an Application ID. Keep it — you will need it with your email address to continue a payment or contact admissions about your application.',
        ],
      },
    ],
  },
  {
    title: 'Payment',
    items: [
      {
        id: 'how-to-pay',
        question: 'How do I pay?',
        answer: [
          "After you submit your application, you are taken to a payment page showing your Application ID and the application fee. Payment is completed on Paystack's secure checkout, using the payment options Paystack presents.",
          'Your card details are entered on Paystack, not on this website, and this website does not store them.',
        ],
      },
      {
        id: 'payment-failed',
        question: 'What happens if my payment fails?',
        answer: [
          'Your application is saved even if payment does not go through. You will see a message explaining that payment was not completed, with an option to try again.',
          'If money left your account but the payment page does not confirm it, do not pay a second time. Contact admissions with your Application ID so the transaction can be checked.',
        ],
      },
      {
        id: 'continue-payment',
        question: 'Can I continue an incomplete payment?',
        answer: [
          'Yes. Go to the payment page and enter your Application ID and the email address you used on your application. If payment is still outstanding, you can continue from there.',
        ],
      },
      {
        id: 'refunds',
        question: 'Is the application fee refundable?',
        answer: ['{tbd}Refund policy to be confirmed by the Centre.'],
      },
    ],
  },
  {
    title: 'Contact',
    items: [
      {
        id: 'contact-admissions',
        question: 'How do I contact admissions?',
        answer: [
          'Email cse@fupre.edu.ng or call 0802 848 7246 or 0703 594 1999. You can also send an enquiry through the Contact page.',
          'The Centre is located at the Old TETFund Building, Federal University of Petroleum Resources (FUPRE).',
        ],
      },
    ],
  },
]
