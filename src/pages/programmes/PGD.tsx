import { usePageMeta } from '../../lib/seo'
import { getProgramme } from '../../config/programmes'
import {
  FocusList,
  PendingList,
  ProgrammeLayout,
  ProgrammeSection,
  RequirementsBlock,
} from '../../components/programmes/ProgrammeLayout'
import { CareersCompact } from '../../components/programmes/CareersCompact'

const programme = getProgramme('pgd')

export default function PGD() {
  usePageMeta({
    title: programme.title,
    path: programme.path,
    description: `${programme.title} (PGD) at the Centre for Safety Education, FUPRE. 12 months. Entry: a Bachelor's degree or HND.`,
  })

  return (
    <ProgrammeLayout programme={programme}>
      <ProgrammeSection id="overview" title="Overview">
        <p>{programme.summary}</p>
      </ProgrammeSection>

      <ProgrammeSection id="eligibility" title="Eligibility">
        <p>{programme.audience}</p>
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
            <PendingList label="Official module list to be published by the Centre." />
          )}
        </div>
      </ProgrammeSection>

      <ProgrammeSection id="career-relevance" title="Career relevance">
        <p className="mb-5">{programme.relevance}</p>
        <CareersCompact />
      </ProgrammeSection>

      <ProgrammeSection id="requirements" title="Admission requirements">
        <RequirementsBlock programme={programme} />
      </ProgrammeSection>
    </ProgrammeLayout>
  )
}
