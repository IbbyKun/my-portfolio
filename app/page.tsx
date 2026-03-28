import { HeroSection } from "@/components/portfolio/hero-section"
import { ExperienceSection } from "@/components/portfolio/experience-section"
import { ProjectsSection } from "@/components/portfolio/projects-section"
import { SkillsSection } from "@/components/portfolio/skills-section"
import { ContactSection } from "@/components/portfolio/contact-section"
import { Footer } from "@/components/portfolio/footer"
import { ParallaxContainer } from "@/components/portfolio/parallax-container"

export default function PortfolioPage() {
  return (
    <ParallaxContainer>
      <HeroSection />
      <ExperienceSection parallaxFlat />
      <ProjectsSection parallaxFlat />
      {/* Normal document scroll through full content; Contact still stacks on top after */}
      <SkillsSection parallaxFlat parallaxScaleWithNext />
      <ContactSection />
      <Footer parallaxFlat />
    </ParallaxContainer>
  )
}
