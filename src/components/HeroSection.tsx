import { ArrowRight } from 'lucide-react';
import { siteConfig } from '../config/site';
import { DrawingHairline } from './DrawingHairline';
import { HeroParticlesCanvas } from './HeroParticlesCanvas';
import { NovestaLogo } from './NovestaLogo';

interface HeroSectionProps {
  onConsultationClick: () => void;
}

export function HeroSection({ onConsultationClick }: HeroSectionProps) {
  const whatsappHref = `${siteConfig.contact.whatsappUrl}?text=${encodeURIComponent(
    siteConfig.contact.whatsappPrefillText
  )}`;

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="resend-spotlight-hero relative overflow-hidden bg-[var(--color-bg)] pt-16 text-[var(--color-ink)] sm:pt-24 lg:pt-32"
    >
      {/* Subtle architectural obsidian dot grid + interactive sky-blue particle field */}
      <div aria-hidden="true" className="novesta-arch-grid pointer-events-none absolute inset-0 opacity-60" />
      <HeroParticlesCanvas />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        {/* Centered Novesta Emblem & Wordmark Lockup */}
        <NovestaLogo variant="hero" />

        {/* Resend-Style Metallic Gradient Display Headline (76.8px max) */}
        <h1
          id="hero-heading"
          className="heading-hero resend-gradient-text mt-7 max-w-4xl text-center sm:mt-9"
        >
          {siteConfig.hero.headline}
        </h1>

        <p className="mt-5 max-w-2xl text-[16px] leading-7 text-[var(--color-ink-secondary)] sm:mt-6 sm:text-[18px] sm:leading-7">
          {siteConfig.hero.subheadline}
        </p>

        {/* Two Centered High-Contrast CTAs */}
        <div className="mt-8 flex w-full max-w-xs flex-col items-stretch gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-3.5">
          <button
            type="button"
            onClick={onConsultationClick}
            className="resend-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 py-3 text-[15px] font-medium sm:w-auto"
          >
            <span>{siteConfig.hero.primaryCta}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="resend-btn-secondary inline-flex min-h-[48px] w-full items-center justify-center whitespace-nowrap rounded-full px-7 py-3 text-[15px] font-medium sm:w-auto"
          >
            {siteConfig.hero.secondaryCta}
          </a>
        </div>

        {/* Structured Capability Strip (real Novesta pillars, zero clutter) */}
        <div className="mt-14 grid w-full max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-border)] sm:mt-16 sm:grid-cols-4">
          {[
            { label: 'Websites & Apps', detail: 'Fast conversion storefronts' },
            { label: 'Google Maps & SEO', detail: 'Top local search visibility' },
            { label: 'Direct Ordering', detail: 'Zero-commission booking flows' },
            { label: 'AI WhatsApp', detail: 'Automated 24/7 lead replies' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-black/90 px-4 py-4 text-left transition-colors duration-200 hover:bg-[#08090d]"
            >
              <p className="text-[13px] font-medium text-[var(--color-text-tertiary)]">
                {item.label}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--color-ink-secondary)]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      <DrawingHairline className="relative z-10 mt-16 sm:mt-24 lg:mt-28" />
    </section>
  );
}
