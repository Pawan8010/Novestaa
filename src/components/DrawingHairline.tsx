interface DrawingHairlineProps {
  className?: string;
}

export function DrawingHairline({ className = '' }: DrawingHairlineProps) {
  return (
    <div
      aria-hidden="true"
      className={`h-px w-full bg-[var(--color-border)] ${className}`}
    />
  );
}
