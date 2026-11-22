import React from 'react';
import { siteConfig } from '../../config/site';

export const TermsPage: React.FC = () => {
  return (
    <article className="mx-auto max-w-4xl space-y-6 py-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-saffron-text)' }}>
          Legal &amp; Terms
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-navy)' }}>
          Terms of Use
        </h1>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Last updated: March 2026 · {siteConfig.brand.name} ({siteConfig.brand.parentLine})
        </p>
      </header>

      <div className="pdf-card space-y-6 p-6 text-sm leading-7 sm:p-8" style={{ color: 'var(--color-text-secondary)' }}>
        <section className="space-y-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
            1. No Affiliation With Any Government or Examination Body
          </h2>
          <p>
            {siteConfig.brand.name} is an independent utility operated by Novesta. We are <strong>not affiliated with, endorsed by, or connected to</strong> the Union Public Service Commission (UPSC), Staff Selection Commission (SSC), Institute of Banking Personnel Selection (IBPS), State Bank of India (SBI), National Testing Agency (NTA), Railway Recruitment Boards (RRB), Passport Seva, or any central or state government department. All exam names and portal references are used strictly for descriptive compatibility guidance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
            2. Always Verify Official Notifications
          </h2>
          <p>
            Examination boards and government portals frequently revise photo dimensions, name/date strip requirements, background colour rules, and PDF size caps between recruitment cycles. While we maintain preset values carefully and show verification dates and source links, you are solely responsible for checking the latest official notification before submitting any application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
            3. No Guarantee of Portal Acceptance &amp; Keep Original Files
          </h2>
          <p>
            {siteConfig.brand.name} is provided “as is” without warranties of any kind. We cannot guarantee that any external recruitment portal, verification officer, or print shop will accept a generated file. Always inspect your downloaded preview and keep your original unedited photos and PDFs backed up safely.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
            4. Acceptable Use
          </h2>
          <p>
            You agree to use these client-side tools only for lawful personal or educational document preparation and not to process documents you do not have the right to handle. Questions about these Terms may be sent to{' '}
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="font-semibold underline underline-offset-2"
              style={{ color: 'var(--color-saffron-text)' }}
            >
              {siteConfig.supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
};
