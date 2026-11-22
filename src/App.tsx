import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import {
  FileDown,
  FileImage,
  FilePlus2,
  IdCard,
  Scissors,
  ShieldCheck,
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AdSlot } from './components/ads/AdSlot';
import { CookieConsentBanner, type ConsentChoice } from './components/ads/CookieConsentBanner';
import { siteConfig } from './config/site';
import {
  getToolRouteByPath,
  HOME_GUIDE_DATA,
  TOOL_ROUTES,
  type ToolId,
} from './content/guides';

// Heavy tool modules & guides are strictly lazy-loaded on demand
const ExamPhotoResizer = lazy(() =>
  import('./tools/ExamPhotoResizer').then((m) => ({ default: m.ExamPhotoResizer }))
);
const PassportPhotoMaker = lazy(() =>
  import('./tools/PassportPhotoMaker').then((m) => ({ default: m.PassportPhotoMaker }))
);
const PdfCompressor = lazy(() =>
  import('./tools/PdfCompressor').then((m) => ({ default: m.PdfCompressor }))
);
const PdfMerger = lazy(() =>
  import('./tools/PdfMerger').then((m) => ({ default: m.PdfMerger }))
);
const PdfSplitter = lazy(() =>
  import('./tools/PdfSplitter').then((m) => ({ default: m.PdfSplitter }))
);
const HomeGuide = lazy(() =>
  import('./components/HomeGuide').then((m) => ({ default: m.HomeGuide }))
);
const ToolRouteGuide = lazy(() =>
  import('./components/HomeGuide').then((m) => ({ default: m.ToolRouteGuide }))
);
const AboutPage = lazy(() =>
  import('./components/legal/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const ContactPage = lazy(() =>
  import('./components/legal/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const PrivacyPage = lazy(() =>
  import('./components/legal/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = lazy(() =>
  import('./components/legal/TermsPage').then((m) => ({ default: m.TermsPage }))
);
const CareersPage = lazy(() =>
  import('./components/CareersPage').then((m) => ({ default: m.CareersPage }))
);

const VALID_STATIC_ROUTES = new Set([
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/careers',
  ...TOOL_ROUTES.map((r) => r.path),
]);

function normalizePath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return VALID_STATIC_ROUTES.has(clean) ? clean : '/';
}

const TOOL_TABS: Array<{
  id: ToolId;
  label: string;
  shortDesc: string;
  icon: typeof FileImage;
}> = [
  { id: 'exam-resizer', label: 'Exam Photo & Sign', shortDesc: 'UPSC, SSC, IBPS, Custom', icon: FileImage },
  { id: 'passport-maker', label: 'Passport Photo', shortDesc: '35×45 mm + 8-copy sheet', icon: IdCard },
  { id: 'compress-pdf', label: 'Compress PDF', shortDesc: 'Under 200KB–2MB', icon: FileDown },
  { id: 'merge-pdf', label: 'Merge PDF', shortDesc: 'PDF + Images to A4', icon: FilePlus2 },
  { id: 'split-pdf', label: 'Split PDF', shortDesc: 'Extract pages (1, 3-5)', icon: Scissors },
];

const ToolLoadingFallback = () => (
  <div className="pdf-card flex min-h-[260px] items-center justify-center p-8 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
    Loading browser-local workspace…
  </div>
);

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() =>
    typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/'
  );
  const [homeTool, setHomeTool] = useState<ToolId>('exam-resizer');
  const [consent, setConsent] = useState<ConsentChoice>({
    essential: true,
    advertising: false,
    decided: false,
  });
  const [isCookiePrefsOpen, setIsCookiePrefsOpen] = useState(false);

  // Sync browser history navigation
  useEffect(() => {
    const normalized = normalizePath(window.location.pathname);
    if (window.location.pathname !== normalized) {
      window.history.replaceState({}, '', normalized);
    }

    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update SEO metadata, canonical URL, absolute OG image & structured JSON-LD per route
  useEffect(() => {
    const toolRoute = getToolRouteByPath(currentPath);
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : siteConfig.seo.canonicalBaseUrl;

    let title = siteConfig.seo.title;
    let description = siteConfig.seo.description;
    let breadcrumbLabel = 'Home';

    if (toolRoute) {
      title = toolRoute.title;
      description = toolRoute.description;
      breadcrumbLabel = toolRoute.navLabel;
    } else if (currentPath === '/about') {
      title = `About ${siteConfig.brand.name} — ${siteConfig.brand.parentLine}`;
      description = `Learn how ${siteConfig.brand.name} processes Indian exam photos, signatures, and PDFs 100% locally in your browser with zero file uploads.`;
      breadcrumbLabel = 'About';
    } else if (currentPath === '/contact') {
      title = `Contact ${siteConfig.brand.name} — Support & Exam Preset Updates`;
      description = `Contact the ${siteConfig.brand.name} team at ${siteConfig.supportEmail} for exam preset updates, bug reports, or privacy inquiries.`;
      breadcrumbLabel = 'Contact';
    } else if (currentPath === '/privacy') {
      title = `Privacy Policy (DPDP Act) — ${siteConfig.brand.name}`;
      description = `How ${siteConfig.brand.name} keeps your documents 100% local in your browser with zero uploads, plus contact email and DPDP Act rights.`;
      breadcrumbLabel = 'Privacy Policy';
    } else if (currentPath === '/terms') {
      title = `Terms of Use — ${siteConfig.brand.name}`;
      description = `Terms of use for ${siteConfig.brand.name}. Independent toolset not affiliated with UPSC, SSC, IBPS, or any government body.`;
      breadcrumbLabel = 'Terms of Use';
    } else if (currentPath === '/careers') {
      title = 'Careers at Novesta';
      description = 'Open roles and applications at Novesta.';
      breadcrumbLabel = 'Careers';
    }

    document.title = title;
    const canonicalUrl = `${origin}${currentPath === '/' ? '/' : currentPath}`;
    const absoluteOgImage = `${origin}${siteConfig.brand.ogImagePath}`;

    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', absoluteOgImage);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', absoluteOgImage);

    // Structured data: WebApplication + BreadcrumbList (+ FAQPage on Home)
    const graph: Array<Record<string, unknown>> = [
      {
        '@type': 'WebApplication',
        name: siteConfig.brand.name,
        url: canonicalUrl,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web Browser',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
        },
        description,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement:
          currentPath === '/'
            ? [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` }]
            : [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
                { '@type': 'ListItem', position: 2, name: breadcrumbLabel, item: canonicalUrl },
              ],
      },
    ];

    if (currentPath === '/') {
      graph.push({
        '@type': 'FAQPage',
        mainEntity: HOME_GUIDE_DATA.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      });
    }

    let ldScript = document.getElementById('pdfindia-jsonld') as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.id = 'pdfindia-jsonld';
      ldScript.type = 'application/ld+json';
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph,
    });
  }, [currentPath]);

  const navigate = useCallback((path: string) => {
    const target = normalizePath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', target);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    setCurrentPath(target);
  }, []);

  const renderToolById = (toolId: ToolId, defaultPresetId?: string) => {
    switch (toolId) {
      case 'exam-resizer':
        return <ExamPhotoResizer initialPresetId={defaultPresetId || 'upsc-photo'} />;
      case 'passport-maker':
        return <PassportPhotoMaker />;
      case 'compress-pdf':
        return <PdfCompressor />;
      case 'merge-pdf':
        return <PdfMerger />;
      case 'split-pdf':
        return <PdfSplitter />;
    }
  };

  // Preserve /careers completely untouched inside scoped dark theme
  if (currentPath === '/careers') {
    return (
      <ErrorBoundary>
        <div className="careers-dark-scope min-h-screen bg-[#000000] text-[#f0f0f0]">
          <Suspense
            fallback={
              <div className="mx-auto max-w-3xl px-4 py-24 text-[15px] text-[#a1a4a5]">
                Loading careers…
              </div>
            }
          >
            <CareersPage onBackHome={() => navigate('/')} />
          </Suspense>
        </div>
      </ErrorBoundary>
    );
  }

  const activeToolRoute = getToolRouteByPath(currentPath);

  return (
    <ErrorBoundary>
      <div
        className="flex min-h-screen flex-col overflow-x-clip"
        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-navy)' }}
      >
        {/* WCAG 2.2 AA Skip-to-content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[10px] focus:bg-[#0F172A] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>

        <Header currentPath={currentPath} onNavigate={navigate} />

        <main id="main-content" className="flex-1">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            {/* Home Page: Instant above-the-fold tool workspace + below-the-fold SEO guide */}
            {currentPath === '/' && (
              <div className="space-y-10">
                <section aria-labelledby="home-hero-title" className="space-y-5">
                  <div className="max-w-3xl space-y-2.5">
                    <h1
                      id="home-hero-title"
                      className="text-2xl font-bold tracking-tight sm:text-4xl"
                      style={{ color: 'var(--color-navy)' }}
                    >
                      {siteConfig.brand.tagline}
                    </h1>
                    <p className="text-sm leading-relaxed sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
                      Resize UPSC, SSC, and IBPS photos &amp; signatures to exact KB and 300 DPI rules, make 35×45 mm passport sheets, and compress, merge, or split PDFs—without uploading a single file.
                    </p>
                  </div>

                  {/* Tool Switcher Tabs */}
                  <div
                    role="tablist"
                    aria-label="PDFIndia tools"
                    className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
                  >
                    {TOOL_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const active = homeTool === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setHomeTool(tab.id)}
                          className="flex min-h-[58px] items-center gap-3 rounded-[14px] border px-3.5 py-2.5 text-left transition-colors"
                          style={{
                            backgroundColor: active ? 'var(--color-navy)' : 'var(--color-surface)',
                            borderColor: active ? 'var(--color-navy)' : 'var(--color-border)',
                            color: active ? '#FFFFFF' : 'var(--color-navy)',
                          }}
                        >
                          <Icon
                            className="h-5 w-5 shrink-0"
                            style={{ color: active ? '#F97316' : 'var(--color-saffron)' }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold sm:text-sm">
                              {tab.label}
                            </div>
                            <div
                              className="truncate text-[11px]"
                              style={{ color: active ? '#CBD5E1' : 'var(--color-text-secondary)' }}
                            >
                              {tab.shortDesc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Tool Workspace */}
                  <div className="pdf-card p-4 sm:p-6">
                    <Suspense fallback={<ToolLoadingFallback />}>
                      {renderToolById(homeTool)}
                    </Suspense>
                  </div>
                </section>

                {/* Non-intrusive Leaderboard Ad Placeholder cleanly separated from Download controls */}
                <div className="py-2">
                  <AdSlot variant="leaderboard" />
                </div>

                {/* Below-the-fold Home Guide + Sidebar Ad Placeholder */}
                <div className="grid items-start gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-9">
                    <Suspense fallback={<div className="py-8 text-sm text-slate-500">Loading guide…</div>}>
                      <HomeGuide onNavigate={navigate} />
                    </Suspense>
                  </div>
                  <div className="hidden lg:col-span-3 lg:block lg:sticky lg:top-24">
                    <AdSlot variant="sidebar" />
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated SEO Tool Routes */}
            {activeToolRoute && (
              <div className="space-y-10">
                <section aria-labelledby="tool-route-h1" className="space-y-5">
                  <nav aria-label="Breadcrumb" className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    <a
                      href="/"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                      }}
                      className="hover:underline underline-offset-2"
                    >
                      Home
                    </a>
                    <span className="mx-2" aria-hidden="true">/</span>
                    <span style={{ color: 'var(--color-navy)' }}>{activeToolRoute.navLabel}</span>
                  </nav>

                  <div className="max-w-3xl space-y-2">
                    <h1
                      id="tool-route-h1"
                      className="text-2xl font-bold tracking-tight sm:text-4xl"
                      style={{ color: 'var(--color-navy)' }}
                    >
                      {activeToolRoute.h1}
                    </h1>
                    <p className="text-sm leading-relaxed sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
                      {activeToolRoute.subtitle}
                    </p>
                  </div>

                  <div className="pdf-card p-4 sm:p-6">
                    <Suspense fallback={<ToolLoadingFallback />}>
                      {renderToolById(activeToolRoute.toolId, activeToolRoute.defaultPresetId)}
                    </Suspense>
                  </div>
                </section>

                {/* Leaderboard Ad Placeholder safely separated below tool workspace */}
                <div className="py-2">
                  <AdSlot variant="leaderboard" />
                </div>

                {/* Unique 500+ word SEO Guide + Sidebar Ad Placeholder */}
                <div className="grid items-start gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-9">
                    <Suspense fallback={<div className="py-8 text-sm text-slate-500">Loading guide…</div>}>
                      <ToolRouteGuide route={activeToolRoute} onNavigate={navigate} />
                    </Suspense>
                  </div>
                  <div className="hidden lg:col-span-3 lg:block lg:sticky lg:top-24">
                    <div className="space-y-4">
                      <AdSlot variant="sidebar" />
                      <div className="pdf-card p-4 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        <div className="flex items-center gap-2 font-semibold" style={{ color: 'var(--color-navy)' }}>
                          <ShieldCheck className="h-4 w-4" style={{ color: 'var(--color-success)' }} aria-hidden="true" />
                          Zero-Upload Guarantee
                        </div>
                        <p className="mt-1.5">
                          Every conversion executes inside your browser tab. Disconnect Wi-Fi after page load and the tool still works.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legal & Trust Pages */}
            {currentPath === '/about' && (
              <Suspense fallback={<ToolLoadingFallback />}>
                <AboutPage onNavigate={navigate} />
              </Suspense>
            )}
            {currentPath === '/contact' && (
              <Suspense fallback={<ToolLoadingFallback />}>
                <ContactPage />
              </Suspense>
            )}
            {currentPath === '/privacy' && (
              <Suspense fallback={<ToolLoadingFallback />}>
                <PrivacyPage />
              </Suspense>
            )}
            {currentPath === '/terms' && (
              <Suspense fallback={<ToolLoadingFallback />}>
                <TermsPage />
              </Suspense>
            )}
          </div>
        </main>

        <Footer
          onNavigate={navigate}
          onOpenCookiePrefs={() => setIsCookiePrefsOpen(true)}
        />

        <CookieConsentBanner
          choice={consent}
          isPrefsOpen={isCookiePrefsOpen}
          onUpdateChoice={setConsent}
          onClosePrefs={() => setIsCookiePrefsOpen(false)}
          onOpenPrefs={() => setIsCookiePrefsOpen(true)}
          onNavigatePrivacy={() => {
            setIsCookiePrefsOpen(false);
            navigate('/privacy');
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
