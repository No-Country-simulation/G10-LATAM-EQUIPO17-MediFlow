import LandingHeader from '../components/LandingHeader'
import HeroSection from '../components/HeroSection'
import HowItWorksSection from '../components/HowItWorksSection'
import FeaturesSection from '../components/FeaturesSection'
import SecuritySection from '../components/SecuritySection'
import LandingFooter from '../components/LandingFooter'

function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <SecuritySection />
      </main>
      <LandingFooter />
    </>
  )
}

export default LandingPage
