import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { usePageMeta } from '../lib/seo'
import { faqGroups } from '../config/faq'
import { site } from '../config/site'
import { PageHeader } from '../components/ui/PageHeader'
import { Container } from '../components/ui/Container'
import { Tbd } from '../components/ui/Tbd'

function Answer({ text }: { text: string }) {
  if (text.startsWith('{tbd}')) return <p><Tbd>{text.slice(5)}</Tbd></p>
  return <p>{text}</p>
}

export default function FAQ() {
  usePageMeta({
    title: 'Frequently asked questions',
    path: '/faq',
    description:
      'Answers to common questions about programmes, admission requirements, applying online, application payment and contacting the Centre for Safety Education, FUPRE.',
  })

  return (
    <>
      <PageHeader title="Frequently asked questions" crumbs={[{ label: 'FAQ' }]} compact />
      <Container className="grid gap-12 py-14 sm:py-16 lg:grid-cols-12">
        <nav aria-label="FAQ topics" className="lg:col-span-3">
          <ul className="flex flex-wrap gap-2 lg:sticky lg:top-24 lg:flex-col lg:gap-1">
            {faqGroups.map((g) => (
              <li key={g.title}>
                <a
                  href={`#faq-${g.title.toLowerCase()}`}
                  className="block border border-rule px-3.5 py-2 text-[0.9375rem] text-slate hover:bg-paper lg:border-0 lg:border-l-4 lg:border-l-transparent lg:hover:border-l-green-800"
                >
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-12 lg:col-span-9">
          {faqGroups.map((g) => (
            <section key={g.title} aria-labelledby={`faq-${g.title.toLowerCase()}`} className="scroll-mt-24">
              <h2 id={`faq-${g.title.toLowerCase()}`} className="text-[2rem] font-semibold text-green-950">
                {g.title}
              </h2>
              <div className="mt-4 border-t-2 border-green-900">
                {g.items.map((item) => (
                  <details key={item.id} id={item.id} className="group scroll-mt-24 border-b border-rule">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 font-display text-[1.375rem] font-semibold text-green-950 marker:content-none hover:text-green-700 [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <Plus aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-green-700 transition-transform group-open:rotate-45" />
                    </summary>
                    <div className="max-w-[44rem] space-y-3 pb-6 text-[1.0625rem] leading-relaxed text-ink">
                      {item.answer.map((a) => (
                        <Answer key={a} text={a} />
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="border-l-4 border-gold bg-paper px-6 py-5">
            <p className="font-display text-xl font-semibold text-green-950">Still have a question?</p>
            <p className="mt-2 text-[1.0625rem]">
              <Link to="/contact" className="link">
                Send an enquiry
              </Link>{' '}
              or email{' '}
              <a href={`mailto:${site.contact.email}`} className="link">
                {site.contact.email}
              </a>
              .
            </p>
          </div>
        </div>
      </Container>
    </>
  )
}
