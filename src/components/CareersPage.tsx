import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  MessageCircle,
  X,
} from 'lucide-react';
import { siteConfig, type CareerRole } from '../config/site';
import { RollButton } from './RollButton';

interface CareersPageProps {
  onBackHome: () => void;
}

interface LiveCareerRole extends CareerRole {
  status?: string;
  applicantCount?: number;
}

interface AcceptedApplication {
  id: string;
  role: string;
  fullName: string;
  status: string;
  submittedAt: string;
}

export function CareersPage({ onBackHome }: CareersPageProps) {
  const formSectionRef = useRef<HTMLElement>(null);
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const { careers } = siteConfig;

  const [roles, setRoles] = useState<LiveCareerRole[]>(careers.roles);
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [answer3, setAnswer3] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');
  const [acceptedReceipt, setAcceptedReceipt] = useState<AcceptedApplication | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/careers/roles', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load roles'))))
      .then((data) => {
        if (active && Array.isArray(data.roles)) {
          setRoles(data.roles);
        }
      })
      .catch(() => {
        // Fallback smoothly to static siteConfig roles
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSelectRole = (selected: LiveCareerRole) => {
    setRole(selected.title);
    setStatus('idle');
    setFeedback('');
    setAcceptedReceipt(null);
    formSectionRef.current?.scrollIntoView({ behavior: 'auto' });
    setTimeout(() => {
      fullNameInputRef.current?.focus();
    }, 50);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (role.trim().length < 2) {
      setStatus('error');
      setFeedback('Please enter or select a role (at least 2 characters) before submitting.');
      return;
    }
    if (fullName.trim().length < 2) {
      setStatus('error');
      setFeedback('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error');
      setFeedback('Please enter a valid email address.');
      return;
    }
    if (answer1.trim().length < 2 || answer2.trim().length < 2 || answer3.trim().length < 2) {
      setStatus('error');
      setFeedback('Please answer all three questions (at least 2 characters each).');
      return;
    }
    if (!confirmed) {
      setStatus('error');
      setFeedback('Please confirm you read the expectations above.');
      return;
    }

    setStatus('loading');
    setFeedback('');

    try {
      const response = await fetch('/api/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role.trim(),
          fullName: fullName.trim(),
          email: email.trim(),
          answer1: answer1.trim(),
          answer2: answer2.trim(),
          answer3: answer3.trim(),
          confirmed,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Could not submit application right now.');
      }

      const submittedRole = role;
      setStatus('success');
      setAcceptedReceipt(payload.application || null);
      setFeedback(
        payload.message ||
          'Application accepted! We review every submission directly and reach out quickly.'
      );
      if (typeof payload.roleApplicantCount === 'number') {
        setRoles((prev) =>
          prev.map((item) =>
            item.title === submittedRole
              ? { ...item, applicantCount: payload.roleApplicantCount }
              : item
          )
        );
      }

      setRole('');
      setFullName('');
      setEmail('');
      setAnswer1('');
      setAnswer2('');
      setAnswer3('');
      setConfirmed(false);
      formSectionRef.current?.scrollIntoView({ behavior: 'auto' });
    } catch (err) {
      setStatus('error');
      setFeedback(
        err instanceof Error ? err.message : 'Network error submitting your application.'
      );
    }
  };

  const darkInputClass =
    'mt-2 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-black px-4 py-2.5 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-secondary)] transition-colors hover:border-[var(--color-border-strong)] focus:border-[#00a3ff] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

  const receiptWhatsappHref = acceptedReceipt
    ? `${siteConfig.contact.whatsappUrl}?text=${encodeURIComponent(
        `Hi Novesta, I submitted an application for ${acceptedReceipt.role} (Reference: ${acceptedReceipt.id}).`
      )}`
    : siteConfig.contact.whatsappUrl;

  return (
    <div>
      {/* 1. Careers Header */}
      <section
        aria-labelledby="careers-heading"
        className="resend-spotlight-hero relative overflow-hidden bg-[var(--color-bg)] pb-14 pt-8 text-[var(--color-ink)] sm:pb-24 sm:pt-14"
      >
        <div aria-hidden="true" className="novesta-arch-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBackHome}
            className="resend-btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to {siteConfig.brand.name}</span>
          </button>

          <div className="mt-10 max-w-5xl sm:mt-16">
            <p className="mono-eyebrow text-[#00a3ff]">
              {careers.eyebrow}
            </p>

            <h1
              id="careers-heading"
              className="mt-4 font-medium leading-[1.03] tracking-[-0.04em]"
              style={{ fontSize: 'clamp(36px, 6.2vw, 76.8px)' }}
            >
              <span className="resend-gradient-text block">{careers.headlineLine1}</span>
              <span className="block text-[#00a3ff]">{careers.headlineLine2}</span>
            </h1>

            <p className="mt-6 max-w-2xl text-[16px] leading-7 text-[var(--color-ink-secondary)] sm:mt-8 sm:text-[18px]">
              {careers.subheadline}
            </p>
          </div>
        </div>
      </section>

      {/* 2. Hiring Standard Bar & Filter Lists */}
      <section
        aria-label="Hiring bar"
        className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] py-14 text-[var(--color-ink)] sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-10">
            {/* Thrive Here If */}
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-6 sm:p-9">
              <p className="mono-eyebrow text-[var(--color-accent-signal)]">
                WHO THRIVES HERE
              </p>
              <h2 className="mt-3 text-[24px] font-normal tracking-[-0.03em] text-[var(--color-inverse-ink)] sm:text-[32px]">
                You&apos;ll thrive here if
              </h2>
              <ul className="mt-6 space-y-4">
                {careers.thriveItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[15px] leading-6 text-[var(--color-surface-strong)] sm:text-[16px]"
                  >
                    <Check
                      className="mt-1 h-4 w-4 shrink-0 text-[var(--color-accent-signal)]"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Please Don't Apply If */}
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-6 sm:p-9">
              <p className="mono-eyebrow text-[var(--color-surface-strong)]">
                SELF-FILTER
              </p>
              <h2 className="mt-3 text-[24px] font-normal tracking-[-0.03em] text-[var(--color-inverse-ink)] sm:text-[32px]">
                Please don&apos;t apply if
              </h2>
              <ul className="mt-6 space-y-4">
                {careers.dontApplyItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[15px] leading-6 text-[var(--color-surface-strong)] sm:text-[16px]"
                  >
                    <X
                      className="mt-1 h-4 w-4 shrink-0 text-[var(--color-error-inverse)]"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. Open Roles (synced live from /api/careers/roles) */}
          <div className="mt-14 border-t border-[var(--color-border)] pt-12 sm:mt-20 sm:pt-14">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mono-eyebrow text-[var(--color-accent-signal)]">
                  LIVE OPENINGS
                </p>
                <h2 className="heading-section mt-2 text-[var(--color-inverse-ink)]">
                  Open <span className="text-[var(--color-accent-signal)]">roles</span>
                </h2>
              </div>
            </div>

            <div className="mt-8 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {roles.map((seat) => (
                <div key={seat.id} className="py-6 sm:py-7">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="mono-eyebrow text-[var(--color-accent-signal)]">
                          {seat.code}
                        </span>
                        <span className="text-[14px] text-[var(--color-surface-strong)]">
                          {seat.team} · {seat.location}
                        </span>
                        <span className="text-[12px] text-[var(--color-accent-signal)]">
                          · {seat.status || 'Accepting applications'}
                        </span>
                      </div>
                      <h3 className="mt-2 text-[22px] font-normal tracking-[-0.025em] text-[var(--color-inverse-ink)] sm:text-[30px]">
                        {seat.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectRole(seat)}
                        className="resend-btn-primary inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-2.5 text-[14px] font-medium sm:w-auto"
                      >
                        <span>Apply</span>
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Apply in three questions form */}
      <section
        ref={formSectionRef}
        id="career-apply-form"
        aria-labelledby="apply-heading"
        className="dark-signal-surface border-t border-[var(--color-border)] bg-[var(--color-surface-inverse)] py-14 text-[var(--color-inverse-ink)] sm:py-24"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="mono-eyebrow text-[var(--color-surface-strong)]">
            APPLICATION
          </p>
          <h2 id="apply-heading" className="heading-section mt-3 text-[var(--color-inverse-ink)]">
            Apply in three <span className="text-[var(--color-accent-signal)]">questions.</span>
          </h2>
          <p className="mt-3 text-[16px] leading-6 text-[var(--color-surface-strong)]">
            No cover letters. Every application is accepted and reviewed directly in real time.
          </p>

          <div className="mt-8 rounded-[var(--radius-sm)] border border-[var(--color-border)] p-5 sm:mt-10 sm:p-8">
            {status === 'success' ? (
              <div role="status" aria-live="polite" className="py-4">
                <CheckCircle2
                  className="h-8 w-8 text-[var(--color-accent-signal)]"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-[22px] font-medium text-[var(--color-inverse-ink)]">
                  Application Accepted
                </h3>
                <p className="mt-2 text-[15px] leading-6 text-[var(--color-surface-strong)]">
                  {feedback}
                </p>

                {acceptedReceipt && (
                  <div className="mt-5 rounded-[var(--radius-xs)] border border-[var(--color-border)] p-4 text-[14px]">
                    <p className="text-[var(--color-inverse-ink)]">
                      Reference ID:{' '}
                      <span className="font-mono text-[var(--color-accent-signal)]">
                        {acceptedReceipt.id}
                      </span>
                    </p>
                    <p className="mt-1 text-[var(--color-surface-strong)]">
                      Role: {acceptedReceipt.role} · Status: {acceptedReceipt.status}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <RollButton
                    type="button"
                    label="Submit another application"
                    variant="inverse"
                    onClick={() => {
                      setStatus('idle');
                      setFeedback('');
                      setAcceptedReceipt(null);
                    }}
                  />
                  <a
                    href={receiptWhatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-[var(--color-border)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-inverse-ink)] transition-colors hover:border-[var(--color-inverse-ink)]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Message on WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div aria-live="polite" className="mb-4">
                  {status === 'error' && feedback && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-[var(--radius-xs)] border border-[var(--color-error-inverse)] bg-[var(--color-error-bg-inverse)] p-3.5 text-[14px] text-[var(--color-error-inverse)]"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{feedback}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="career-role"
                    className="block text-[14px] font-medium text-[var(--color-inverse-ink)]"
                  >
                    Role <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="career-role"
                    type="text"
                    required
                    disabled={status === 'loading'}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Pick an open role below or type any custom role..."
                    className={darkInputClass}
                  />
                  <div
                    role="group"
                    aria-label="Quick select open roles"
                    className="mt-3 flex flex-wrap gap-2"
                  >
                    {roles.map((r) => {
                      const isSelected = role.trim().toLowerCase() === r.title.toLowerCase();
                      return (
                        <button
                          key={r.id}
                          type="button"
                          disabled={status === 'loading'}
                          aria-pressed={isSelected}
                          onClick={() => setRole(r.title)}
                          className={`inline-flex min-h-[38px] items-center rounded-[var(--radius-xs)] border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                            isSelected
                              ? 'border-[var(--color-accent-signal)] bg-[var(--color-accent-signal)] text-[var(--color-surface-inverse)]'
                              : 'border-[var(--color-border)] bg-[var(--color-surface-inverse)] text-[var(--color-surface-strong)] hover:border-[var(--color-inverse-ink)] hover:text-[var(--color-inverse-ink)]'
                          }`}
                        >
                          {r.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="career-fullname"
                      className="block text-[14px] font-medium text-[var(--color-inverse-ink)]"
                    >
                      Full name <span aria-hidden="true">*</span>
                    </label>
                    <input
                      ref={fullNameInputRef}
                      id="career-fullname"
                      type="text"
                      required
                      disabled={status === 'loading'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className={darkInputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="career-email"
                      className="block text-[14px] font-medium text-[var(--color-inverse-ink)]"
                    >
                      Email <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="career-email"
                      type="email"
                      required
                      disabled={status === 'loading'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={darkInputClass}
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="career-q1"
                      className="block text-[14px] font-medium leading-6 text-[var(--color-inverse-ink)]"
                    >
                      <span className="mono-eyebrow mr-2 text-[var(--color-accent-signal)]">
                        {careers.questions[0].number}.
                      </span>
                      {careers.questions[0].label} <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="career-q1"
                      rows={3}
                      required
                      disabled={status === 'loading'}
                      value={answer1}
                      onChange={(e) => setAnswer1(e.target.value)}
                      placeholder="Be specific and include live links if available..."
                      className={`${darkInputClass} min-h-[96px] resize-y`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="career-q2"
                      className="block text-[14px] font-medium leading-6 text-[var(--color-inverse-ink)]"
                    >
                      <span className="mono-eyebrow mr-2 text-[var(--color-accent-signal)]">
                        {careers.questions[1].number}.
                      </span>
                      {careers.questions[1].label} <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="career-q2"
                      rows={3}
                      required
                      disabled={status === 'loading'}
                      value={answer2}
                      onChange={(e) => setAnswer2(e.target.value)}
                      placeholder="Share the problem and exactly how you solved it..."
                      className={`${darkInputClass} min-h-[96px] resize-y`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="career-q3"
                      className="block text-[14px] font-medium leading-6 text-[var(--color-inverse-ink)]"
                    >
                      <span className="mono-eyebrow mr-2 text-[var(--color-accent-signal)]">
                        {careers.questions[2].number}.
                      </span>
                      {careers.questions[2].label} <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="career-q3"
                      rows={3}
                      required
                      disabled={status === 'loading'}
                      value={answer3}
                      onChange={(e) => setAnswer3(e.target.value)}
                      placeholder="Share the three practical improvements you would ship..."
                      className={`${darkInputClass} min-h-[96px] resize-y`}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="flex cursor-pointer items-start gap-3 text-[14px] text-[var(--color-inverse-ink)]">
                    <input
                      type="checkbox"
                      required
                      disabled={status === 'loading'}
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent-signal)]"
                    />
                    <span>
                      {careers.confirmLabel} <span aria-hidden="true">*</span>
                    </span>
                  </label>
                </div>

                {status === 'error' && feedback && (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-2.5 rounded-[var(--radius-xs)] border border-[var(--color-error-inverse)] bg-[var(--color-error-bg-inverse)] p-3.5 text-[14px] text-[var(--color-error-inverse)]"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{feedback}</span>
                  </div>
                )}

                <div className="mt-7">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="resend-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 py-3 text-[15px] font-medium disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
                  >
                    <span>{status === 'loading' ? 'Submitting...' : 'Submit Application'}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
