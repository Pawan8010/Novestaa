import React from 'react';

interface AdSlotProps {
  variant: 'leaderboard' | 'sidebar';
  className?: string;
}

/**
 * CLS-safe reserved ad slot placeholder.
 * Loads zero third-party ad scripts until site approval and explicit consent.
 * Always positioned safely away from Download buttons and interactive controls.
 */
export const AdSlot: React.FC<AdSlotProps> = ({ variant, className = '' }) => {
  const isLeaderboard = variant === 'leaderboard';
  return (
    <aside
      aria-label={isLeaderboard ? 'Advertisement leaderboard placeholder' : 'Advertisement sidebar placeholder'}
      className={`flex flex-col items-center justify-center rounded-[12px] border border-dashed text-center ${
        isLeaderboard ? 'min-h-[90px] w-full max-w-[728px] mx-auto px-4 py-3' : 'min-h-[250px] w-full max-w-[300px] px-4 py-4'
      } ${className}`}
      style={{
        borderColor: 'var(--color-border-strong)',
        backgroundColor: 'var(--color-surface-subtle)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        Advertisement
      </span>
      <span className="mt-1 text-xs font-medium">
        {isLeaderboard ? 'Ad Space (728x90 Leaderboard)' : 'Ad Space (300x250 Sidebar)'}
      </span>
    </aside>
  );
};
