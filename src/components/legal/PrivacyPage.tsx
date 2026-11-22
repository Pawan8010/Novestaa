import React from 'react';
import { siteConfig } from '../../config/site';

export const PrivacyPage: React.FC = () => {
  return (
    <article className="mx-auto max-w-4xl space-y-6 py-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-saffron-text)' }}>
          Legal &amp; Privacy
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-navy)' }}>
          Privacy Policy
        </h1>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Last updated: March 2026 · {siteConfig.brand.name} ({siteConfig.brand.parentLine})
        </p>
      </header>

      <div className="pdf-card space-y-6 p-6 text-sm leading-7 sm:p-8" style={{ color: 'var(--color-text-secondary)' }}>
        <section className="space-y-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
            1. 100% Local Browser Processing of Your Documents
          </h2>
          <p>
            Every document tool on {siteConfig.brand.name} (Exam Photo &amp; Signature Resizer, Passport Photo Maker, PDF Compressor, PDF Merger, and PDF Splitter) runs strictly inside your browser using local JavaScript, HTML5 Canvas, OffscreenCanvas Web Workers, pdf-lib, and locally bundled pdf.js.
          </p>
          <p>
            Your photographs, signatures, PDFs, marksheets, and identity files are <strong>never uploaded to any server</strong>, never transmitted over the network, never shared with analytics providers, and never stored in browser <code>localStorage</code> or <code>IndexedDB</code>. All in-memory object URLs are revoked automatically when you clear files or close the tab.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
            2. Contact Form &amp; Careers Applications
          </h2>
          <p>
            When you voluntarily submit the Contact form or apply for a role on <code>/careers</code>, the form fields you type (such as your name, email address, and message) are sent over HTTPS to our backend endpoint solely to deliver your inquiry to our team via our configured transactional email provider (SMTP / Resend) and respond to you. Never include Aadhaar numbers, PAN numbers, or sensitive document attachments in contact messages.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
            3. Advertising, Cookies &amp; Consent
          </h2>
          <p>
            To keep {siteConfig.brand.name} free for students and applicants, we reserve clearly labelled non-intrusive advertising spaces (such as Google AdSense once approved). No third-party ad scripts are loaded prior to publisher approval or where required user consent has not been granted.
          </p>
          <p>
            You may accept, reject, or customize non-essential advertising cookies at any time using the Cookie Preferences control in the site footer. Rejecting advertising cookies never restricts access to any PDFIndia tool.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
            4. Your Rights Under India’s Digital Personal Data Protection (DPDP) Act
          </h2>
          <p>
            In accordance with the Digital Personal Data Protection Act, 2023 (India), you have the right to request access to, correction of, or erasure of any personal contact details you voluntarily submitted through our Contact or Careers forms, and to withdraw consent for non-essential cookies at any time.
          </p>
          <p>
            To exercise these rights or contact our grievance contact, email{' '}
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
