import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface BaseRollButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'inverse';
  icon?: ReactNode;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
}

type ButtonRollProps = BaseRollButtonProps & {
  href?: undefined;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  ariaLabel?: string;
};

type AnchorRollProps = BaseRollButtonProps & {
  href: string;
  target?: string;
  rel?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  ariaLabel?: string;
};

export type RollButtonProps = ButtonRollProps | AnchorRollProps;

export function RollButton(props: RollButtonProps) {
  const {
    label,
    variant = 'primary',
    icon,
    className = '',
    loading = false,
    disabled = false,
    ariaLabel,
  } = props;

  const isPrimaryOrInverse = variant === 'primary' || variant === 'inverse';

  const variantClasses = isPrimaryOrInverse
    ? 'resend-btn-primary'
    : 'resend-btn-secondary';

  const baseClasses = `inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-full px-6 py-2.5 text-[14px] font-medium disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses} ${className}`;

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : null}
      <span>{label}</span>
      {!loading && icon ? <span className="inline-flex shrink-0">{icon}</span> : null}
    </>
  );

  if (typeof props.href === 'string') {
    return (
      <a
        href={props.href}
        target={props.target}
        rel={props.rel}
        onClick={props.onClick}
        aria-label={ariaLabel}
        className={baseClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={props.type || 'button'}
      onClick={props.onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={baseClasses}
    >
      {content}
    </button>
  );
}
