import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { siteConfig } from '../config/site';
import { GoogleMapEmbed } from './GoogleMapEmbed';
import { RollButton } from './RollButton';

interface ContactSectionProps {
  preselectedService?: string;
  preselectedBusinessType?: string;
  preselectedPlan?: string;
  preselectedCity?: string;
  preselectTick?: number;
  quotaExceeded: boolean;
}

interface FormValues {
  name: string;
  phone: string;
  email: string;
  businessType: string;
  plan: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

export function ContactSection({
  preselectedService,
  preselectedBusinessType,
  preselectedPlan,
  preselectedCity,
  preselectTick = 0,
  quotaExceeded,
}: ContactSectionProps) {
  const [values, setValues] = useState<FormValues>({
    name: '',
    phone: '',
    email: '',
    businessType: '',
    plan: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverFeedback, setServerFeedback] = useState('');
  const [acceptedRequest, setAcceptedRequest] = useState<{
    id: string;
    status: string;
    businessType: string;
  } | null>(null);
  const [emailActionFeedback, setEmailActionFeedback] = useState(false);
  const userEditedMessageRef = useRef(false);

  useEffect(() => {
    if (preselectedService) {
      setStatus((prev) => (prev === 'success' ? 'idle' : prev));
      setValues((prev) => ({
        ...prev,
        message:
          !prev.message || !userEditedMessageRef.current
            ? `I would like a quote for ${preselectedService}.`
            : prev.message,
      }));
    }
  }, [preselectedService, preselectTick]);

  useEffect(() => {
    if (preselectedBusinessType) {
      setStatus((prev) => (prev === 'success' ? 'idle' : prev));
      setValues((prev) => ({
        ...prev,
        businessType: preselectedBusinessType,
      }));
    }
  }, [preselectedBusinessType, preselectTick]);

  useEffect(() => {
    if (preselectedPlan) {
      setStatus((prev) => (prev === 'success' ? 'idle' : prev));
      setValues((prev) => ({
        ...prev,
        plan: preselectedPlan,
      }));
    }
  }, [preselectedPlan, preselectTick]);

  useEffect(() => {
    if (preselectedCity) {
      setStatus((prev) => (prev === 'success' ? 'idle' : prev));
      setValues((prev) => ({
        ...prev,
        message:
          !prev.message || !userEditedMessageRef.current
            ? `I would like to grow my business in ${preselectedCity}.`
            : prev.message,
      }));
    }
  }, [preselectedCity, preselectTick]);

  const validate = (data: FormValues): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!data.name.trim() || data.name.trim().length < 2) {
      nextErrors.name = 'Please enter your full name (at least 2 characters).';
    }
    const cleanPhone = data.phone.replace(/[\s\-()]/g, '');
    if (!cleanPhone || !/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      nextErrors.phone = 'Please enter a valid phone or WhatsApp number.';
    }
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!data.businessType) {
      nextErrors.businessType = 'Please select your business type.';
    }
    if (!data.message.trim() || data.message.trim().length < 3) {
      nextErrors.message = 'Please share a brief note about your goals (3+ characters).';
    }
    return nextErrors;
  };

  const handleFieldChange = (field: keyof FormValues, val: string) => {
    if (field === 'message') {
      userEditedMessageRef.current = val.trim().length > 0;
    }
    setValues((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
    if (status === 'error') {
      setStatus('idle');
      setServerFeedback('');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatus('error');
      setServerFeedback('Please fix the highlighted fields before submitting.');
      return;
    }

    setStatus('loading');
    setServerFeedback('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload.error || 'Unable to submit your inquiry right now. Please try again.'
        );
      }

      setStatus('success');
      setAcceptedRequest(payload.request || null);
      setServerFeedback(
        payload.message ||
          'Thank you. Your consultation request has been received and our team will reach out shortly.'
      );
      setValues({
        name: '',
        phone: '',
        email: '',
        businessType: '',
        plan: '',
        message: '',
      });
      userEditedMessageRef.current = false;
      setErrors({});
    } catch (err) {
      setStatus('error');
      setServerFeedback(
        err instanceof Error
          ? err.message
          : 'Network error while sending your message. Please call or message us on WhatsApp.'
      );
    }
  };

  const whatsappText = acceptedRequest
    ? `Hi Novesta, I submitted consultation request ${acceptedRequest.id} (${acceptedRequest.businessType}).`
    : preselectedCity
      ? `${siteConfig.contact.whatsappPrefillText} City: ${preselectedCity}.`
      : siteConfig.contact.whatsappPrefillText;

  const whatsappHref = `${siteConfig.contact.whatsappUrl}?text=${encodeURIComponent(
    whatsappText
  )}`;

  const inputBaseClass =
    'mt-2 block w-full min-h-[44px] rounded-[var(--radius-sm)] border bg-black px-4 py-2.5 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-secondary)] transition-colors focus:border-[#00a3ff] disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="resend-spotlight-subtle scroll-mt-20 bg-[var(--color-bg)] py-16 text-[var(--color-ink)] sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="mono-eyebrow text-[#00a3ff]">
              CONTACT
            </p>
            <h2
              id="contact-heading"
              className="heading-section mt-3 text-[var(--color-text-tertiary)]"
            >
              <span className="resend-gradient-text">Get a free digital growth audit and </span>
              <span className="text-[#00a3ff]">consultation.</span>
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-6 text-[var(--color-ink-secondary)]">
            Tell us about your business. We will review your current online visibility and send a
            practical plan—no pushy sales calls.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left: Validated Contact Form */}
          <div className="novesta-card p-6 sm:p-8 lg:col-span-7">
            {status === 'success' ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-start justify-center py-8"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#00a3ff]/40 bg-[#00a3ff]/15 text-[#00a3ff]">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-[22px] font-medium text-[var(--color-text-tertiary)]">
                  Consultation Request Accepted
                </h3>
                <p className="mt-3 text-[15px] leading-7 text-[var(--color-inverse-muted)]">
                  {serverFeedback}
                </p>

                {acceptedRequest && (
                  <div className="mt-4 w-full rounded-[var(--radius-xs)] border border-[var(--color-inverse-border)] p-4 text-[14px]">
                    <p className="text-[var(--color-inverse-ink)]">
                      Reference ID:{' '}
                      <span className="font-mono text-[var(--color-accent-signal)]">
                        {acceptedRequest.id}
                      </span>
                    </p>
                    <p className="mt-1 text-[var(--color-inverse-muted)]">
                      Category: {acceptedRequest.businessType} · Status: {acceptedRequest.status}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <RollButton
                    type="button"
                    onClick={() => {
                      setStatus('idle');
                      setServerFeedback('');
                      setAcceptedRequest(null);
                    }}
                    label="Send another inquiry"
                    variant="inverse"
                  />
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--radius-step8)] border border-[var(--color-inverse-border)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-inverse-ink)] transition-colors hover:border-[var(--color-inverse-ink)]"
                  >
                    <MessageCircle className="h-4 w-4 text-[var(--color-inverse-ink)]" aria-hidden="true" />
                    <span>Message on WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div aria-live="polite" className="mb-4">
                  {status === 'error' && serverFeedback && (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-[var(--radius-xs)] border border-[var(--color-error-inverse)] bg-[var(--color-error-bg-inverse)] p-4 text-[14px] text-[var(--color-error-inverse)]"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{serverFeedback}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-[14px] font-medium text-[var(--color-inverse-ink)]"
                    >
                      Full Name <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      disabled={status === 'loading'}
                      value={values.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      placeholder="Your name"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'contact-name-error' : undefined}
                      className={`${inputBaseClass} ${
                        errors.name
                          ? 'border-[var(--color-error-inverse)]'
                          : 'border-[var(--color-inverse-border)] hover:border-[var(--color-inverse-ink)]'
                      }`}
                    />
                    {errors.name && (
                      <p
                        id="contact-name-error"
                        className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[var(--color-error-inverse)]"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block text-[14px] font-medium text-[var(--color-inverse-ink)]"
                    >
                      Phone / WhatsApp <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      disabled={status === 'loading'}
                      value={values.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="+91 98XXXXXXXX"
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                      className={`${inputBaseClass} ${
                        errors.phone
                          ? 'border-[var(--color-error-inverse)]'
                          : 'border-[var(--color-inverse-border)] hover:border-[var(--color-inverse-ink)]'
                      }`}
                    />
                    {errors.phone && (
                      <p
                        id="contact-phone-error"
                        className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[var(--color-error-inverse)]"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-[14px] font-medium text-[var(--color-inverse-ink)]"
                    >
                      Email Address <span aria-hidden="true">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      disabled={status === 'loading'}
                      value={values.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="you@business.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'contact-email-error' : undefined}
                      className={`${inputBaseClass} ${
                        errors.email
                          ? 'border-[var(--color-error-inverse)]'
                          : 'border-[var(--color-inverse-border)] hover:border-[var(--color-inverse-ink)]'
                      }`}
                    />
                    {errors.email && (
                      <p
                        id="contact-email-error"
                        className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[var(--color-error-inverse)]"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-business-type"
                      className="block text-[14px] font-medium text-[var(--color-inverse-ink)]"
                    >
                      Business Type <span aria-hidden="true">*</span>
                    </label>
                    <select
                      id="contact-business-type"
                      name="businessType"
                      required
                      disabled={status === 'loading'}
                      value={values.businessType}
                      onChange={(e) => handleFieldChange('businessType', e.target.value)}
                      aria-invalid={Boolean(errors.businessType)}
                      aria-describedby={
                        errors.businessType ? 'contact-business-error' : undefined
                      }
                      className={`${inputBaseClass} ${
                        errors.businessType
                          ? 'border-[var(--color-error-inverse)]'
                          : 'border-[var(--color-inverse-border)] hover:border-[var(--color-inverse-ink)]'
                      }`}
                    >
                      <option value="" className="bg-[var(--color-inverse-bg)] text-[var(--color-inverse-ink)]">
                        Select your industry
                      </option>
                      {siteConfig.businessTypeOptions.map((option) => (
                        <option
                          key={option}
                          value={option}
                          className="bg-[var(--color-inverse-bg)] text-[var(--color-inverse-ink)]"
                        >
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.businessType && (
                      <p
                        id="contact-business-error"
                        className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[var(--color-error-inverse)]"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{errors.businessType}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="contact-plan"
                    className="block text-[14px] font-medium text-[var(--color-inverse-ink)]"
                  >
                    Plan
                  </label>
                  <select
                    id="contact-plan"
                    name="plan"
                    disabled={status === 'loading'}
                    value={values.plan}
                    onChange={(e) => handleFieldChange('plan', e.target.value)}
                    className={`${inputBaseClass} border-[var(--color-inverse-border)] hover:border-[var(--color-inverse-ink)]`}
                  >
                    <option
                      value=""
                      className="bg-[var(--color-inverse-bg)] text-[var(--color-inverse-ink)]"
                    >
                      Choose a plan (optional)
                    </option>
                    {siteConfig.planSelectOptions.map((option) => (
                      <option
                        key={option}
                        value={option}
                        className="bg-[var(--color-inverse-bg)] text-[var(--color-inverse-ink)]"
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="contact-message"
                    className="block text-[14px] font-medium text-[var(--color-inverse-ink)]"
                  >
                    How can we help? <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={4}
                    required
                    disabled={status === 'loading'}
                    value={values.message}
                    onChange={(e) => handleFieldChange('message', e.target.value)}
                    placeholder="Share what you want to launch or improve (website, ordering system, Google Maps, SEO, AI WhatsApp bot)..."
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'contact-message-error' : undefined}
                    className={`${inputBaseClass} min-h-[120px] resize-y ${
                      errors.message
                        ? 'border-[var(--color-error-inverse)]'
                        : 'border-[var(--color-inverse-border)] hover:border-[var(--color-inverse-ink)]'
                    }`}
                  />
                  {errors.message && (
                    <p
                      id="contact-message-error"
                      className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[var(--color-error-inverse)]"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>{errors.message}</span>
                    </p>
                  )}
                </div>

                {status === 'error' && serverFeedback && (
                  <div
                    role="alert"
                    className="mt-5 flex items-start gap-3 rounded-[var(--radius-xs)] border border-[var(--color-error-inverse)] bg-[var(--color-error-bg-inverse)] p-3.5 text-[14px] text-[var(--color-error-inverse)]"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{serverFeedback}</span>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <RollButton
                    type="submit"
                    loading={status === 'loading'}
                    disabled={status === 'loading'}
                    label={
                      status === 'loading'
                        ? 'Sending Consultation Request...'
                        : 'Get Free Consultation'
                    }
                    variant="inverse"
                  />
                  <p className="text-[13px] text-[var(--color-inverse-muted)]">
                    Direct response within 1 business day.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Right: Direct Contact Channels + Google Map */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-5">
            <div className="novesta-card p-6 sm:p-8">
              <h3 className="text-[18px] font-medium text-[var(--color-text-tertiary)]">
                Direct Contact
              </h3>
              <p className="mt-1.5 text-[14px] text-[var(--color-ink-secondary)]">
                {siteConfig.contact.businessHours}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href={siteConfig.contact.phoneHref}
                  className="flex min-h-[48px] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-black/70 px-4 py-3 text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:border-[#00a3ff]/60 hover:text-[var(--color-text-tertiary)]"
                >
                  <Phone className="h-4 w-4 shrink-0 text-[#00a3ff]" aria-hidden="true" />
                  <span className="tabular-nums">{siteConfig.contact.phoneDisplay}</span>
                </a>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[48px] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-black/70 px-4 py-3 text-[15px] font-medium text-[var(--color-ink)] transition-colors hover:border-[#00a3ff]/60 hover:text-[var(--color-text-tertiary)]"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-[#00a3ff]" aria-hidden="true" />
                  <span>WhatsApp Chat ({siteConfig.contact.phoneDisplay})</span>
                </a>

                <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-black/70 transition-colors hover:border-[#00a3ff]/60">
                  <a
                    href={`${siteConfig.contact.emailHref}?subject=${encodeURIComponent(
                      'Business Digital Growth Inquiry — Novesta'
                    )}`}
                    onClick={() => {
                      navigator.clipboard?.writeText(siteConfig.contact.email).catch(() => {});
                      setEmailActionFeedback(true);
                    }}
                    className="flex min-h-[48px] items-center justify-between gap-3 px-4 py-3 text-[15px] font-medium text-[var(--color-ink)]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Mail className="h-4 w-4 shrink-0 text-[#00a3ff]" aria-hidden="true" />
                      <span className="truncate">{siteConfig.contact.email}</span>
                    </span>
                    <span className="shrink-0 text-[12px] text-[var(--color-ink-secondary)]">
                      {emailActionFeedback ? (
                        <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Copied
                        </span>
                      ) : (
                        'Email / Copy'
                      )}
                    </span>
                  </a>
                  {emailActionFeedback && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] px-4 py-2 text-[12px] text-[var(--color-ink-secondary)]">
                      <span>Copied {siteConfig.contact.email}</span>
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                          siteConfig.contact.email
                        )}&su=${encodeURIComponent('Business Digital Growth Inquiry — Novesta')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-[#d6ebfd] underline underline-offset-2 hover:text-[#00a3ff]"
                      >
                        <span>Open in Gmail</span>
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-black/70 px-4 py-3 text-[14px] text-[var(--color-ink-secondary)]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#00a3ff]" aria-hidden="true" />
                  <span>{siteConfig.contact.address.full}</span>
                </div>
              </div>
            </div>

            <GoogleMapEmbed quotaExceeded={quotaExceeded} />
          </div>
        </div>
      </div>
    </section>
  );
}
