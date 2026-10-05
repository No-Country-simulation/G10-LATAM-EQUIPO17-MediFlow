import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import LandingHeader from '../components/LandingHeader'
import HeroSection from '../components/HeroSection'
import HowItWorksSection from '../components/HowItWorksSection'
import FeaturesSection from '../components/FeaturesSection'
import SecuritySection from '../components/SecuritySection'
import LandingFooter from '../components/LandingFooter'

gsap.registerPlugin(ScrollTrigger)

function createLandingScrollAnimations() {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .fromTo('.hero__badge', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 })
    .fromTo('.hero__title', { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.35')
    .fromTo('.hero__description', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
    .fromTo('.hero__actions', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.42')
    .fromTo('.hero__checks > .hero__check', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 }, '-=0.42')
    .fromTo('.hero__preview', { opacity: 0, x: 28 }, { opacity: 1, x: 0, duration: 0.85, ease: 'power2.out' }, '-=0.75')
    .fromTo('.agent__doc', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.45')
    .fromTo('.agent__figure', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.4')

  gsap.fromTo(
    '.landing-section--how .landing-section__heading',
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.landing-section--how', start: 'top 75%', once: true },
    }
  )
  gsap.fromTo(
    '.landing-steps > .landing-step',
    { opacity: 0, y: 26 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.14,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.landing-steps', start: 'top 78%', once: true },
    }
  )

  gsap.fromTo(
    '.landing-section--tinted .landing-section__heading',
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.landing-section--tinted', start: 'top 78%', once: true },
    }
  )
  gsap.fromTo(
    '.landing-features > .landing-feature',
    { opacity: 0, y: 26 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.landing-features', start: 'top 80%', once: true },
    }
  )

  gsap.fromTo(
    '.landing-security__seal',
    { opacity: 0, scale: 0.92 },
    {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.landing-security', start: 'top 78%', once: true },
    }
  )
  gsap.fromTo(
    '.landing-security__content',
    { opacity: 0, y: 26 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.landing-security', start: 'top 78%', once: true },
    }
  )

  gsap.fromTo(
    '.landing-footer',
    { opacity: 0, y: 18 },
    {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'sine.out',
      scrollTrigger: { trigger: '.landing-footer', start: 'top 92%', once: true },
    }
  )
}

function LandingPage() {
  const landingRef = useRef(null)

  useLayoutEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return undefined

    const ctx = gsap.context(createLandingScrollAnimations, landingRef)

    const refreshOnLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', refreshOnLoad)

    return () => {
      window.removeEventListener('load', refreshOnLoad)
      ctx.revert()
    }
  }, [])

  return (
    <div ref={landingRef}>
      <LandingHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <SecuritySection />
      </main>
      <LandingFooter />
    </div>
  )
}

export default LandingPage