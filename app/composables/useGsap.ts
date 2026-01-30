import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const useGsap = () => {
  const isClient = import.meta.client

  // Register plugins on client side
  if (isClient) {
    gsap.registerPlugin(ScrollTrigger)
  }

  // Fade in animation
  const fadeIn = (
    element: string | Element | Element[],
    options: gsap.TweenVars = {}
  ) => {
    if (!isClient) return null

    return gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
        ...options,
      }
    )
  }

  // Stagger children animation
  const staggerIn = (
    parent: string | Element,
    childSelector: string,
    options: gsap.TweenVars = {}
  ) => {
    if (!isClient) return null

    return gsap.fromTo(
      `${parent} ${childSelector}`,
      {
        opacity: 0,
        y: 30,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        ...options,
      }
    )
  }

  // Scroll-triggered animation
  const scrollFadeIn = (
    element: string | Element,
    options: gsap.TweenVars = {}
  ) => {
    if (!isClient) return null

    return gsap.fromTo(
      element,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
        ...options,
      }
    )
  }

  // Scroll-triggered stagger
  const scrollStaggerIn = (
    parent: string | Element,
    childSelector: string,
    options: gsap.TweenVars = {}
  ) => {
    if (!isClient) return null

    const children = typeof parent === 'string'
      ? document.querySelectorAll(`${parent} ${childSelector}`)
      : parent.querySelectorAll(childSelector)

    return gsap.fromTo(
      children,
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: parent,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
        ...options,
      }
    )
  }

  // Counter animation (for numbers)
  const animateCounter = (
    element: string | Element,
    endValue: number,
    options: {
      duration?: number
      prefix?: string
      suffix?: string
    } = {}
  ) => {
    if (!isClient) return null

    const { duration = 2, prefix = '', suffix = '' } = options
    const obj = { value: 0 }

    return gsap.to(obj, {
      value: endValue,
      duration,
      ease: 'power1.out',
      onUpdate: () => {
        const el = typeof element === 'string'
          ? document.querySelector(element)
          : element
        if (el) {
          el.textContent = `${prefix}${Math.round(obj.value)}${suffix}`
        }
      },
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    })
  }

  // Hero text reveal
  const heroReveal = (containerSelector: string) => {
    if (!isClient) return null

    const tl = gsap.timeline()

    tl.fromTo(
      `${containerSelector} .hero-title`,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    )
      .fromTo(
        `${containerSelector} .hero-subtitle`,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo(
        `${containerSelector} .hero-cta`,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      )

    return tl
  }

  // Cleanup function
  const killAll = () => {
    if (!isClient) return
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    gsap.killTweensOf('*')
  }

  return {
    gsap,
    ScrollTrigger,
    fadeIn,
    staggerIn,
    scrollFadeIn,
    scrollStaggerIn,
    animateCounter,
    heroReveal,
    killAll,
  }
}
