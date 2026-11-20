import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { PromiseSection } from './components/PromiseSection';
import { FeaturePanel } from './components/FeaturePanel';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { siteConfig } from './config/site';

const ReachSection = lazy(() =>
  import('./components/ReachSection').then((m) => ({ default: m.ReachSection }))
);
const PricingSection = lazy(() =>
  import('./components/PricingSection').then((m) => ({ default: m.PricingSection }))
);
const IndustriesSection = lazy(() =>
  import('./components/IndustriesSection').then((m) => ({ default: m.IndustriesSection }))
);
const ProcessSection = lazy(() =>
  import('./components/ProcessSection').then((m) => ({ default: m.ProcessSection }))
);
const FounderSection = lazy(() =>
  import('./components/FounderSection').then((m) => ({ default: m.FounderSection }))
);
const FeedbackSection = lazy(() =>
  import('./components/FeedbackSection').then((m) => ({ default: m.FeedbackSection }))
);
const FaqAccordion = lazy(() =>
  import('./components/FaqAccordion').then((m) => ({ default: m.FaqAccordion }))
);
const ContactSection = lazy(() =>
  import('./components/ContactSection').then((m) => ({ default: m.ContactSection }))
);
const CareersPage = lazy(() =>
  import('./components/CareersPage').then((m) => ({ default: m.CareersPage }))
);
const LegalPage = lazy(() =>
  import('./components/LegalPages').then((m) => ({ default: m.LegalPage }))
);
const FounderPortal = lazy(() =>
  import('./components/FounderPortal').then((m) => ({ default: m.FounderPortal }))
);

type AppRoute = '/' | '/careers' | '/privacy' | '/terms' | '/admin';

function normalizePath(pathname: string): AppRoute {
  if (pathname === '/careers') return '/careers';
  if (pathname === '/privacy') return '/privacy';
  if (pathname === '/terms') return '/terms';
  if (pathname === '/admin') return '/admin';
  return '/';
}

