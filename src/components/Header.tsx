import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { siteConfig } from '../config/site';
import { NovestaLogo } from './NovestaLogo';

interface HeaderProps {
  currentPath: string;
  currentHash: string;
  onNavigate: (path: string, hash?: string) => void;
}

export function Header({ currentPath, currentHash, onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    event.preventDefault();
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      onNavigate('/', href);
    } else {
      onNavigate(href);
    }
  };

  const whatsappHref = `${siteConfig.contact.whatsappUrl}?text=${encodeURIComponent(
    siteConfig.contact.whatsappPrefillText
  )}`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:px-6 lg:px-8">
          {/* Left: Novesta monogram lockup */}
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className="inline-flex shrink-0 items-center gap-2.5 rounded-full transition-opacity hover:opacity-95"
            aria-label="Novesta home"
          >
            <NovestaLogo variant="header" />
            <span className="hidden text-[15px] font-semibold tracking-[0.14em] text-[var(--color-text-tertiary)] sm:inline">
              NOVESTA
            </span>
          </a>

          {/* Center: Clean single-line navigation links */}
          <nav aria-label="Primary Navigation" className="hidden items-center gap-5 lg:flex xl:gap-7">
            {siteConfig.navLinks.map((item) => {
              const isHash = item.href.startsWith('#');
              const isActive = isHash
                ? currentPath === '/' && currentHash === item.href
                : currentPath === item.href;

              return (
                <a
                  key={item.href}
                  href={isHash ? `/${item.href}` : item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className={`shrink-0 whitespace-nowrap rounded-[var(--radius-sm)] px-2 py-1.5 text-[14px] font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-[var(--color-text-tertiary)]'
                      : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right: Glass WhatsApp + Resend Luminous Primary CTA */}
          <div className="flex shrink-0 items-center gap-2.5">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="resend-btn-secondary hidden min-h-[40px] items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-medium sm:inline-flex"
            >
              WhatsApp
            </a>

            <a
              href="/#contact"
              onClick={(e) => handleLinkClick(e, '#contact')}
              className="resend-btn-primary hidden min-h-[40px] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-5 py-2 text-[14px] font-medium md:inline-flex"
            >
              <span>{siteConfig.hero.primaryCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-fullscreen-menu"
              aria-label="Open navigation menu"
              className="resend-btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Full-Screen Obsidian Mobile / Tablet Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-fullscreen-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          className="fixed inset-0 z-50 flex flex-col justify-between gap-6 overflow-y-auto bg-black px-6 py-6 text-[var(--color-ink)] lg:hidden"
        >
          <div>
            <div className="flex items-center justify-between">
              <a
                href="/"
                onClick={(e) => handleLinkClick(e, '/')}
                className="inline-flex shrink-0 items-center gap-2.5 rounded-full"
                aria-label="Novesta home"
              >
                <NovestaLogo variant="header" />
                <span className="text-[15px] font-semibold tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  NOVESTA
                </span>
              </a>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  menuButtonRef.current?.focus();
                }}
                aria-label="Close navigation menu"
                className="resend-btn-secondary inline-flex h-11 w-11 items-center justify-center rounded-full"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile links" className="mt-10 flex flex-col gap-1">
              {siteConfig.navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href.startsWith('#') ? `/${item.href}` : item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className="flex min-h-[52px] items-center border-b border-[var(--color-border)] text-[20px] font-normal tracking-tight text-[var(--color-ink)] transition-colors hover:text-[#d6ebfd]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="resend-btn-secondary inline-flex min-h-[48px] w-full items-center justify-center rounded-full px-6 text-[15px] font-medium"
            >
              WhatsApp
            </a>

            <a
              href="/#contact"
              onClick={(e) => handleLinkClick(e, '#contact')}
              className="resend-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium"
            >
              <span>{siteConfig.hero.primaryCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}
