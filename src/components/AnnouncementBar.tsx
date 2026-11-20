import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { formatCurrencyValue, siteConfig } from '../config/site';

const STORAGE_KEY = 'novesta_announcement_dismissed_v1';

interface AnnouncementBarProps {
  onSeePricing: () => void;
}

export function AnnouncementBar({ onSeePricing }: AnnouncementBarProps) {
  const activeOfferPlan = siteConfig.pricing.plans.find(
    (plan) => plan.featured && plan.originalPrice > plan.price
  );

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && window.sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(STORAGE_KEY) === '1') {
        setDismissed(true);
      }
    } catch {
      // Ignore storage failures in private/restricted browsers
    }
  }, []);

  if (!activeOfferPlan || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Ignore storage write failure
    }
  };

  const formattedCurrent = formatCurrencyValue(activeOfferPlan.price);
  const formattedOriginal = formatCurrencyValue(activeOfferPlan.originalPrice);

  return (
    <div
      role="region"
      aria-label="Pricing announcement"
      className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-ink)]"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-5">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#00a3ff]/40 bg-[#00a3ff]/15 px-2.5 py-0.5 text-[11px] font-medium text-[#d6ebfd]">
            <Sparkles className="h-3 w-3 shrink-0 text-[#00a3ff]" aria-hidden="true" />
            <span>OFFER</span>
          </span>

          <p className="text-[var(--color-ink)]">
            {activeOfferPlan.name} plan now{' '}
            <span className="font-medium text-[var(--color-text-tertiary)] tabular-nums">
              {formattedCurrent} {activeOfferPlan.billing}
            </span>
            , was{' '}
            <span className="line-through tabular-nums text-[var(--color-ink-secondary)]">
              {formattedOriginal}
            </span>
          </p>

          <a
            href="/#pricing"
            onClick={(e) => {
              e.preventDefault();
              onSeePricing();
            }}
            className="inline-flex min-h-[36px] shrink-0 items-center gap-1 whitespace-nowrap font-medium text-[#d6ebfd] transition-colors hover:text-[#00a3ff]"
          >
            <span>See pricing</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
          className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-ink-secondary)] transition-colors hover:bg-white/[0.06] hover:text-[var(--color-text-tertiary)]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
