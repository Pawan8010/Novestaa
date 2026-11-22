import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PdfIndiaLogo } from './PdfIndiaLogo';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const NAV_ITEMS = [
  { label: 'Exam Resizer', path: '/upsc-photo-signature-resizer' },
  { label: 'Passport Photo', path: '/passport-photo-maker' },
  { label: 'Compress PDF', path: '/compress-pdf' },
  { label: 'Merge PDF', path: '/merge-pdf' },
  { label: 'Split PDF', path: '/split-pdf' },
];

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (path: string) => {
    setMobileOpen(false);
    onNavigate(path);
  };

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-sm"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNav('/');
          }}
          className="flex shrink-0 items-center rounded-[8px] py-1"
          aria-label="PDFIndia home"
        >
          <PdfIndiaLogo />
        </a>

        {/* Desktop single-line navigation (5 tool links) */}
        <nav aria-label="Primary tools" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentPath === item.path ||
              (item.path === '/upsc-photo-signature-resizer' &&
                (currentPath === '/ssc-photo-resizer' ||
                  currentPath === '/ibps-photo-signature-resizer'));
            return (
              <a
                key={item.path}
                href={item.path}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.path);
                }}
                className="whitespace-nowrap rounded-[10px] px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--color-surface-subtle)' : 'transparent',
                  color: isActive ? 'var(--color-navy)' : 'var(--color-text-secondary)',
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/contact"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/contact');
            }}
            className="pdf-btn-secondary inline-flex min-h-[40px] items-center whitespace-nowrap px-3.5 py-2 text-xs font-semibold"
          >
            Support
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="pdf-btn-secondary flex h-11 w-11 items-center justify-center md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t px-4 py-4 md:hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = currentPath === item.path;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item.path);
                  }}
                  className="flex min-h-[44px] items-center rounded-[10px] px-3.5 text-sm font-medium"
                  style={{
                    backgroundColor: active ? 'var(--color-surface-subtle)' : 'transparent',
                    color: active ? 'var(--color-navy)' : 'var(--color-text-secondary)',
                  }}
                >
                  {item.label}
                </a>
              );
            })}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
              <a
                href="/about"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/about');
                }}
                className="pdf-btn-secondary flex min-h-[44px] items-center justify-center text-xs font-semibold"
              >
                About
              </a>
              <a
                href="/contact"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/contact');
                }}
                className="pdf-btn-primary flex min-h-[44px] items-center justify-center text-xs font-semibold"
              >
                Support
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};
