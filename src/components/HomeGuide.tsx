import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { EXAM_PRESETS, PLACEHOLDER_EXAM_ROWS } from '../config/examPresets';
import { HOME_GUIDE_DATA, TOOL_ROUTES, type ToolRouteConfig } from '../content/guides';

interface HomeGuideProps {
  onNavigate: (path: string) => void;
}

export const HomeGuide: React.FC<HomeGuideProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const activePresets = EXAM_PRESETS.filter((p) => p.status === 'active');

  return (
    <div className="space-y-12">
      {/* Intro & Local Processing Overview */}
      <section aria-labelledby="home-guide-title" className="pdf-card p-6 sm:p-8">
        <h2
          id="home-guide-title"
          className="text-xl font-bold tracking-tight sm:text-2xl"
          style={{ color: 'var(--color-navy)' }}
        >
          {HOME_GUIDE_DATA.introTitle}
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-7 sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
          {HOME_GUIDE_DATA.introParagraphs.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {/* Dedicated Tool Links */}
        <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
            Dedicated Exam &amp; PDF Guides
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {TOOL_ROUTES.map((route) => (
              <a
                key={route.path}
                href={route.path}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(route.path);
                }}
                className="pdf-btn-secondary inline-flex min-h-[40px] items-center px-3.5 py-2 text-xs font-semibold"
              >
                {route.navLabel}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Auto-built Exam Preset Comparison Table */}
      <section aria-labelledby="exam-comparison-heading" className="pdf-card overflow-hidden">
        <div className="border-b p-6 sm:px-8" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="exam-comparison-heading"
              className="text-lg font-bold tracking-tight sm:text-xl"
              style={{ color: 'var(--color-navy)' }}
            >
              Indian Exam Photo &amp; Signature Size Comparison
            </h2>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-saffron-text)' }}>
              Always check the latest official notification
            </span>
          </div>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Built directly from our verified preset configuration. Unverified cycles are clearly marked so you can confirm from the official brochure and use Custom Size.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr
                className="border-b text-xs font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <th className="px-6 py-3.5">Exam</th>
                <th className="px-4 py-3.5">Document</th>
                <th className="px-4 py-3.5">Dimensions</th>
                <th className="px-4 py-3.5">File Size (JPG)</th>
                <th className="px-4 py-3.5">DPI</th>
                <th className="px-4 py-3.5">Verified</th>
                <th className="px-6 py-3.5">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {activePresets.map((preset) => (
                <tr key={preset.id} className="hover:bg-slate-50/70">
                  <td className="px-6 py-3.5 font-semibold" style={{ color: 'var(--color-navy)' }}>
                    {preset.exam}
                  </td>
                  <td className="px-4 py-3.5 capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                    {preset.type}
                  </td>
                  <td className="tabular-nums px-4 py-3.5" style={{ color: 'var(--color-navy)' }}>
                    {preset.dimensionLabel}
                  </td>
                  <td className="tabular-nums px-4 py-3.5 font-medium" style={{ color: 'var(--color-navy)' }}>
                    {preset.minKB}–{preset.maxKB} KB
                  </td>
                  <td className="tabular-nums px-4 py-3.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {preset.dpi}
                  </td>
                  <td className="tabular-nums px-4 py-3.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {preset.lastVerified}
                  </td>
                  <td className="px-6 py-3.5 text-xs">
                    {preset.sourceUrl && (
                      <a
                        href={preset.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold underline underline-offset-2"
                        style={{ color: 'var(--color-saffron-text)' }}
                      >
                        Portal
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {PLACEHOLDER_EXAM_ROWS.map((row) => (
                <tr key={row.id} style={{ backgroundColor: 'var(--color-bg)' }}>
                  <td className="px-6 py-3.5 font-semibold" style={{ color: 'var(--color-navy)' }}>
                    {row.exam}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Photo &amp; Signature
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.photoSpec}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.signatureSpec}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    —
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.lastVerified}
                  </td>
                  <td className="px-6 py-3.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {row.sourceUrl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rejection Avoidance Steps */}
      <section aria-labelledby="rejection-steps-heading" className="space-y-4">
        <h2
          id="rejection-steps-heading"
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--color-navy)' }}
        >
          {HOME_GUIDE_DATA.rejectionTitle}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {HOME_GUIDE_DATA.rejectionSteps.map((step) => (
            <article key={step.title} className="pdf-card p-5">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {step.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* 6-Question FAQ */}
      <section aria-labelledby="faq-heading" className="pdf-card p-6 sm:p-8">
        <h2
          id="faq-heading"
          className="text-xl font-bold tracking-tight"
          style={{ color: 'var(--color-navy)' }}
        >
          Frequently Asked Questions
        </h2>
        <div className="mt-5 divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {HOME_GUIDE_DATA.faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.question} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="flex min-h-[44px] w-full items-center justify-between gap-4 text-left text-sm font-semibold sm:text-base"
                  style={{ color: 'var(--color-navy)' }}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    className={`h-4.5 w-4.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--color-text-secondary)' }}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p className="mt-2.5 pr-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

interface ToolRouteGuideProps {
  route: ToolRouteConfig;
  onNavigate: (path: string) => void;
}

export const ToolRouteGuide: React.FC<ToolRouteGuideProps> = ({ route, onNavigate }) => {
  const otherRoutes = TOOL_ROUTES.filter((r) => r.path !== route.path);

  return (
    <article className="pdf-card space-y-6 p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: 'var(--color-navy)' }}>
        {route.guideTitle}
      </h2>

      {route.sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h3 className="text-base font-semibold sm:text-lg" style={{ color: 'var(--color-navy)' }}>
            {section.heading}
          </h3>
          {section.paragraphs.map((p, idx) => (
            <p key={idx} className="text-sm leading-7 sm:text-[15px]" style={{ color: 'var(--color-text-secondary)' }}>
              {p}
            </p>
          ))}
          {section.bullets && (
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {section.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <div className="border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          More Free Browser-Local Tools
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {otherRoutes.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.path);
              }}
              className="pdf-btn-secondary inline-flex min-h-[40px] items-center px-3.5 py-2 text-xs font-semibold"
            >
              {item.navLabel}
            </a>
          ))}
        </div>
      </div>
    </article>
  );
};
