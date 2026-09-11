import { usePageMeta } from '../lib/seo'
import { HomeHero } from '../components/home/HomeHero'
import {
  AboutIntro,
  ApplyCta,
  CareersPreview,
  ContactSection,
  FocusAreas,
  Partnership,
  PracticalTraining,
  ProgrammesOverview,
  RequirementsSummary,
  WhyChoose,
} from '../components/home/HomeSections'

export default function Home() {
  usePageMeta({
    title: 'Centre for Safety Education',
    path: '/',
    description:
      "Professional Diploma, Postgraduate Diploma, Master's and Ph.D. programmes in Health, Environment, Safety and Security at the Centre for Safety Education, Federal University of Petroleum Resources, Effurun.",
  })

  return (
    <>
      <HomeHero />
      <AboutIntro />
      <ProgrammesOverview />
      <WhyChoose />
      <PracticalTraining />
      <FocusAreas />
      <CareersPreview />
      <Partnership />
      <RequirementsSummary />
      <ApplyCta />
      <ContactSection />
    </>
  )
}
