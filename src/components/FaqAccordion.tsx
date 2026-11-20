import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { siteConfig } from '../config/site';

export function FaqAccordion() {
  const [openId, setOpenId] = useState<string | null>(siteConfig.faqs[0]?.id ?? null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const total = siteConfig.faqs.length;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowDown') {
      nextIndex = (index + 1) % total;
    } else if (event.key === 'ArrowUp') {
      nextIndex = (index - 1 + total) % total;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = total - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      buttonRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] py-16 text-[var(--color-ink)] sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="mono-eyebrow text-[#00a3ff]">
              FAQ
            </p>
            <h2
              id="faq-heading"
              className="heading-section resend-gradient-text mt-3"
            >
              Clear answers on pricing, timelines, SEO, and ownership.
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-6 text-[var(--color-ink-secondary)]">
            Straightforward terms, full asset ownership, and measurable deliverables from day one.
          </p>
        </div>

        <div className="mt-12 divide-y divide-[var(--color-border)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-black">
          {siteConfig.faqs.map((faq, index) => {
            const isOpen = openId === faq.id;
            const panelId = `faq-panel-${faq.id}`;
            const buttonId = `faq-button-${faq.id}`;

            return (
              <div key={faq.id} className="px-6 sm:px-8">
                <h3>
                  <button
                    ref={(el) => {
                      buttonRefs.current[index] = el;
                    }}
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => handleToggle(faq.id)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-4 py-5 text-left text-[16px] font-medium text-[var(--color-text-tertiary)] transition-colors hover:text-[#d6ebfd] sm:text-[17px]"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 shrink-0 text-[#00a3ff]" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0 text-[var(--color-ink-secondary)]" aria-hidden="true" />
                    )}
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="pb-6 pr-6 text-[15px] leading-7 text-[var(--color-ink-secondary)] sm:pr-8"
                >
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
