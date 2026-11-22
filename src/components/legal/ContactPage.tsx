import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail, MapPin, Send } from 'lucide-react';
import { siteConfig } from '../../config/site';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Exam preset update');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (name.trim().length < 2) {
      setErrorMsg('Please enter your name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (message.trim().length < 5) {
      setErrorMsg('Please write a short message describing how we can help.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          businessType: topic,
          plan: 'PDFIndia Support',
          message: message.trim(),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setErrorMsg(data.error || 'Could not send your message right now. Please email us directly.');
      } else {
        setSuccessMsg(
          data.message || 'Your message has been received. We will respond within 1–2 business days.'
        );
        setName('');
        setEmail('');
        setMessage('');
      }
    } catch {
      setErrorMsg('Network error while sending your message. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-saffron-text)' }}>
          Support &amp; Preset Updates
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-navy)' }}>
          Contact {siteConfig.brand.name}
        </h1>
        <p className="text-sm leading-relaxed sm:text-base" style={{ color: 'var(--color-text-secondary)' }}>
          Spot a changed UPSC, SSC, IBPS, GATE, NEET, or RRB official notification rule, or need help with a tool? Send us a note—never attach personal ID documents or marksheets here.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-12">
        <div className="space-y-4 md:col-span-5">
          <div className="pdf-card space-y-4 p-6">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--color-saffron)' }} aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                  Support Email
                </h2>
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="mt-1 inline-block text-sm font-semibold underline underline-offset-2"
                  style={{ color: 'var(--color-saffron-text)' }}
                >
                  {siteConfig.supportEmail}
                </a>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Replies within 1–2 business days.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
              <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--color-navy)' }} aria-hidden="true" />
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-navy)' }}>
                  Published by Novesta
                </h2>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {siteConfig.contact.address.full}
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="pdf-card space-y-4 p-6 md:col-span-7" noValidate>
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[12px] border px-3.5 py-2.5 text-sm"
              style={{
                backgroundColor: 'var(--color-error-bg)',
                borderColor: 'var(--color-error-border)',
                color: 'var(--color-error)',
              }}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-[12px] border px-3.5 py-2.5 text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-success-bg)',
                borderColor: 'var(--color-success-border)',
                color: 'var(--color-success)',
              }}
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
              Full Name
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="pdf-input mt-1.5 min-h-[44px] w-full px-3 text-sm font-normal"
              />
            </label>
            <label className="block text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
              Email Address
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="pdf-input mt-1.5 min-h-[44px] w-full px-3 text-sm font-normal"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
            Topic
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="pdf-input mt-1.5 min-h-[44px] w-full px-3 text-sm font-normal"
            >
              <option value="Exam preset update">Exam preset update / official notification link</option>
              <option value="Tool bug report">Tool issue or browser bug report</option>
              <option value="Privacy or DPDP inquiry">Privacy or DPDP Act inquiry</option>
              <option value="General feedback">General feedback</option>
            </select>
          </label>

          <label className="block text-xs font-semibold" style={{ color: 'var(--color-navy)' }}>
            Message
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Include the exam name, official notification URL, or issue details (do not include Aadhaar or personal ID numbers)."
              className="pdf-input mt-1.5 w-full px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="pdf-btn-primary inline-flex min-h-[46px] items-center gap-2 px-5 py-2.5 text-sm font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
