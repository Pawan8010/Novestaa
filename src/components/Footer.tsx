import { useState } from 'react';
import { ArrowUp, Check, Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import { siteConfig } from '../config/site';
import { NovestaLogo } from './NovestaLogo';

interface FooterProps {
  onNavigate: (path: string, hash?: string) => void;
}

const socialIconMap: Record<string, typeof Instagram> = {
  Instagram,
  Facebook,
  X: Twitter,
  LinkedIn: Linkedin,
};

export function Footer({ onNavigate }: FooterProps) {
  const [emailCopied, setEmailCopied] = useState(false);

  const handleLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    path: string,
    hash?: string
  ) => {
    event.preventDefault();
    onNavigate(path, hash);
  };

  const compactLinks = [
    { label: 'About', path: '/', hash: '#about' },
    { label: 'Services', path: '/', hash: '#services' },
    { label: 'Reach', path: '/', hash: '#reach' },
    { label: 'Careers', path: '/careers' },
    { label: 'Founder', path: '/admin' },
    { label: 'Privacy', path: '/privacy' },
    { label: 'Terms', path: '/terms' },
  ];

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-ink)]">
      {/* Top responsive contact grid above the wordmark */}
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid grid-cols-1 gap-6 border-b border-[var(--color-border)] pb-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div>
            <p className="mono-eyebrow text-[var(--color-ink-secondary)]">
              CALL OR WHATSAPP
            </p>
            <a
              href={siteConfig.contact.phoneHref}
              className="mt-1.5 inline-flex min-h-[44px] items-center text-[18px] font-medium text-[var(--color-text-tertiary)] tabular-nums transition-colors hover:text-[#00a3ff]"
            >
              {siteConfig.contact.phoneDisplay}
            </a>
          </div>

          <div>
            <p className="mono-eyebrow text-[var(--color-ink-secondary)]">
              EMAIL
            </p>
            <a
              href={siteConfig.contact.emailHref}
              onClick={() => {
                navigator.clipboard?.writeText(siteConfig.contact.email).catch(() => {});
                setEmailCopied(true);
              }}
              className="mt-1.5 inline-flex min-h-[44px] items-center gap-2 break-all text-[18px] font-medium text-[var(--color-text-tertiary)] transition-colors hover:text-[#00a3ff]"
            >
              <span>{siteConfig.contact.email}</span>
              {emailCopied && (
                <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
              )}
            </a>
            {emailCopied && (
              <p className="mt-0.5 text-[12px] text-[var(--color-ink-secondary)]">
                Copied ·{' '}
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                    siteConfig.contact.email
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#d6ebfd] underline underline-offset-2 hover:text-[#00a3ff]"
                >
                  Open in Gmail
                </a>
              </p>
            )}
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <p className="mono-eyebrow text-[var(--color-ink-secondary)]">
              LOCATION
            </p>
            <p className="mt-1.5 flex min-h-[44px] items-center text-[15px] font-medium leading-6 text-[var(--color-ink)]">
              {siteConfig.contact.address.full}
            </p>
          </div>
        </div>
      </div>

      {/* Signature Full-Width Responsive Vector NOVESTA Wordmark with metallic Resend gradient */}
      <div
        role="img"
        aria-label="Novesta"
        className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8"
      >
        <svg
          viewBox="0 0 1000 116"
          className="block h-auto w-full select-none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="novesta-wordmark-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fcfdff" stopOpacity="0.92" />
              <stop offset="65%" stopColor="#d6ebfd" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#00a3ff" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <text
            x="500"
            y="98"
            textAnchor="middle"
            textLength="960"
            lengthAdjust="spacing"
            fill="url(#novesta-wordmark-grad)"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '112px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            NOVESTA
          </text>
        </svg>
      </div>

      {/* Hairline divider + Balanced Mobile/Tablet/Desktop Footer Bar */}
      <div
        id="footer-bottom-bar"
        className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-8 text-center sm:px-6 lg:flex-row lg:items-center lg:px-8 lg:py-7 lg:text-left">
          {/* Left: Novesta monogram + copyright */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="inline-flex shrink-0 items-center rounded-full transition-opacity hover:opacity-95"
              aria-label="Novesta home"
            >
              <NovestaLogo variant="footer" />
            </a>
            <p className="text-[13px] text-[var(--color-ink-secondary)]">
              &copy; {siteConfig.brand.copyrightYear} {siteConfig.brand.name}. Founded by{' '}
              {siteConfig.founder.name}.
            </p>
          </div>

          {/* Center: Compact Links */}
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-5"
          >
            {compactLinks.map((item) => (
              <a
                key={item.label}
                href={item.hash ? `${item.path}${item.hash}` : item.path}
                onClick={(e) => handleLinkClick(e, item.path, item.hash)}
                className="inline-flex min-h-[44px] items-center rounded-[var(--radius-sm)] px-2 text-[14px] font-medium text-[var(--color-ink-secondary)] transition-colors hover:text-[var(--color-text-tertiary)]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right: Social Icons + Back to Top */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-[13px] font-medium text-[var(--color-ink-secondary)]">
              Follow
            </span>
            <div className="flex items-center gap-2">
              {siteConfig.socials.map((social) => {
                const Icon = socialIconMap[social.name] || Instagram;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${siteConfig.brand.name} on ${social.name}${
                      social.isPlaceholder ? ' (placeholder link)' : ''
                    }`}
                    title={`${social.name} (${social.handle})`}
                    className="resend-btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-full"
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={1.9} aria-hidden="true" />
                  </a>
                );
              })}

              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'auto' })}
                aria-label="Back to top"
                title="Back to top"
                className="resend-btn-secondary ml-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium"
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Top</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
