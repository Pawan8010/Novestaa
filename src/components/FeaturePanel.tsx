import { ArrowRight } from 'lucide-react';
import { siteConfig } from '../config/site';
import { DrawingHairline } from './DrawingHairline';
import { GlowCard } from './GlowCard';

interface FeaturePanelProps {
  onSelectServiceQuote: (serviceTitle: string) => void;
}

const SERVICE_CHIP_LABELS: Record<string, string> = {
  'web-development': 'Website and Web Apps',
  'online-product-building': 'Online Product Building',
  'social-media-marketing': 'Social Media',
  'seo-google-ranking': 'SEO',
  'google-maps-gbp': 'Google Maps',
  'multi-platform-presence': 'Platform Presence',
  'ai-automation': 'AI and Automation',
};

export function FeaturePanel({ onSelectServiceQuote }: FeaturePanelProps) {
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="scroll-mt-20 bg-[var(--color-bg)] text-[var(--color-ink)]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-14 sm:py-20">
          <p className="mono-eyebrow text-[#00a3ff]">
            SERVICES
          </p>
          <h2 id="services-heading" className="heading-section resend-gradient-text mt-3">
            Everything built to bring customers online.
          </h2>
        </div>

        <DrawingHairline />

        {siteConfig.featurePanels.map((panel, index) => {
          const mediaOnLeft = index % 2 === 1;

          return (
            <div key={panel.id}>
              <div className="grid grid-cols-1 items-center gap-8 py-14 sm:py-16 lg:grid-cols-12 lg:gap-16 lg:py-20">
                <div className={`lg:col-span-5 ${mediaOnLeft ? 'lg:order-2' : 'lg:order-1'}`}>
                  <span className="mono-eyebrow text-[var(--color-ink-secondary)]">
                    0{index + 1} · CAPABILITY
                  </span>
                  <h3 className="mt-3 text-[26px] font-medium leading-tight tracking-[-0.03em] text-[var(--color-text-tertiary)] sm:text-[34px] lg:text-[36px]">
                    {panel.title}
                  </h3>
                  <p className="mt-4 max-w-md text-[15px] leading-7 text-[var(--color-ink-secondary)] sm:text-[17px] sm:leading-7">
                    {panel.description}
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectServiceQuote(panel.preselectService)}
                      className="resend-btn-secondary inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-2.5 text-[14px] font-medium"
                    >
                      <span>{panel.ctaLabel}</span>
                      <ArrowRight className="h-4 w-4 text-[#00a3ff]" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className={`lg:col-span-7 ${mediaOnLeft ? 'lg:order-1' : 'lg:order-2'}`}>
                  <GlowCard title={panel.title} />
                </div>
              </div>

              <DrawingHairline />
            </div>
          );
        })}

        {/* Single wrapping row of 7 compact service chips */}
        <div className="py-10 sm:py-12">
          <div
            role="list"
            aria-label="All seven services"
            className="flex flex-wrap items-center gap-2.5"
          >
            {siteConfig.services.map((service) => {
              const label = SERVICE_CHIP_LABELS[service.id] || service.title;
              return (
                <a
                  key={service.id}
                  role="listitem"
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectServiceQuote(service.title);
                  }}
                  className="resend-btn-secondary inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium"
                >
                  <span>{label}</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 text-[#00a3ff]"
                    aria-hidden="true"
                  />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <DrawingHairline />
    </section>
  );
}