export default function App() {
  const [currentPath, setCurrentPath] = useState<AppRoute>(() =>
    typeof window !== 'undefined' ? normalizePath(window.location.pathname) : '/'
  );
  const [currentHash, setCurrentHash] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  );
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string | undefined>(
    undefined
  );
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [preselectTick, setPreselectTick] = useState(0);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Listen for Google Maps Platform Demo Key quota exhaustion events
  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Optional GA4 script injection when a real Measurement ID is configured
  useEffect(() => {
    const gaId = siteConfig.seo.ga4MeasurementId;
    if (!gaId || gaId.startsWith('G-XXXX')) return;
    if (document.getElementById('novesta-ga4-script')) return;

    const script = document.createElement('script');
    script.id = 'novesta-ga4-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);

    const inline = document.createElement('script');
    inline.text = `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`;
    document.head.appendChild(inline);
  }, []);

  // Sync browser history navigation & initial URL hash
  useEffect(() => {
    const scrollToCurrentHash = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'auto' });
      }
    };

    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
      setCurrentHash(window.location.hash || '');
      setTimeout(scrollToCurrentHash, 80);
    };

    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '');
    };

    if (window.location.hash) {
      setTimeout(scrollToCurrentHash, 120);
      setTimeout(scrollToCurrentHash, 450);
    }

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update document title, meta tags, OpenGraph & canonical URL per route
  useEffect(() => {
    const routeMeta: Record<AppRoute, { title: string; description: string }> = {
      '/': {
        title: siteConfig.seo.title,
        description: siteConfig.seo.description,
      },
      '/careers': {
        title: `Careers at ${siteConfig.brand.name} — Engineering & Growth Roles`,
        description: `Join ${siteConfig.brand.name} in Jalgaon or remotely. Build high-speed websites, SEO engines, Google Maps visibility, and AI WhatsApp automation.`,
      },
      '/privacy': {
        title: `Privacy Policy — ${siteConfig.brand.name} Digital Growth`,
        description: `Read ${siteConfig.brand.name}'s privacy policy covering inquiry data, consultation requests, analytics, and embedded Google Maps usage details.`,
      },
      '/terms': {
        title: `Terms of Service — ${siteConfig.brand.name} Digital Growth`,
        description: `Review ${siteConfig.brand.name}'s terms of service covering project scope, client code and domain ownership, and third-party platform integrations.`,
      },
      '/admin': {
        title: `Founder Workspace — ${siteConfig.brand.name}`,
        description: `Private founder workspace for managing ${siteConfig.brand.name} career role listings and submitted inquiries.`,
      },
    };

    const meta = routeMeta[currentPath];
    document.title = meta.title;

    const setMetaTag = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('content', content);
      }
    };

    setMetaTag(
      'meta[name="robots"]',
      currentPath === '/admin'
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    setMetaTag('meta[name="description"]', meta.description);
    setMetaTag('meta[property="og:title"]', meta.title);
    setMetaTag('meta[property="og:description"]', meta.description);
    setMetaTag('meta[name="twitter:title"]', meta.title);
    setMetaTag('meta[name="twitter:description"]', meta.description);

    if (typeof window !== 'undefined') {
      const canonicalUrl = `${window.location.origin}${currentPath}`;
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) {
        canonical.setAttribute('href', canonicalUrl);
      }
      setMetaTag('meta[property="og:url"]', canonicalUrl);
      setMetaTag(
        'meta[property="og:image"]',
        `${window.location.origin}/assets/aistudio/Novesta_72b3be73.png`
      );
      setMetaTag(
        'meta[name="twitter:image"]',
        `${window.location.origin}/assets/aistudio/Novesta_72b3be73.png`
      );
    }

    const gscToken = siteConfig.seo.googleSiteVerification;
    if (gscToken && !gscToken.startsWith('REPLACE_')) {
      let gscMeta = document.querySelector('meta[name="google-site-verification"]');
      if (!gscMeta) {
        gscMeta = document.createElement('meta');
        gscMeta.setAttribute('name', 'google-site-verification');
        document.head.appendChild(gscMeta);
      }
      gscMeta.setAttribute('content', gscToken);
    }
  }, [currentPath]);

  const navigate = useCallback((path: string, hash?: string) => {
    const targetPath = normalizePath(path);
    const nextHash = hash || '';
    const targetUrl = nextHash ? `${targetPath}${nextHash}` : targetPath;
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', targetUrl);
    }
    setCurrentPath(targetPath);
    setCurrentHash(nextHash);

    if (nextHash) {
      const tryScroll = () => {
        const el = document.querySelector(nextHash);
        if (el) {
          el.scrollIntoView({ behavior: 'auto' });
        }
      };
      requestAnimationFrame(tryScroll);
      setTimeout(tryScroll, 220);
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  const scrollToContact = useCallback(() => {
    navigate('/', '#contact');
  }, [navigate]);

  const handleServiceQuote = useCallback(
    (serviceTitle: string) => {
      setSelectedService(serviceTitle);
      setPreselectTick((n) => n + 1);
      navigate('/', '#contact');
    },
    [navigate]
  );

  const handleIndustryPlan = useCallback(
    (businessType: string) => {
      setSelectedBusinessType(businessType);
      setPreselectTick((n) => n + 1);
      navigate('/', '#contact');
    },
    [navigate]
  );

  const handlePlanSelect = useCallback(
    (planName: string) => {
      setSelectedPlan(planName);
      setPreselectTick((n) => n + 1);
      navigate('/', '#contact');
    },
    [navigate]
  );

  const handleCitySelect = useCallback(
    (cityName: string) => {
      setSelectedCity(cityName);
      setPreselectTick((n) => n + 1);
      navigate('/', '#contact');
    },
    [navigate]
  );

  return (
    <ErrorBoundary>
    <div className="min-h-screen overflow-x-clip bg-[var(--color-bg)] text-[var(--color-ink)]">
      {/* Skip-to-content accessibility link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--color-btn-primary-bg)] focus:px-5 focus:py-2.5 focus:text-[14px] focus:font-medium focus:text-[var(--color-btn-primary-ink)]"
      >
        Skip to main content
      </a>

      {/* Demo Key Quota Banner */}
      {quotaExceeded && (
        <div className="sticky top-0 z-50 border-b border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] px-4 py-2.5 text-center text-[13px] text-[var(--color-warning-text)]">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <AnnouncementBar onSeePricing={() => navigate('/', '#pricing')} />
      <Header currentPath={currentPath} currentHash={currentHash} onNavigate={navigate} />

      <main id="main-content">
        {currentPath === '/careers' ? (
          <Suspense
            fallback={
              <div className="mx-auto max-w-3xl px-4 py-24 text-[15px] text-[var(--color-ink-secondary)]">
                Loading careers...
              </div>
            }
          >
            <CareersPage
              onBackHome={() => navigate('/')}
              onManageRoles={() => navigate('/admin')}
            />
          </Suspense>
        ) : currentPath === '/admin' ? (
          <Suspense
            fallback={
              <div className="mx-auto max-w-3xl px-4 py-24 text-[15px] text-[var(--color-ink-secondary)]">
                Loading founder workspace...
              </div>
            }
          >
            <FounderPortal
              onBackHome={() => navigate('/')}
              onOpenCareers={() => navigate('/careers')}
            />
          </Suspense>
        ) : currentPath === '/privacy' ? (
          <Suspense
            fallback={
              <div className="mx-auto max-w-3xl px-4 py-24 text-[15px] text-[var(--color-ink-secondary)]">
                Loading privacy policy...
              </div>
            }
          >
            <LegalPage type="privacy" onBackHome={() => navigate('/')} />
          </Suspense>
        ) : currentPath === '/terms' ? (
          <Suspense
            fallback={
              <div className="mx-auto max-w-3xl px-4 py-24 text-[15px] text-[var(--color-ink-secondary)]">
                Loading terms of service...
              </div>
            }
          >
            <LegalPage type="terms" onBackHome={() => navigate('/')} />
          </Suspense>
        ) : (
          <>
            <HeroSection onConsultationClick={scrollToContact} />
            <PromiseSection onConsultationClick={scrollToContact} />
            <FeaturePanel onSelectServiceQuote={handleServiceQuote} />
            <Suspense
              fallback={
                <section
                  id="reach"
                  className="scroll-mt-20 min-h-[540px] border-y border-[var(--color-globe-hairline)] bg-[var(--color-surface-inverse)]"
                />
              }
            >
              <ReachSection onGrowInCity={handleCitySelect} />
            </Suspense>
            <Suspense
              fallback={
                <section
                  id="pricing"
                  className="scroll-mt-20 min-h-[560px] bg-[var(--color-bg)]"
                />
              }
            >
              <PricingSection onSelectPlan={handlePlanSelect} />
            </Suspense>
            <Suspense fallback={<div className="min-h-[420px] bg-[var(--color-bg)]" />}>
              <IndustriesSection onSelectIndustry={handleIndustryPlan} />
            </Suspense>
            <Suspense fallback={<div className="min-h-[420px] bg-[var(--color-bg-subtle)]" />}>
              <ProcessSection />
            </Suspense>
            <Suspense
              fallback={
                <section
                  id="about"
                  className="scroll-mt-20 min-h-[280px] border-b border-[var(--color-border)] bg-[var(--color-bg)]"
                />
              }
            >
              <FounderSection />
            </Suspense>
            <Suspense
              fallback={
                <section
                  id="feedback"
                  className="scroll-mt-20 min-h-[440px] border-b border-[var(--color-border)] bg-[var(--color-bg)]"
                />
              }
            >
              <FeedbackSection />
            </Suspense>
            <Suspense fallback={<div className="min-h-[360px] bg-[var(--color-bg-subtle)]" />}>
              <FaqAccordion />
            </Suspense>
            <Suspense
              fallback={
                <div
                  id="contact"
                  className="scroll-mt-20 bg-[var(--color-inverse-bg)] py-24 text-center text-[15px] text-[var(--color-inverse-muted)]"
                >
                  Loading contact form...
                </div>
              }
            >
              <ContactSection
                preselectedService={selectedService}
                preselectedBusinessType={selectedBusinessType}
                preselectedPlan={selectedPlan}
                preselectedCity={selectedCity}
                preselectTick={preselectTick}
                quotaExceeded={quotaExceeded}
              />
            </Suspense>
          </>
        )}
      </main>

      <Footer onNavigate={navigate} />
    </div>
    </ErrorBoundary>
  );
}
