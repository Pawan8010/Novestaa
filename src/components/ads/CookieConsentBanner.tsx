import React, { useState } from 'react';
import { Cookie, Settings2, X } from 'lucide-react';

export interface ConsentChoice {
  essential: true;
  advertising: boolean;
  decided: boolean;
}

interface CookieConsentBannerProps {
  choice: ConsentChoice;
  isPrefsOpen: boolean;
  onUpdateChoice: (next: ConsentChoice) => void;
  onClosePrefs: () => void;
  onOpenPrefs: () => void;
  onNavigatePrivacy: () => void;
}

/**
 * CMP-ready cookie consent placeholder.
 * Stores preference only in lightweight non-file state; loads zero ad scripts until approved.
 */
export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  choice,
  isPrefsOpen,
  onUpdateChoice,
  onClosePrefs,
  onOpenPrefs,
  onNavigatePrivacy,
}) => {
  const [adToggle, setAdToggle] = useState(choice.advertising);

  if (choice.decided && !isPrefsOpen) {
    return null;
  }

  return (
    <>
      {!choice.decided && !isPrefsOpen && (
        <div
          role="region"
          aria-label="Cookie consent notice"
          className="fixed inset-x-0 bottom-0 z-40 border-t px-4 py-4 shadow-lg"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5 text-xs leading-relaxed sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Cookie className="mt-0.5 h-4.5 w-4.5 shrink-0" style={{ color: 'var(--color-saffron)' }} aria-hidden="true" />
              <p>
                <strong style={{ color: 'var(--color-navy)' }}>Privacy &amp; Cookie Notice:</strong>{' '}
                Your documents never leave your browser. We reserve optional ad placements to keep PDFIndia free (no ad scripts are active yet). Review our{' '}
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigatePrivacy();
                  }}
                  className="font-semibold underline underline-offset-2"
                  style={{ color: 'var(--color-saffron-text)' }}
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenPrefs}
                className="pdf-btn-secondary inline-flex min-h-[40px] items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
              >
                <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                Preferences
              </button>
              <button
                type="button"
                onClick={() => onUpdateChoice({ essential: true, advertising: false, decided: true })}
                className="pdf-btn-secondary min-h-[40px] px-3.5 py-1.5 text-xs font-semibold"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => onUpdateChoice({ essential: true, advertising: true, decided: true })}
                className="pdf-btn-primary min-h-[40px] px-4 py-1.5 text-xs font-semibold"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {isPrefsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-prefs-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
        >
          <div className="pdf-card w-full max-w-md space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 id="cookie-prefs-title" className="text-base font-bold" style={{ color: 'var(--color-navy)' }}>
                Cookie Preferences
              </h2>
              <button
                type="button"
                aria-label="Close cookie preferences"
                onClick={onClosePrefs}
                className="pdf-btn-secondary flex h-9 w-9 items-center justify-center"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="rounded-[12px] border p-3.5" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                <div className="flex items-center justify-between font-semibold" style={{ color: 'var(--color-navy)' }}>
                  <span>Essential Functionality</span>
                  <span style={{ color: 'var(--color-success)' }}>Always active</span>
                </div>
                <p className="mt-1">
                  Required for navigation and secure form delivery. No user documents are ever stored in cookies, localStorage, or IndexedDB.
                </p>
              </div>

              <label
                className="flex cursor-pointer items-start justify-between gap-3 rounded-[12px] border p-3.5"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
              >
                <div>
                  <span className="font-semibold" style={{ color: 'var(--color-navy)' }}>
                    Advertising Cookies (Placeholder)
                  </span>
                  <p className="mt-1">
                    Controls future AdSense consent once publisher approval is active. Currently no ad scripts are loaded.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={adToggle}
                  onChange={(e) => setAdToggle(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#0F172A]"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAdToggle(false);
                  onUpdateChoice({ essential: true, advertising: false, decided: true });
                  onClosePrefs();
                }}
                className="pdf-btn-secondary min-h-[42px] px-4 text-xs font-semibold"
              >
                Reject Non-Essential
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateChoice({ essential: true, advertising: adToggle, decided: true });
                  onClosePrefs();
                }}
                className="pdf-btn-primary min-h-[42px] px-4 text-xs font-semibold"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
