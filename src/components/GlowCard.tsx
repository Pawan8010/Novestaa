interface GlowCardProps {
  title: string;
}

export function GlowCard({ title }: GlowCardProps) {
  return (
    <div className="novesta-glow-surface relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] p-8 sm:aspect-[16/10] lg:aspect-square">
      <div aria-hidden="true" className="novesta-arch-grid pointer-events-none absolute inset-0 opacity-70" />

      {/* Top luminous hairline highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#00a3ff]/70 to-transparent"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none relative flex h-[72%] w-[72%] max-w-[340px] items-center justify-center sm:aspect-square sm:h-[74%] sm:w-auto sm:max-w-none"
      >
        <div
          className="aspect-square h-full w-full rounded-full border border-[#00a3ff]/80"
          style={{
            boxShadow:
              '0 0 48px rgba(0, 163, 255, 0.28), inset 0 0 38px rgba(0, 163, 255, 0.22)',
          }}
        />
        <div className="absolute inset-6 rounded-full border border-[#d6ebfd]/15" />
      </div>

      {/* Centered crisp title with subtle sky luminescence */}
      <span className="novesta-glow-text pointer-events-none absolute px-6 text-center text-[22px] font-medium tracking-tight text-[var(--color-text-tertiary)] sm:text-[28px]">
        {title}
      </span>
    </div>
  );
}
