import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Lock,
  MessageCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import { formatCurrencyValue, siteConfig, type PricingPlan } from '../config/site';

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayHandlerResponse) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (resp: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface PaymentModalProps {
  plan: PricingPlan | null;
  onClose: () => void;
}

interface VerifiedReceipt {
  receipt: string;
  orderId: string;
  paymentId: string;
  planName: string;
  billing?: string;
  amountInr: number;
  customerEmail?: string;
  customerEmailSent?: boolean;
  adminEmailSent?: boolean;
  services?: string[];
  status: string;
  paidAt: string;
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function PaymentModal({ plan, onClose }: PaymentModalProps) {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<VerifiedReceipt | null>(null);

  useEffect(() => {
    if (!plan) return;
    setError('');
    setReceipt(null);
    void loadRazorpayScript();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading && !verifying) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [plan, loading, verifying, onClose]);

  if (!plan) return null;

  const formattedAmount = formatCurrencyValue(plan.price);
  const hasSavings = plan.originalPrice > plan.price;
  const formattedOriginal = formatCurrencyValue(plan.originalPrice);

  const handleCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit phone or WhatsApp number.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        throw new Error(
          'Could not load Razorpay Checkout. Check your internet connection or ad-blocker and try again.'
        );
      }

      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          name: name.trim(),
          businessName: businessName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        }),
      });

      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderData.orderId || !orderData.keyId) {
        throw new Error(orderData.error || 'Could not initiate Razorpay order.');
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: siteConfig.brand.name,
        description: `${plan.name} (${plan.billing})`,
        order_id: orderData.orderId,
        prefill: {
          name: name.trim(),
          email: email.trim(),
          contact: cleanPhone,
        },
        notes: {
          planId: plan.id,
          businessName: businessName.trim() || 'Not specified',
        },
        theme: { color: '#00a3ff' },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response: RazorpayHandlerResponse) => {
          setLoading(false);
          setVerifying(true);
          setError('');
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Payment verification failed.');
            }
            setReceipt(verifyData as VerifiedReceipt);
          } catch (verifyErr) {
            setError(
              verifyErr instanceof Error
                ? verifyErr.message
                : 'Payment received, but verification encountered an error. Please share your payment ID on WhatsApp.'
            );
          } finally {
            setVerifying(false);
          }
        },
      });

      rzp.on('payment.failed', (failure) => {
        setLoading(false);
        setError(
          failure.error?.description ||
            'Payment was declined or cancelled. You can retry anytime.'
        );
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Unable to start Razorpay checkout.');
    }
  };

  const receiptWhatsappUrl = receipt
    ? `${siteConfig.contact.whatsappUrl}?text=${encodeURIComponent(
        `Hi Novesta, I just completed my payment for ${receipt.planName} (${formatCurrencyValue(
          receipt.amountInr
        )}). Receipt: ${receipt.receipt}, Payment ID: ${receipt.paymentId}.`
      )}`
    : siteConfig.contact.whatsappUrl;

  const inputClass =
    'mt-1.5 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-black px-3.5 py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-secondary)] focus:border-[#00a3ff] focus:outline-none disabled:opacity-60';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && !verifying) {
          onClose();
        }
      }}
    >
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[#08090d] p-6 text-[var(--color-ink)] shadow-[var(--shadow-2)] sm:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-4">
          <div>
            <p className="mono-eyebrow text-[#00a3ff]">
              RAZORPAY SECURE CHECKOUT
            </p>
            <h3 id="payment-modal-title" className="mt-1 text-[20px] font-medium text-[var(--color-text-tertiary)]">
              {plan.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              {hasSavings && (
                <span className="text-[14px] line-through tabular-nums text-[var(--color-ink-secondary)]">
                  {formattedOriginal}
                </span>
              )}
              <span className="text-[22px] font-medium tabular-nums text-[var(--color-text-tertiary)]">
                {formattedAmount}
              </span>
              <span className="text-[13px] text-[var(--color-ink-secondary)]">{plan.billing}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading || verifying}
            aria-label="Close payment modal"
            className="resend-btn-secondary inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {verifying ? (
          <div className="py-12 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-[var(--color-ink)]" aria-hidden="true" />
            <p className="mt-4 text-[16px] font-medium text-[var(--color-ink)]">
              Verifying payment signature with Razorpay...
            </p>
            <p className="mt-1 text-[14px] text-[var(--color-ink-secondary)]">
              Please wait a moment while we confirm your receipt.
            </p>
          </div>
        ) : receipt ? (
          <div role="status" aria-live="polite" className="py-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#00a3ff]/40 bg-[#00a3ff]/15 text-[#00a3ff]">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h4 className="mt-4 text-[22px] font-medium text-[var(--color-text-tertiary)]">
              Payment Confirmed
            </h4>
            <p className="mt-1.5 text-[14px] text-[var(--color-ink-secondary)]">
              {receipt.customerEmailSent && receipt.customerEmail
                ? `Confirmation email with your receipt & included services was sent to ${receipt.customerEmail}.`
                : 'Thank you for choosing Novesta. Your project onboarding starts immediately.'}
            </p>

            <div className="mt-5 space-y-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 text-[14px]">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-ink-secondary)]">Receipt</span>
                <span className="font-mono font-medium text-[var(--color-ink)]">
                  {receipt.receipt}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-ink-secondary)]">Plan</span>
                <span className="text-right font-medium text-[var(--color-ink)]">
                  {receipt.planName}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-ink-secondary)]">Amount Paid</span>
                <span className="font-medium tabular-nums text-[var(--color-ink)]">
                  {formatCurrencyValue(receipt.amountInr)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-ink-secondary)]">Payment ID</span>
                <span className="font-mono text-[13px] text-[var(--color-ink)]">
                  {receipt.paymentId}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--color-ink-secondary)]">Status</span>
                <span className="font-medium text-[var(--color-ink)]">{receipt.status}</span>
              </div>
            </div>

            {((receipt.services && receipt.services.length > 0) || plan.features.length > 0) && (
              <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                <p className="mono-eyebrow text-[var(--color-ink-secondary)]">
                  SERVICES INCLUDED
                </p>
                <ul className="mt-2.5 space-y-1.5 text-[13px] text-[var(--color-ink)]">
                  {(receipt.services && receipt.services.length > 0
                    ? receipt.services
                    : plan.features
                  ).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-success)]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={receiptWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="resend-btn-primary inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Send Confirmation on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="resend-btn-secondary inline-flex min-h-[44px] items-center justify-center rounded-full px-5 py-2.5 text-[14px] font-medium"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="mt-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="space-y-3 rounded-[var(--radius-xs)] border border-[var(--color-error)] bg-[var(--color-bg-subtle)] p-3.5 text-[13px] text-[var(--color-error)]"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
                <a
                  href={`${siteConfig.contact.whatsappUrl}?text=${encodeURIComponent(
                    `Hi Novesta, I want to purchase ${plan.name} (${formattedAmount} ${plan.billing}). Name: ${name || 'Not entered'}, Business: ${businessName || 'Not entered'}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resend-btn-secondary inline-flex min-h-[38px] items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium text-[var(--color-ink)]"
                >
                  <MessageCircle className="h-4 w-4 text-[#00a3ff]" aria-hidden="true" />
                  <span>Complete Order on WhatsApp</span>
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pay-name" className="block text-[13px] font-medium text-[var(--color-ink)]">
                  Your Full Name *
                </label>
                <input
                  id="pay-name"
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="pay-business" className="block text-[13px] font-medium text-[var(--color-ink)]">
                  Business / Shop Name
                </label>
                <input
                  id="pay-business"
                  type="text"
                  disabled={loading}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pay-phone" className="block text-[13px] font-medium text-[var(--color-ink)]">
                  Phone / WhatsApp *
                </label>
                <input
                  id="pay-phone"
                  type="tel"
                  required
                  disabled={loading}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="pay-email" className="block text-[13px] font-medium text-[var(--color-ink)]">
                  Email for Receipt *
                </label>
                <input
                  id="pay-email"
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="resend-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium disabled:opacity-60"
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                <span>{loading ? 'Opening Razorpay Checkout...' : `Pay ${formattedAmount} with Razorpay`}</span>
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-[var(--color-ink-secondary)]">
                <Lock className="h-3.5 w-3.5 text-[#00a3ff]" aria-hidden="true" />
                <span>UPI, Cards, NetBanking &amp; Wallets secured by Razorpay</span>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
