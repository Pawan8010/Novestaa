import React from 'react';
import { siteConfig } from '../config/site';
import { TOOL_ROUTES } from '../content/guides';
import { PdfIndiaLogo } from './PdfIndiaLogo';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenCookiePrefs?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenCookiePrefs }) => {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            <a
              href="/"
              onClick={(e) => handleLink(e, '/')}
              className="inline-flex items-center"
              aria-label="PDFIndia home"
            >
              <PdfIndiaLogo />
            </a>
            <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {siteConfig.brand.tagline}.
            </p>
            <p className="text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
              {siteConfig.brand.parentLine} · Support:{' '}
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="underline underline-offset-2"
                style={{ color: 'var(--color-saffron-text)' }}
              >
                {siteConfig.supportEmail}
              </a>
            </p>
          </div>

          <div className="lg:col-span-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>
              Browser-Local Tools
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {TOOL_ROUTES.map((route) => (
                <li key={route.path}>
                  <a
                    href={route.path}
                    onClick={(e) => handleLink(e, route.path)}
                    className="hover:underline underline-offset-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {route.navLabel}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-navy)' }}>
              Company &amp; Legal
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLink(e, '/about')}
                  className="hover:underline underline-offset-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  About PDFIndia
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLink(e, '/contact')}
                  className="hover:underline underline-offset-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Contact &amp; Support
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleLink(e, '/privacy')}
                  className="hover:underline underline-offset-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Privacy Policy (DPDP)
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleLink(e, '/terms')}
                  className="hover:underline underline-offset-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Terms of Use
                </a>
              </li>
              <li>
                <a
                  href="/careers"
                  onClick={(e) => handleLink(e, '/careers')}
                  className="hover:underline underline-offset-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Careers at Novesta
                </a>
              </li>
              {onOpenCookiePrefs && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenCookiePrefs}
                    className="text-left text-sm hover:underline underline-offset-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Cookie Preferences
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div
          className="mt-8 flex flex-col justify-between gap-3 border-t pt-6 text-xs sm:flex-row sm:items-center"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          <p>
            © {siteConfig.brand.copyrightYear} {siteConfig.brand.name}. {siteConfig.brand.parentLine}. Not affiliated with UPSC, SSC, IBPS, SBI, or any government body.
          </p>
          <p>All file processing runs 100% locally in your browser.</p>
        </div>
      </div>
    </footer>
  );
};
