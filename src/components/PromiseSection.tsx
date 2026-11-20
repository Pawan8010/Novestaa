import { ArrowRight } from 'lucide-react';
import { siteConfig } from '../config/site';

interface PromiseSectionProps {
  onConsultationClick: () => void;
}

export function PromiseSection({ onConsultationClick }: PromiseSectionProps) {
  const { promise } = siteConfig;

  return (
    <section
      aria-labelledby="promise-heading"
      className="resend-spotlight-subtle border-b border-[var(--color-border)] bg-[var(--color-bg)] py-16 text-[var(--color-ink)] sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left: Structured Display Statement */}
          <div className="lg:col-span-7">
            <p className="mono-eyebrow text-[#00a3ff]">
              {promise.eyebrow}
            </p>

            <h2
              id="promise-heading"
              className="mt-4 font-medium leading-[1.04] tracking-[-0.04em] text-[var(--color-text-tertiary)]"
              style={{ fontSize: 'clamp(34px, 5vw, 68px)' }}
            >
              <span className="resend-gradient-text block">{promise.line1}</span>
              <span className="resend-gradient-text block">{promise.line2}</span>
              <span className="mt-1 block text-[#00a3ff]">
                websites, search &amp; AI growth.
              </span>
            </h2>
          </div>

          {/* Right: Business Growth Guarantee */}
          <div className="lg:col-span-5">
            <p className="text-[18px] font-medium leading-7 tracking-tight text-[var(--color-text-tertiary)] sm:text-[21px]">
              {promise.guaranteeHeadline}
            </p>
            <p className="mt-4 text-[15px] leading-7 text-[var(--color-ink-secondary)] sm:text-[16px]">
              {promise.guaranteeCopy}
            </p>

            <div className="mt-7">
              <button
                type="button"
                onClick={onConsultationClick}
                className="resend-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-[14px] font-medium sm:w-auto"
              >
                <span>Start Growing Your Business</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Clean 3-column commitment cards */}
        <div className="mt-14 grid grid-cols-1 gap-5 border-t border-[var(--color-border)] pt-12 md:grid-cols-3">
          {promise.commitments.map((item) => (
            <div
              key={item.code}
              className="novesta-card p-6"
            >
              <p className="mono-eyebrow text-[#00a3ff]">
                {item.code}
              </p>
              <h3 className="mt-2.5 text-[18px] font-medium tracking-tight text-[var(--color-text-tertiary)]">
                {item.title}
              </h3>
              <p className="mt-2 text-[14px] leading-6 text-[var(--color-ink-secondary)]">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
