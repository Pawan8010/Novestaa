import { siteConfig } from '../config/site';

interface NovestaLogoProps {
  variant?: 'header' | 'hero' | 'footer';
}

export function NovestaLogo({ variant = 'header' }: NovestaLogoProps) {
  if (variant === 'header') {
    return (
      <span className="group inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border-strong)] bg-black shadow-[var(--shadow-4)] ring-1 ring-[#d6ebfd]/15 transition-all duration-200 hover:border-[#00a3ff]/70 hover:ring-[#00a3ff]/30">
        <img
          src={siteConfig.brand.iconPath}
          alt={siteConfig.brand.iconAlt}
          className="h-full w-full scale-[1.36] object-cover transition-transform duration-300 group-hover:scale-[1.44]"
          width={40}
          height={40}
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </span>
    );
  }

  const isHero = variant === 'hero';
  const isFooter = variant === 'footer';

  const containerSize = isHero
    ? 'h-11 pl-1.5 pr-4 gap-2.5 sm:h-12 sm:pl-1.5 sm:pr-5 sm:gap-3'
    : 'h-10 pl-1.5 pr-4 gap-2.5';

  const emblemSize = isHero ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-7 w-7';
  const textSize = isHero
    ? 'text-[14px] tracking-[0.2em] sm:text-[15px]'
    : 'text-[14px] tracking-[0.18em]';

  return (
    <span
      className={`group inline-flex shrink-0 items-center rounded-full border border-[var(--color-border-strong)] bg-black/90 text-[var(--color-text-tertiary)] shadow-[var(--shadow-4)] ring-1 ring-[#d6ebfd]/10 transition-all duration-200 hover:border-[#00a3ff]/60 hover:ring-[#00a3ff]/25 ${containerSize}`}
    >
      <span
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black ring-1 ring-[#d6ebfd]/20 ${emblemSize}`}
      >
        <img
          src={siteConfig.brand.iconPath}
          alt={siteConfig.brand.iconAlt}
          className="h-full w-full scale-[1.36] object-cover transition-transform duration-300 group-hover:scale-[1.44]"
          width={36}
          height={36}
          loading={isFooter ? 'lazy' : 'eager'}
          decoding="async"
          fetchPriority={isFooter ? 'low' : 'high'}
        />
      </span>

      <span aria-hidden="true" className="h-3.5 w-px shrink-0 bg-[#d6ebfd]/25" />

      <span
        className={`select-none whitespace-nowrap font-semibold uppercase leading-none text-[var(--color-text-tertiary)] ${textSize}`}
      >
        NOVESTA
      </span>
    </span>
  );
}
