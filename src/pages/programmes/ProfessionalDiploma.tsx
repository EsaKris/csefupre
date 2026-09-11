import { usePageMeta } from '../../lib/seo'
import { getProgramme } from '../../config/programmes'
import { aboutCopy } from '../../config/about'
import {
  FocusList,
  PendingList,
  ProgrammeLayout,
  ProgrammeSection,
  RequirementsBlock,
} from '../../components/programmes/ProgrammeLayout'
import { CareersCompact } from '../../components/programmes/CareersCompact'

const programme = getProgramme('professional-diploma')

export default function ProfessionalDiploma() {
  usePageMeta({
    title: programme.title,
    path: programme.path,
    description: `${programme.title} at the Centre for Safety Education, FUPRE. 12 months. Entry: five O'Level credit passes including Mathematics and English.`,
  })

  return (
    <ProgrammeLayout programme={programme}>
      <ProgrammeSection id="overview" title="Programme overview">
        <p>{programme.summary}</p>
        <p className="mt-4">{aboutCopy.practicalTraining}</p>
      </ProgrammeSection>

      <ProgrammeSection id="who-should-apply" title="Who should apply">
        <p>{programme.audience}</p>
      </ProgrammeSection>

      <ProgrammeSection id="requirements" title="Admission requirements">
        <RequirementsBlock programme={programme} />
      </ProgrammeSection>

      <ProgrammeSection id="objectives" title="Programme objectives">
        {programme.objectives ? (
          <ul className="list-disc space-y-2 pl-5">
            {programme.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        ) : (
          <PendingList label="Official programme objectives to be supplied by the Centre." />
        )}
      </ProgrammeSection>

      <ProgrammeSection id="areas-covered" title="Areas covered">
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

      <ProgrammeSection id="careers" title="Career opportunities">
        <p className="mb-5">{programme.relevance}</p>
        <CareersCompact />
      </ProgrammeSection>
    </ProgrammeLayout>
  )
}
