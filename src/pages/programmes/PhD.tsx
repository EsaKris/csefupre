import { usePageMeta } from '../../lib/seo'
import { getProgramme } from '../../config/programmes'
import {
  FocusList,
  PendingList,
  ProgrammeLayout,
  ProgrammeSection,
  RequirementsBlock,
} from '../../components/programmes/ProgrammeLayout'
import { Tbd } from '../../components/ui/Tbd'

const programme = getProgramme('phd')

export default function PhD() {
  usePageMeta({
    title: 'Doctor of Philosophy in Health, Environment, Safety and Security',
    path: programme.path,
    description:
      "Ph.D. in Health, Environment, Safety and Security at the Centre for Safety Education, FUPRE. For candidates with a Master's degree in Health, Environment, Safety, or a related discipline.",
  })

  return (
    <ProgrammeLayout programme={programme}>
      <ProgrammeSection id="research-orientation" title="Research orientation">
        <p>{programme.summary}</p>
        <p className="mt-4">
          Programme duration: <Tbd>to be confirmed by the Centre</Tbd>
        </p>
      </ProgrammeSection>

      <ProgrammeSection id="eligibility" title="Eligibility">
        <p>{programme.audience}</p>
        <div className="mt-6">
          <RequirementsBlock programme={programme} />
        </div>
      </ProgrammeSection>

      <ProgrammeSection id="specialization" title="Research specialization">
        <p className="mb-5">Research is undertaken within Health, Environment, Safety and Security.</p>
        <FocusList items={programme.focus} />
        <div className="mt-6">
          <PendingList label="Research areas, supervision arrangements and proposal requirements to be published by the Centre." />
        </div>
      </ProgrammeSection>

      <ProgrammeSection id="relevance" title="Academic and professional relevance">
        <p>{programme.relevance}</p>
      </ProgrammeSection>
    </ProgrammeLayout>
  )
}
