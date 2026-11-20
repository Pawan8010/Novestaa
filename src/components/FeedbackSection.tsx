import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, MessageSquareQuote, Star } from 'lucide-react';
import { RollButton } from './RollButton';

interface PublicFeedbackItem {
  id: string;
  name: string;
  business: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function FeedbackSection() {
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const [items, setItems] = useState<PublicFeedbackItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  useEffect(() => {
    let active = true;
    const loadFeedback = () => {
      fetch('/api/feedback', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load feedback'))))
        .then((data) => {
          if (active && Array.isArray(data.items)) {
            setItems(data.items);
          }
        })
        .catch(() => {
          // Leave current list if offline
        })
        .finally(() => {
          if (active) setLoadingList(false);
        });
    };

    loadFeedback();
    window.addEventListener('focus', loadFeedback);
    return () => {
      active = false;
      window.removeEventListener('focus', loadFeedback);
    };
  }, []);

  const handleRatingKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    starValue: number
  ) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      setRating(Math.min(5, starValue + 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      setRating(Math.max(1, starValue - 1));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedComment = comment.trim();

    if (trimmedName.length < 2) {
      setStatus('error');
      setFeedbackMsg('Please enter your name (at least 2 characters).');
      return;
    }
    if (trimmedComment.length < 3) {
      setStatus('error');
      setFeedbackMsg('Please share a short feedback comment (at least 3 characters).');
      return;
    }

    setSubmitting(true);
    setStatus('idle');
    setFeedbackMsg('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          business: business.trim(),
          rating,
          comment: trimmedComment,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Could not submit feedback right now.');
      }

      if (Array.isArray(payload.items)) {
        setItems(payload.items);
      } else if (payload.item) {
        setItems((prev) => [payload.item as PublicFeedbackItem, ...prev]);
      }

      setStatus('success');
      setFeedbackMsg(
        payload.message || 'Thank you! Your feedback is now published on the website.'
      );
      setName('');
      setBusiness('');
      setRating(5);
      setComment('');
    } catch (err) {
      setStatus('error');
      setFeedbackMsg(
        err instanceof Error ? err.message : 'Network error submitting feedback.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalReviews = items.length;
  const averageRating =
    totalReviews > 0
      ? (items.reduce((sum, item) => sum + item.rating, 0) / totalReviews).toFixed(1)
      : null;

  const inputClass =
    'mt-2 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-black px-4 py-2.5 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-secondary)] transition-colors hover:border-[var(--color-border-strong)] focus:border-[#00a3ff] disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <section
      id="feedback"
      aria-labelledby="feedback-heading"
      className="scroll-mt-20 border-b border-[var(--color-border)] bg-[var(--color-bg)] py-16 text-[var(--color-ink)] sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="mono-eyebrow text-[#00a3ff]">
              CLIENT FEEDBACK
            </p>
            <h2
              id="feedback-heading"
              className="heading-section resend-gradient-text mt-3"
            >
              Share your experience with Novesta.
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-6 text-[var(--color-ink-secondary)]">
            Worked with us on a website, Google Maps profile, or automation? Leave a public
            review below—it appears live on the page.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left: Obsidian Glass Public Feedback Form */}
          <div className="novesta-card p-6 sm:p-8 lg:col-span-5">
            <h3 className="text-[20px] font-medium tracking-tight text-[var(--color-text-tertiary)]">
              Post Public Feedback
            </h3>
            <p className="mt-1.5 text-[14px] text-[var(--color-ink-secondary)]">
              Your review is published live on Novesta and visible to all visitors.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-6">
              <div aria-live="polite" className="mb-4">
                {status === 'error' && feedbackMsg && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-error)] bg-[var(--color-error-bg-inverse)] p-3.5 text-[14px] text-[var(--color-error)]"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{feedbackMsg}</span>
                  </div>
                )}
                {status === 'success' && feedbackMsg && (
                  <div
                    role="status"
                    className="flex items-start gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-success)]/50 bg-[var(--color-success)]/10 p-3.5 text-[14px] text-[var(--color-text-tertiary)]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
                    <span>{feedbackMsg}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="feedback-name"
                    className="block text-[14px] font-medium text-[var(--color-ink)]"
                  >
                    Your Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    required
                    disabled={submitting}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="feedback-business"
                    className="block text-[14px] font-medium text-[var(--color-ink)]"
                  >
                    Business or Role
                  </label>
                  <input
                    id="feedback-business"
                    type="text"
                    disabled={submitting}
                    value={business}
                    onChange={(e) => setBusiness(e.target.value)}
                    placeholder="e.g., Hotel / Cafe / Clinic Owner"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-4">
                <span
                  id="feedback-rating-label"
                  className="block text-[14px] font-medium text-[var(--color-ink)]"
                >
                  Rating ({rating} / 5)
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="feedback-rating-label"
                  className="mt-2 flex flex-wrap items-center gap-1.5"
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        role="radio"
                        aria-checked={rating === star}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                        disabled={submitting}
                        onClick={() => setRating(star)}
                        onKeyDown={(e) => handleRatingKeyDown(e, star)}
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
                          active
                            ? 'border-[#00a3ff] bg-[#00a3ff] text-black'
                            : 'border-[var(--color-border)] bg-black text-[var(--color-ink-secondary)] hover:border-[#00a3ff]/70'
                        }`}
                      >
                        <Star
                          className="h-4 w-4"
                          fill={active ? 'currentColor' : 'none'}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="feedback-comment"
                  className="block text-[14px] font-medium text-[var(--color-ink)]"
                >
                  Your Feedback <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="feedback-comment"
                  rows={4}
                  required
                  disabled={submitting}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with our team..."
                  className={`${inputClass} min-h-[112px] resize-y`}
                />
              </div>

              <div className="mt-6">
                <RollButton
                  type="submit"
                  loading={submitting}
                  disabled={submitting}
                  label={submitting ? 'Publishing...' : 'Publish Feedback'}
                  variant="primary"
                  className="w-full"
                />
              </div>
            </form>
          </div>

          {/* Right: Live Published Feedback Wall */}
          <div className="flex flex-col lg:col-span-7">
            <div className="flex h-full flex-col rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
                <div className="flex items-center gap-2.5 text-[var(--color-text-tertiary)]">
                  <MessageSquareQuote className="h-5 w-5 shrink-0 text-[#00a3ff]" aria-hidden="true" />
                  <h3 className="text-[18px] font-medium text-[var(--color-text-tertiary)]">
                    Published Feedback ({totalReviews})
                  </h3>
                </div>

                {averageRating && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00a3ff]/35 bg-[#00a3ff]/10 px-3.5 py-1 text-[13px] font-medium text-[#d6ebfd] tabular-nums">
                    <Star className="h-3.5 w-3.5 fill-[#00a3ff] text-[#00a3ff]" aria-hidden="true" />
                    <span>{averageRating} / 5 average</span>
                  </div>
                )}
              </div>

              {loadingList ? (
                <div className="py-12 text-center text-[15px] text-[var(--color-ink-secondary)]">
                  Loading published reviews...
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                  <p className="text-[16px] font-medium text-[var(--color-text-tertiary)]">
                    No feedback published yet
                  </p>
                  <p className="mt-1.5 max-w-sm text-[14px] leading-6 text-[var(--color-ink-secondary)]">
                    Be the first to share your experience using the form—submitted reviews appear
                    right here immediately.
                  </p>
                </div>
              ) : (
                <div
                  aria-label="All client feedback"
                  className="mt-5 max-h-[520px] space-y-4 overflow-y-auto pr-1"
                >
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-black p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-[16px] font-medium text-[var(--color-text-tertiary)]">
                            {item.name}
                          </h4>
                          <p className="text-[13px] text-[var(--color-ink-secondary)]">
                            {item.business}
                          </p>
                        </div>

                        <div
                          className="flex items-center gap-0.5 text-[#00a3ff]"
                          aria-label={`Rated ${item.rating} out of 5 stars`}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className="h-3.5 w-3.5"
                              fill={star <= item.rating ? 'currentColor' : 'none'}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </div>

                      <p className="mt-3 text-[14px] leading-6 text-[var(--color-ink)]">
                        {item.comment}
                      </p>

                      <p className="mt-3 text-[12px] text-[var(--color-ink-tertiary)] tabular-nums">
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
