import { Link } from 'react-router'
import { usePageMeta } from '../../lib/seo'
import { getProgramme } from '../../config/programmes'
import {
  FocusList,
  PendingList,
  ProgrammeLayout,
  ProgrammeSection,
  RequirementsBlock,
} from '../../components/programmes/ProgrammeLayout'

const programme = getProgramme('masters')
const pgd = getProgramme('pgd')
const phd = getProgramme('phd')

export default function Masters() {
  usePageMeta({
    title: programme.title,
    path: programme.path,
    description: `${programme.title} at the Centre for Safety Education, FUPRE. 18 months. Entry: a Bachelor's degree (minimum Second Class Lower) or an acceptable PGD.`,
  })

  return (
    <ProgrammeLayout programme={programme}>
      <ProgrammeSection id="overview" title="Overview">
        <p>{programme.summary}</p>
      </ProgrammeSection>

      <ProgrammeSection id="eligibility" title="Eligibility">
        <p>{programme.audience}</p>
        <p className="mt-4">
          An acceptable{' '}
          <Link to={pgd.path} className="link">
            Postgraduate Diploma
          </Link>{' '}
          is also an entry route into the Master's programme.
        </p>
      </ProgrammeSection>

      <ProgrammeSection id="focus" title="Programme focus">
        <FocusList items={programme.focus} />
        <div className="mt-6">
          {programme.modules ? (
            <ul className="list-disc space-y-2 pl-5">
              {programme.modules.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          ) : (
            <PendingList label="Official module list and research component to be published by the Centre." />
          )}
        </div>
      </ProgrammeSection>

      <ProgrammeSection id="leadership-research" title="Leadership and research relevance">
        <p>{programme.relevance}</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="border-t-2 border-green-800 pt-4">
            <h3 className="text-[1.375rem] font-semibold text-green-950">Leadership</h3>
            <p className="mt-2 text-slate">For professionals seeking leadership positions in HSE management and policy.</p>
          </div>
          <div className="border-t-2 border-green-800 pt-4">
            <h3 className="text-[1.375rem] font-semibold text-green-950">Research</h3>
            <p className="mt-2 text-slate">
              A Master's degree in Health, Environment, Safety or a related discipline meets the entry requirement for the{' '}
              <Link to={phd.path} className="link">
                Ph.D. programme
              </Link>
              .
            </p>
          </div>
        </div>
      </ProgrammeSection>

      <ProgrammeSection id="requirements" title="Admission requirements">
        <RequirementsBlock programme={programme} />
      </ProgrammeSection>
    </ProgrammeLayout>
  )
}
