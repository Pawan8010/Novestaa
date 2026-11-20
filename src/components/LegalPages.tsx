import { ArrowLeft } from 'lucide-react';
import { siteConfig } from '../config/site';

interface LegalPageProps {
  type: 'privacy' | 'terms';
  onBackHome: () => void;
}

export function LegalPage({ type, onBackHome }: LegalPageProps) {
  const isPrivacy = type === 'privacy';

  return (
    <section
      aria-labelledby="legal-heading"
      className="bg-[var(--color-bg)] py-16 text-[var(--color-ink)] sm:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBackHome}
          className="resend-btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to {siteConfig.brand.name} Home</span>
        </button>

        <h1
          id="legal-heading"
          className="heading-section resend-gradient-text mt-8"
        >
          {isPrivacy ? 'Privacy Policy' : 'Terms of Service'}
        </h1>
        <p className="mt-3 text-[14px] text-[var(--color-ink-secondary)]">
          Last updated: November 2026 · {siteConfig.brand.name} ({siteConfig.contact.address.city},{' '}
          {siteConfig.contact.address.state}, {siteConfig.contact.address.country})
        </p>

        {isPrivacy ? (
          <div className="mt-8 space-y-6 text-[16px] leading-6 text-[var(--color-ink-secondary)]">
            <section>
              <h2 className="text-[18px] font-medium text-[var(--color-ink)]">
                1. Information We Collect
              </h2>
              <p className="mt-2">
                When you submit a consultation request or contact {siteConfig.brand.name}, we
                collect the details you voluntarily provide—such as your name, phone or WhatsApp
                number, email address, business category, and project inquiry message.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-medium text-[var(--color-ink)]">
                2. How We Use Your Information
              </h2>
              <p className="mt-2">
                We use your contact details solely to respond to your inquiry, prepare a tailored
                digital growth audit or project proposal, and communicate with you regarding
                requested services. We do not sell or rent your personal contact data to third
                parties.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-medium text-[var(--color-ink)]">
                3. Analytics &amp; Embedded Maps
              </h2>
              <p className="mt-2">
                This site may use Google Analytics (GA4) when configured to measure aggregate page
                performance and traffic. Our Contact section embeds Google Maps, which is governed
                by the{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--color-ink)] underline"
                >
                  Google Privacy Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-medium text-[var(--color-ink)]">
                4. Data Requests &amp; Contact
              </h2>
              <p className="mt-2">
                To request access, correction, or deletion of your inquiry data, email{' '}
                <a
                  href={siteConfig.contact.emailHref}
                  className="font-medium text-[var(--color-ink)] underline"
                >
                  {siteConfig.contact.email}
                </a>{' '}
                or call{' '}
                <a
                  href={siteConfig.contact.phoneHref}
                  className="font-medium text-[var(--color-ink)] underline"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
                .
              </p>
            </section>
          </div>
        ) : (
          <div className="mt-8 space-y-6 text-[16px] leading-6 text-[var(--color-ink-secondary)]">
            <section>
              <h2 className="text-[18px] font-medium text-[var(--color-ink)]">
                1. Scope of Services
              </h2>
              <p className="mt-2">
                {siteConfig.brand.name} provides website and web application engineering, online
                ordering and booking product development, search engine optimization (SEO), Google
                Business Profile optimization, social media marketing, multi-platform directory
                setup, and AI/WhatsApp workflow automation. Exact deliverables, timelines, and
                fees are defined in each client&apos;s written proposal or statement of work.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-medium text-[var(--color-ink)]">
                2. Client Ownership &amp; Intellectual Property
              </h2>
              <p className="mt-2">
                Upon full payment of agreed project milestones, clients retain full ownership of
                their custom website code, domain registrations, Google Business Profiles, and
                brand assets created for their project.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-medium text-[var(--color-ink)]">
                3. Third-Party Services &amp; Google Maps
              </h2>
              <p className="mt-2">
                Our website integrates Google Maps features. By using the embedded map on this
                site, you are also bound by the{' '}
                <a
                  href="https://maps.google.com/help/terms_maps/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--color-ink)] underline"
                >
                  Google Maps / Google Earth Additional Terms of Service
                </a>{' '}
                and Google Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-[18px] font-medium text-[var(--color-ink)]">
                4. Limitation of Liability &amp; Contact
              </h2>
              <p className="mt-2">
                Search rankings, ad reach, and third-party directory approvals depend in part on
                external platform algorithms and policies. For questions regarding these terms,
                contact{' '}
                <a
                  href={siteConfig.contact.emailHref}
                  className="font-medium text-[var(--color-ink)] underline"
                >
                  {siteConfig.contact.email}
                </a>
                .
              </p>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
