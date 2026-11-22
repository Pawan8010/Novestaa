import React from 'react';
import { ShieldCheck, Cpu, CheckCircle2 } from 'lucide-react';
import { siteConfig } from '../../config/site';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-saffron-text)' }}>
          About {siteConfig.brand.name}
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-navy)' }}>
          100% private document preparation for Indian exams and portals.
        </h1>
        <p className="text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {siteConfig.brand.name} ({siteConfig.brand.parentLine}) is built to remove the frustration and privacy risks of preparing photographs, signatures, and PDFs for UPSC, SSC, IBPS, SBI, Passport Seva, scholarships, and state government portals.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="pdf-card p-5">
          <ShieldCheck className="h-5 w-5" style={{ color: 'var(--color-success)' }} aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
            Zero File Uploads
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Every pixel and PDF page is processed strictly inside your browser tab. Your Aadhaar, marksheets, photos, and signatures never leave your device.
          </p>
        </div>

        <div className="pdf-card p-5">
          <Cpu className="h-5 w-5" style={{ color: 'var(--color-saffron)' }} aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
            Exact KB &amp; DPI Engineering
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            15-step binary-search JPEG compression, real JFIF 300 DPI headers, 8-copy 35×45 mm sheets, and page-by-page local PDF tools built for Indian upload rules.
          </p>
        </div>

        <div className="pdf-card p-5">
          <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--color-navy)' }} aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
            Independent &amp; Free
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            PDFIndia is an independent software product by Novesta and is not affiliated with UPSC, SSC, IBPS, SBI, NTA, RRB, or any government department.
          </p>
        </div>
      </div>

      <section className="pdf-card space-y-4 p-6 sm:p-8">
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-navy)' }}>
          Why we built PDFIndia
        </h2>
        <p className="text-sm leading-7" style={{ color: 'var(--color-text-secondary)' }}>
          Students and job applicants across India routinely face form rejections over narrow 10 KB – 20 KB signature rules, missing 300 DPI metadata, or 500 KB PDF caps. Most online converters force you to upload personal identity documents to remote servers cluttered with confusing buttons.
        </p>
        <p className="text-sm leading-7" style={{ color: 'var(--color-text-secondary)' }}>
          Built by Novesta in {siteConfig.contact.address.city}, {siteConfig.contact.address.state}, PDFIndia keeps the interface calm, verifiable, and completely local. Have a preset correction or exam notification update to report? Reach us anytime on the{' '}
          <a
            href="/contact"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/contact');
            }}
            className="font-semibold underline underline-offset-2"
            style={{ color: 'var(--color-saffron-text)' }}
          >
            Contact page
          </a>{' '}
          or email{' '}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="font-semibold underline underline-offset-2"
            style={{ color: 'var(--color-navy)' }}
          >
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </section>
    </div>
  );
};
