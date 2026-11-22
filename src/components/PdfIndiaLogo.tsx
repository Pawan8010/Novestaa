interface PdfIndiaLogoProps {
  size?: 'sm' | 'md';
}

export function PdfIndiaLogo({ size = 'md' }: PdfIndiaLogoProps) {
  const iconSize = size === 'sm' ? 28 : 34;
  const textClass =
    size === 'sm'
      ? 'text-[19px] font-bold tracking-[-0.03em] leading-none'
      : 'text-[22px] font-bold tracking-[-0.03em] leading-none';

  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 select-none whitespace-nowrap">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Document body with folded top-right corner */}
        <path
          d="M6 5.5C6 4.11929 7.11929 3 8.5 3H22.5L30 10.5V30.5C30 31.8807 28.8807 33 27.5 33H8.5C7.11929 33 6 31.8807 6 30.5V5.5Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Folded corner flap */}
        <path
          d="M22 3V10.5H29.5"
          fill="#F1F5F9"
          stroke="#0F172A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Clean document lines */}
        <line x1="11" y1="14.5" x2="22" y2="14.5" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="11" y1="19" x2="19" y2="19" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        {/* Small navy and saffron accent badge */}
        <rect x="10.5" y="23.5" width="7.5" height="5" rx="1.5" fill="#0F172A" />
        <rect x="19" y="23.5" width="6.5" height="5" rx="1.5" fill="#EA580C" />
      </svg>
      <span className={textClass}>
        <span className="text-[var(--color-navy)]">PDF</span>
        <span className="text-[var(--color-saffron)]">India</span>
      </span>
    </span>
  );
}
