import { Suspense, lazy, useState } from 'react';
import { ArrowRight, Check, CreditCard, MessageCircle } from 'lucide-react';
import {
  buildPlanWhatsappUrl,
  formatCurrencyValue,
  siteConfig,
  type PricingPlan,
} from '../config/site';
import { DrawingHairline } from './DrawingHairline';

const PaymentModal = lazy(() =>
  import('./PaymentModal').then((m) => ({ default: m.PaymentModal }))
);

interface PricingSectionProps {
  onSelectPlan: (planName: string) => void;
}

interface PlanCardProps {
  plan: PricingPlan;
  onPayNow: (plan: PricingPlan) => void;
  onSelectPlan: (planName: string) => void;
}

function PlanCard({ plan, onPayNow, onSelectPlan }: PlanCardProps) {
  const savings = Math.max(0, plan.originalPrice - plan.price);
  const savingsPct =
    plan.originalPrice > 0 ? Math.round((savings / plan.originalPrice) * 100) : 0;
  const formattedOriginal = formatCurrencyValue(plan.originalPrice);
  const formattedFinal = formatCurrencyValue(plan.price);
  const formattedSavings = formatCurrencyValue(savings);
  const whatsappUrl = buildPlanWhatsappUrl(plan);
  const isFeatured = plan.featured;
  const contactPlanOption = `${plan.name} (${formattedFinal})`;

  return (
    <article
      className={`relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] p-6 transition-colors duration-200 sm:p-8 ${
        isFeatured
          ? 'novesta-glow-surface border border-[#00a3ff]/55 text-[var(--color-ink)] shadow-[var(--shadow-glow)]'
          : 'novesta-card text-[var(--color-ink)]'
      }`}
    >
      {isFeatured && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00a3ff] to-transparent"
        />
      )}

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium">
          <span className={isFeatured ? 'text-[#00a3ff]' : 'text-[var(--color-ink-secondary)]'}>
            {plan.tier}
          </span>
          {plan.badge && (
            <>
              <span aria-hidden="true" className="text-[var(--color-ink-secondary)]">·</span>
              <span
                className={
                  isFeatured
                    ? 'rounded-full border border-[#00a3ff]/40 bg-[#00a3ff]/15 px-2.5 py-0.5 text-[11px] text-[#d6ebfd]'
                    : 'text-[#d6ebfd]'
                }
              >
                {plan.badge}
              </span>
            </>
          )}
        </div>

        <h3 className="mt-2.5 text-[21px] font-medium tracking-tight text-[var(--color-text-tertiary)]">
          {plan.name}
        </h3>

        <div className="mt-5">
          {savings > 0 && (
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[14px] tabular-nums">
              <span className="line-through text-[var(--color-ink-secondary)]">
                <span className="sr-only">Original price: </span>
                {formattedOriginal}
              </span>
              <span className="font-medium text-[#d6ebfd]">
                · Save {formattedSavings} ({savingsPct}%)
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-2.5">
            <span className="text-[40px] font-medium leading-none tracking-[-0.03em] text-[var(--color-text-tertiary)] tabular-nums sm:text-[46px]">
              {formattedFinal}
            </span>
            <span className="text-[14px] text-[var(--color-ink-secondary)]">
              {plan.billing}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[14px] leading-6 text-[var(--color-ink-secondary)]">
          {plan.tagline}
        </p>

        <ul className="mt-6 space-y-2.5 border-t border-[var(--color-border)] pt-5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-[14px] leading-6 text-[var(--color-ink)]">
              <Check
                className="mt-1 h-4 w-4 shrink-0 text-[#00a3ff]"
                aria-hidden="true"
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-7 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => onPayNow(plan)}
          className="resend-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-[14px] font-medium"
        >
          <CreditCard className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{plan.cta}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSelectPlan(contactPlanOption)}
            className="resend-btn-secondary inline-flex min-h-[42px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium"
          >
            <span>Book Call</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="resend-btn-secondary inline-flex min-h-[42px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const [filter, setFilter] = useState<'all' | 'full-service' | 'website-only'>('all');
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);

  const allPlans = siteConfig.pricing.plans;
  const fullServicePlans = allPlans.filter((p) => p.category === 'full-service');
  const websiteOnlyPlans = allPlans.filter((p) => p.category === 'website-only');

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="resend-spotlight-subtle scroll-mt-20 bg-[var(--color-bg)] py-16 text-[var(--color-ink)] sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="mono-eyebrow text-[#00a3ff]">
              PRICING &amp; ONLINE PAYMENT
            </p>
            <h2 id="pricing-heading" className="heading-section resend-gradient-text mt-3">
              Simple pricing for every business size
            </h2>
            <p className="mt-3 text-[16px] leading-6 text-[var(--color-ink-secondary)] sm:text-[17px]">
              Choose a Small, Medium, or Large Business package. Pay securely online with Razorpay
              or book a free consultation first.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter pricing plans"
            className="inline-flex w-full flex-wrap gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-1 sm:w-auto"
          >
            {[
              { id: 'all' as const, label: 'All Plans (5)' },
              { id: 'full-service' as const, label: '2-Year Services (3)' },
              { id: 'website-only' as const, label: 'Website Only (2)' },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[40px] flex-1 whitespace-nowrap rounded-[var(--radius-sm)] px-4 py-2 text-[13px] font-medium transition-colors sm:flex-none ${
                    active
                      ? 'bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-ink)]'
                      : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {(filter === 'all' || filter === 'full-service') && (
          <div className="mt-10 md:mt-12">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-border)] pb-3">
              <h3 className="text-[18px] font-medium text-[var(--color-text-tertiary)]">
                Complete Growth &amp; 2-Year Support Plans
              </h3>
              <span className="text-[13px] text-[var(--color-ink-secondary)] tabular-nums">
                Small ₹7k · Medium ₹17k · Large ₹30k
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
              {fullServicePlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onPayNow={setCheckoutPlan}
                  onSelectPlan={onSelectPlan}
                />
              ))}
            </div>
          </div>
        )}

        {(filter === 'all' || filter === 'website-only') && (
          <div className="mt-10 md:mt-12">
            <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-border)] pb-3">
              <h3 className="text-[18px] font-medium text-[var(--color-text-tertiary)]">
                Website-Only Packages
              </h3>
              <span className="text-[13px] text-[var(--color-ink-secondary)] tabular-nums">
                Small ₹5k · Medium ₹10k
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-7">
              {websiteOnlyPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onPayNow={setCheckoutPlan}
                  onSelectPlan={onSelectPlan}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-1 text-[13px] text-[var(--color-ink-secondary)] sm:flex-row sm:items-center sm:justify-between">
          <p>{siteConfig.pricing.note}</p>
          {siteConfig.pricing.offerEndsOn && (
            <p className="tabular-nums">
              Offer valid through{' '}
              {new Date(siteConfig.pricing.offerEndsOn).toLocaleDateString(
                siteConfig.pricing.locale,
                { year: 'numeric', month: 'short', day: 'numeric' }
              )}
            </p>
          )}
        </div>
      </div>

      <DrawingHairline className="mt-16 sm:mt-24" />

      {checkoutPlan && (
        <Suspense fallback={null}>
          <PaymentModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />
        </Suspense>
      )}
    </section>
  );
}
