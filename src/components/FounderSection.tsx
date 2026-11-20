import { useState } from 'react';
import { ArrowUpRight, Check, Mail, MessageCircle } from 'lucide-react';
import { siteConfig } from '../config/site';

export function FounderSection() {
  const { founder, contact } = siteConfig;
  const [emailCopied, setEmailCopied] = useState(false);

  const whatsappHref = `${founder.whatsappUrl}?text=${encodeURIComponent(
    contact.whatsappPrefillText
  )}`;

  const gmailComposeHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    founder.email
  )}&su=${encodeURIComponent('Direct Inquiry for Novesta Founder')}`;

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="scroll-mt-20 border-b border-[var(--color-border)] bg-[var(--color-bg)] py-16 text-[var(--color-ink)] sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="mono-eyebrow text-[#00a3ff]">
            FOUNDER
          </p>

          <h2
            id="about-heading"
            className="heading-founder resend-gradient-text mt-3"
          >
            {founder.name}
          </h2>

          <p className="mt-4 text-[18px] font-medium tracking-tight text-[var(--color-text-tertiary)] sm:text-[20px]">
            {founder.role}
          </p>

          <p className="mt-3 max-w-2xl text-[16px] leading-7 text-[var(--color-ink-secondary)]">
            {founder.teamLine}
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="resend-btn-primary inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-2.5 text-[14px] font-medium"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>WhatsApp</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>

            <a
              href={founder.emailHref}
              onClick={() => {
                navigator.clipboard?.writeText(founder.email).catch(() => {});
                setEmailCopied(true);
              }}
              className="resend-btn-secondary inline-flex min-h-[44px] max-w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium"
            >
              {emailCopied ? (
                <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
              ) : (
                <Mail className="h-4 w-4 shrink-0 text-[#00a3ff]" aria-hidden="true" />
              )}
              <span className="truncate">
                {emailCopied ? `Copied ${founder.email}` : founder.email}
              </span>
            </a>
          </div>

          {emailCopied && (
            <p className="mt-3 text-[13px] text-[var(--color-ink-secondary)]">
              Address copied to clipboard.{' '}
              <a
                href={gmailComposeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#d6ebfd] underline underline-offset-2 hover:text-[#00a3ff]"
              >
                Open in Gmail
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
