import {
  ArrowRight,
  Building2,
  Coffee,
  Rocket,
  Stethoscope,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { siteConfig, type IndustryItem } from '../config/site';
import { DrawingHairline } from './DrawingHairline';

interface IndustriesSectionProps {
  onSelectIndustry: (businessType: string) => void;
}

const industryIconMap: Record<IndustryItem['iconName'], typeof Building2> = {
  Building2,
  UtensilsCrossed,
  Coffee,
  Store,
  Stethoscope,
  Rocket,
};

const businessTypeMap: Record<string, string> = {
  hotels: 'Hotel / Resort',
  restaurants: 'Restaurant / Cloud Kitchen',
  cafes: 'Cafe / Bakery',
  retail: 'Retail Shop / Showroom',
  clinics: 'Clinic / Healthcare',
  startups: 'Startup / Tech Product',
};

export function IndustriesSection({ onSelectIndustry }: IndustriesSectionProps) {
  return (
    <section
      id="industries"
      aria-labelledby="industries-heading"
      className="bg-[var(--color-bg)] pt-16 text-[var(--color-ink)] sm:pt-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="mono-eyebrow text-[#00a3ff]">
            INDUSTRIES
          </p>
          <h2 id="industries-heading" className="heading-section resend-gradient-text mt-3">
            Built for local businesses.
          </h2>
          <p className="mt-3 text-[16px] leading-6 text-[var(--color-ink-secondary)]">
            Tailored ordering, bookings, and search visibility for your category.
          </p>
        </div>

        <div
          role="list"
          aria-label="Industries we serve"
          className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {siteConfig.industries.map((industry) => {
            const Icon = industryIconMap[industry.iconName];
            return (
              <article
                key={industry.id}
                role="listitem"
                className="novesta-card flex flex-col justify-between p-6"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-black text-[#00a3ff]">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h3 className="text-[18px] font-medium tracking-tight text-[var(--color-text-tertiary)]">
                      {industry.name}
                    </h3>
                  </div>

                  <p className="mt-4 text-[14px] leading-6 text-[var(--color-ink-secondary)]">
                    {industry.outcome}
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => onSelectIndustry(businessTypeMap[industry.id] || 'Other')}
                    className="inline-flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-1 text-[14px] font-medium text-[#d6ebfd] transition-colors hover:text-[#00a3ff]"
                  >
                    <span>Plan for {industry.name.split(' ')[0]}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <DrawingHairline className="mt-16 sm:mt-24" />
    </section>
  );
}
