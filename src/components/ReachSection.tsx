import { Suspense, lazy, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { siteConfig } from '../config/site';
import { CityPanel } from './CityPanel';
import { CityPills } from './CityPills';

const LazyGlobe = lazy(() => import('./Globe'));

interface ReachSectionProps {
  onGrowInCity: (cityName: string) => void;
}

function GlobePlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="flex aspect-square w-full items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-8"
    >
      <div
        className="h-[78%] w-[78%] rounded-full border border-[var(--color-border)] opacity-75"
        style={{
          backgroundImage:
            'radial-gradient(var(--color-globe-dot) 1.25px, transparent 1.25px)',
          backgroundSize: '14px 14px',
        }}
      />
    </div>
  );
}

export function ReachSection({ onGrowInCity }: ReachSectionProps) {
  const cities = siteConfig.reach.cities;
  const homeCity =
    cities.find((c) => c.id === siteConfig.reach.home) || cities[0];

  const [selectedCityId, setSelectedCityId] = useState<string>(homeCity.id);

  const selectedIndex = Math.max(
    0,
    cities.findIndex((c) => c.id === selectedCityId)
  );
  const selectedCity = cities[selectedIndex] || homeCity;

  const handlePrev = () => {
    const prevIdx = (selectedIndex - 1 + cities.length) % cities.length;
    setSelectedCityId(cities[prevIdx].id);
  };

  const handleNext = () => {
    const nextIdx = (selectedIndex + 1) % cities.length;
    setSelectedCityId(cities[nextIdx].id);
  };

  return (
    <section
      id="reach"
      aria-labelledby="reach-heading"
      className="resend-spotlight-subtle scroll-mt-20 border-b border-[var(--color-border)] bg-[var(--color-bg)] py-16 text-[var(--color-ink)] sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-6">
          {/* 1. Heading */}
          <div className="order-1 lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <p className="mono-eyebrow text-[#00a3ff]">
              GLOBAL REACH
            </p>
            <h2
              id="reach-heading"
              className="heading-section mt-3 text-[var(--color-text-tertiary)]"
            >
              <span className="resend-gradient-text">Built in {homeCity.city}. Ready for the </span>
              <span className="text-[#00a3ff]">world.</span>
            </h2>
          </div>

          {/* 2. Supporting line */}
          <div className="order-2 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-end">
            <p className="text-[16px] leading-6 text-[var(--color-ink-secondary)]">
              Drag to explore. Pick a city to see how we can grow your business there.
            </p>
          </div>

          {/* 3. Globe Canvas + Controls */}
          <div className="order-3 mx-auto w-full max-w-[440px] sm:max-w-[480px] lg:order-none lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:mx-0 lg:max-w-none">
            <Suspense fallback={<GlobePlaceholder />}>
              <LazyGlobe
                cities={cities}
                homeCityId={homeCity.id}
                selectedCityId={selectedCity.id}
                onSelectCity={setSelectedCityId}
              />
            </Suspense>

            {/* Controls row under the globe */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous city"
                  className="resend-btn-secondary inline-flex h-11 w-11 items-center justify-center rounded-full"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next city"
                  className="resend-btn-secondary inline-flex h-11 w-11 items-center justify-center rounded-full"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCityId(homeCity.id)}
                disabled={selectedCity.id === homeCity.id}
                className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-full px-3 text-[13px] font-medium text-[var(--color-ink-secondary)] transition-colors hover:text-[#d6ebfd] disabled:cursor-default disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Back to {homeCity.city}</span>
              </button>
            </div>
          </div>

          {/* 4. CityPills + CityPanel */}
          <div className="order-4 flex flex-col gap-6 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-2">
            <CityPills
              cities={cities}
              selectedCityId={selectedCity.id}
              onSelectCity={setSelectedCityId}
              onGrowInCity={onGrowInCity}
            />

            <CityPanel
              city={selectedCity}
              cityIndex={selectedIndex}
              onGrowInCity={onGrowInCity}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
