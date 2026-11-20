import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  clearFounderToken,
  getFounderHeaders,
  setFounderToken,
} from '../utils/founderAuth';

interface FounderPortalProps {
  onBackHome: () => void;
  onOpenCareers: () => void;
}

interface AdminRole {
  id: string;
  code: string;
  title: string;
  team: string;
  location: string;
  status: string;
}

interface AdminApplication {
  id: string;
  role: string;
  fullName: string;
  email: string;
  answer1: string;
  answer2: string;
  answer3: string;
  status: string;
  submittedAt: string;
}

interface AdminContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessType: string;
  plan: string;
  message: string;
  status: string;
  submittedAt: string;
}

interface AdminPayment {
  id: string;
  orderId: string;
  paymentId?: string;
  planName: string;
  amountInr: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  businessName: string;
  status: string;
  webhookVerified?: boolean;
  webhookEvent?: string;
  customerEmailSent?: boolean;
  adminEmailSent?: boolean;
  createdAt: string;
}

interface RazorpaySetupInfo {
  keyConfigured: boolean;
  webhookSecretConfigured: boolean;
  webhookUrl: string;
  recommendedEvents: string[];
}

interface EmailSetupInfo {
  transport?: 'smtp' | 'resend' | 'none';
  smtpConfigured?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  resendKeyConfigured: boolean;
  fromAddress: string;
  toAddress: string;
  backupEmail: string;
  customDomainConfigured: boolean;
}

interface ProductionReadinessInfo {
  nodeEnv: string;
  appUrl: string;
  appUrlIsHttps: boolean;
  smtpConfigured: boolean;
  resendConfigured: boolean;
  emailTransport: 'smtp' | 'resend' | 'none';
  razorpayMode: 'live' | 'test' | 'unconfigured';
  razorpayWebhookSecretConfigured: boolean;
  founderPasskeyConfigured: boolean;
  sessionSecretExplicit: boolean;
  mapsKeyConfigured: boolean;
  distBuilt: boolean;
  readyForLiveTraffic: boolean;
}

interface AdminFeedback {
  id: string;
  name: string;
  business: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const PRODUCTION_ENV_TEMPLATE = `NODE_ENV="production"
PORT="3000"
APP_URL="https://novesta.online"

SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="hello@novesta.online"
SMTP_PASS="YOUR_MAILBOX_PASSWORD"
SMTP_FROM="Novesta <hello@novesta.online>"
CONTACT_TO_EMAIL="hello@novesta.online"
FOUNDER_BACKUP_EMAIL="rajputpawan9765@gmail.com"

RAZORPAY_KEY_ID="rzp_live_XXXXXXXX"
RAZORPAY_KEY_SECRET="YOUR_RAZORPAY_LIVE_SECRET"
RAZORPAY_WEBHOOK_SECRET="YOUR_RAZORPAY_WEBHOOK_SECRET"

FOUNDER_ADMIN_KEY="YOUR_STRONG_FOUNDER_PASSKEY"
FOUNDER_EMAILS="rajputpawan9765@gmail.com,hello@novesta.online,novesta111@gmail.com"
SESSION_SECRET="64_CHAR_RANDOM_HEX_STRING"

UPSTASH_REDIS_REST_URL="OPTIONAL_FREE_UPSTASH_URL"
UPSTASH_REDIS_REST_TOKEN="OPTIONAL_FREE_UPSTASH_TOKEN"

VITE_GOOGLE_MAPS_API_KEY="YOUR_MAPS_KEY"`;

const ROLE_STATUS_OPTIONS = ['Accepting applications', 'Urgent hiring', 'Paused'];

export function FounderPortal({ onBackHome, onOpenCareers }: FounderPortalProps) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [founderEmail, setFounderEmail] = useState('');
  const [emailOtpEnabled, setEmailOtpEnabled] = useState(true);
  const [passkeyEnabled, setPasskeyEnabled] = useState(true);

  // Login form state
  const [authMethod, setAuthMethod] = useState<'otp' | 'passkey'>('passkey');
  const [loginEmail, setLoginEmail] = useState('rajputpawan9765@gmail.com');
  const [otpRequested, setOtpRequested] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [passkey, setPasskey] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');

  // Admin workspace data
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([]);
  const [razorpaySetup, setRazorpaySetup] = useState<RazorpaySetupInfo | null>(null);
  const [emailSetup, setEmailSetup] = useState<EmailSetupInfo | null>(null);
  const [readiness, setReadiness] = useState<ProductionReadinessInfo | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [verifyingSmtp, setVerifyingSmtp] = useState(false);
  const [copiedEnvTemplate, setCopiedEnvTemplate] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [actionBanner, setActionBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Add role form state
  const [newTitle, setNewTitle] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newLocation, setNewLocation] = useState('Jalgaon / Remote');
  const [newStatus, setNewStatus] = useState('Accepting applications');
  const [savingNewRole, setSavingNewRole] = useState(false);

  // Inline edit role state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState('Accepting applications');
  const [savingEdit, setSavingEdit] = useState(false);

  // Inline edit feedback state
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editFbName, setEditFbName] = useState('');
  const [editFbBusiness, setEditFbBusiness] = useState('');
  const [editFbRating, setEditFbRating] = useState(5);
  const [editFbComment, setEditFbComment] = useState('');
  const [savingFeedbackEdit, setSavingFeedbackEdit] = useState(false);

  // Submissions tab
  const [activeInboxTab, setActiveInboxTab] = useState<
    'applications' | 'contacts' | 'payments' | 'feedback' | 'email'
  >('applications');

  const fetchAdminData = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/submissions', {
        credentials: 'same-origin',
        headers: getFounderHeaders(),
      });
      if (res.status === 401) {
        clearFounderToken();
        setAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setRoles(Array.isArray(data.roles) ? data.roles : []);
        setApplications(Array.isArray(data.applications) ? data.applications : []);
        setContacts(Array.isArray(data.contacts) ? data.contacts : []);
        setPayments(Array.isArray(data.payments) ? data.payments : []);
        setFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
        setRazorpaySetup(data.razorpaySetup || null);
        setEmailSetup(data.emailSetup || null);
        setReadiness(data.productionReadiness || null);
      }
    } catch {
      setActionBanner({ type: 'error', text: 'Could not refresh founder data.' });
    } finally {
      setLoadingData(false);
    }
  }, []);

  const checkSession = useCallback(async () => {
    setCheckingSession(true);
    try {
      const res = await fetch('/api/admin/session', {
        credentials: 'same-origin',
        headers: getFounderHeaders(),
      });
      const data = await res.json();
      setAuthenticated(Boolean(data.authenticated));
      setFounderEmail(data.email || '');
      setEmailOtpEnabled(Boolean(data.emailOtpEnabled));
      setPasskeyEnabled(Boolean(data.passkeyEnabled));
      if (!data.passkeyEnabled && data.emailOtpEnabled) {
        setAuthMethod('otp');
      }
      if (data.authenticated) {
        await fetchAdminData();
      }
    } catch {
      setAuthenticated(false);
    } finally {
      setCheckingSession(false);
    }
  }, [fetchAdminData]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not send verification code.');
      }
      setOtpRequested(true);
      setAuthNotice(data.message || 'Verification code sent to your founder email.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to request code.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: loginEmail.trim(), code: otpCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.');
      }
      if (data.token) {
        setFounderToken(data.token);
      }
      setAuthenticated(true);
      setFounderEmail(data.email || loginEmail.trim());
      setOtpCode('');
      await fetchAdminData();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasskeyLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/login-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ passkey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Passkey verification failed.');
      }
      if (data.token) {
        setFounderToken(data.token);
      }
      setAuthenticated(true);
      setFounderEmail(data.email || '');
      setPasskey('');
      await fetchAdminData();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid founder passkey.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: getFounderHeaders(),
    });
    clearFounderToken();
    setAuthenticated(false);
    setFounderEmail('');
    setRoles([]);
    setApplications([]);
    setContacts([]);
    setPayments([]);
    setRazorpaySetup(null);
  };

  const handleAddRole = async (event: React.FormEvent) => {
    event.preventDefault();
    setActionBanner(null);
    setSavingNewRole(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: getFounderHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'same-origin',
        body: JSON.stringify({
          title: newTitle.trim(),
          team: newTeam.trim(),
          location: newLocation.trim(),
          status: newStatus,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not add role.');
      }
      setRoles(Array.isArray(data.roles) ? data.roles : []);
      setNewTitle('');
      setNewTeam('');
      setNewLocation('Jalgaon / Remote');
      setNewStatus('Accepting applications');
      setActionBanner({ type: 'success', text: `Added "${data.role?.title}" to live Careers page.` });
    } catch (err) {
      setActionBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to create role.',
      });
    } finally {
      setSavingNewRole(false);
    }
  };

  const startEdit = (role: AdminRole) => {
    setEditingId(role.id);
    setEditCode(role.code);
    setEditTitle(role.title);
    setEditTeam(role.team);
    setEditLocation(role.location);
    setEditStatus(role.status || 'Accepting applications');
    setActionBanner(null);
  };

  const handleSaveEdit = async (roleId: string) => {
    setSavingEdit(true);
    setActionBanner(null);
    try {
      const res = await fetch(`/api/admin/roles/${encodeURIComponent(roleId)}`, {
        method: 'PUT',
        headers: getFounderHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'same-origin',
        body: JSON.stringify({
          code: editCode.trim(),
          title: editTitle.trim(),
          team: editTeam.trim(),
          location: editLocation.trim(),
          status: editStatus,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not save role updates.');
      }
      setRoles(Array.isArray(data.roles) ? data.roles : []);
      setEditingId(null);
      setActionBanner({ type: 'success', text: `Updated "${data.role?.title}" live.` });
    } catch (err) {
      setActionBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update role.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteRole = async (role: AdminRole) => {
    setActionBanner(null);
    try {
      const res = await fetch(`/api/admin/roles/${encodeURIComponent(role.id)}`, {
        method: 'DELETE',
        headers: getFounderHeaders(),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not remove role.');
      }
      setRoles(Array.isArray(data.roles) ? data.roles : []);
      if (editingId === role.id) setEditingId(null);
      setActionBanner({ type: 'success', text: `Removed "${role.title}" from Careers page.` });
    } catch (err) {
      setActionBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete role.',
      });
    }
  };

  const handleResetRoles = async () => {
    setActionBanner(null);
    try {
      const res = await fetch('/api/admin/roles/reset', {
        method: 'POST',
        headers: getFounderHeaders(),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not reset roles.');
      }
      setRoles(Array.isArray(data.roles) ? data.roles : []);
      setEditingId(null);
      setActionBanner({ type: 'success', text: 'Restored default career roles.' });
    } catch (err) {
      setActionBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to reset roles.',
      });
    }
  };

  const handleDeleteApplication = async (app: AdminApplication) => {
    setActionBanner(null);
    try {
      const res = await fetch(`/api/admin/applications/${encodeURIComponent(app.id)}`, {
        method: 'DELETE',
        headers: getFounderHeaders(),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not delete application.');
      }
      setApplications(Array.isArray(data.applications) ? data.applications : []);
      setActionBanner({ type: 'success', text: `Deleted application ${app.id}.` });
    } catch (err) {
      setActionBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete application.',
      });
    }
  };

  const handleDeleteContact = async (lead: AdminContact) => {
    setActionBanner(null);
    try {
      const res = await fetch(`/api/admin/contacts/${encodeURIComponent(lead.id)}`, {
        method: 'DELETE',
        headers: getFounderHeaders(),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not delete consultation lead.');
      }
      setContacts(Array.isArray(data.contacts) ? data.contacts : []);
      setActionBanner({ type: 'success', text: `Deleted lead ${lead.id}.` });
    } catch (err) {
      setActionBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete lead.',
      });
    }
  };

  const startEditFeedback = (fb: AdminFeedback) => {
    setEditingFeedbackId(fb.id);
    setEditFbName(fb.name);
    setEditFbBusiness(fb.business);
    setEditFbRating(fb.rating);
    setEditFbComment(fb.comment);
    setActionBanner(null);
  };

  const handleSaveFeedbackEdit = async (feedbackId: string) => {
    setSavingFeedbackEdit(true);
    setActionBanner(null);
    try {
      const res = await fetch(`/api/admin/feedback/${encodeURIComponent(feedbackId)}`, {
        method: 'PUT',
        headers: getFounderHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'same-origin',
        body: JSON.stringify({
          name: editFbName.trim(),
          business: editFbBusiness.trim(),
          rating: editFbRating,
          comment: editFbComment.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not update feedback.');
      }
      setFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
      setEditingFeedbackId(null);
      setActionBanner({ type: 'success', text: 'Updated public feedback live.' });
    } catch (err) {
      setActionBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update feedback.',
      });
    } finally {
      setSavingFeedbackEdit(false);
    }
  };

  const handleDeleteFeedback = async (item: AdminFeedback) => {
    setActionBanner(null);
    try {
      const res = await fetch(`/api/admin/feedback/${encodeURIComponent(item.id)}`, {
        method: 'DELETE',
        headers: getFounderHeaders(),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not delete feedback.');
      }
      setFeedbacks(Array.isArray(data.feedbacks) ? data.feedbacks : []);
      if (editingFeedbackId === item.id) setEditingFeedbackId(null);
      setActionBanner({ type: 'success', text: `Deleted feedback from ${item.name}.` });
    } catch (err) {
      setActionBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete feedback.',
      });
    }
  };

  const handleDeletePayment = async (pay: AdminPayment) => {
    setActionBanner(null);
    try {
      const res = await fetch(`/api/admin/payments/${encodeURIComponent(pay.id)}`, {
        method: 'DELETE',
        headers: getFounderHeaders(),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not delete payment record.');
      }
      setPayments(Array.isArray(data.payments) ? data.payments : []);
      setActionBanner({ type: 'success', text: `Deleted payment record ${pay.id}.` });
    } catch (err) {
      setActionBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete payment record.',
      });
    }
  };

  const handleVerifySmtp = async () => {
    setTestEmailResult(null);
    setVerifyingSmtp(true);
    try {
      const res = await fetch('/api/admin/verify-smtp', {
        method: 'POST',
        headers: getFounderHeaders(),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not verify SMTP handshake.');
      }
      setTestEmailResult({
        type: 'success',
        text: data.message || 'SMTP connection verified.',
      });
    } catch (err) {
      setTestEmailResult({
        type: 'error',
        text: err instanceof Error ? err.message : 'SMTP verification failed.',
      });
    } finally {
      setVerifyingSmtp(false);
    }
  };

  const handleSendTestEmail = async () => {
    setTestEmailResult(null);
    setSendingTestEmail(true);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: getFounderHeaders(),
        credentials: 'same-origin',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not send test email.');
      }
      setTestEmailResult({
        type: 'success',
        text: data.message || 'Test email sent successfully.',
      });
    } catch (err) {
      setTestEmailResult({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send test email.',
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const inputClass =
    'mt-1.5 block w-full min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-black px-3.5 py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-secondary)] focus:border-[#00a3ff]';

  return (
    <section
      aria-labelledby="founder-portal-heading"
      className="resend-spotlight-subtle bg-[var(--color-bg)] py-14 text-[var(--color-ink)] sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="resend-btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={onOpenCareers}
              className="resend-btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium"
            >
              <span>View Public Careers Page</span>
            </button>
          </div>

          {authenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="resend-btn-secondary inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        <div className="mt-8 border-b border-[var(--color-border)] pb-6">
          <p className="mono-eyebrow text-[#00a3ff]">
            FOUNDER ONLY · PRIVATE WORKSPACE
          </p>
          <h1 id="founder-portal-heading" className="heading-section resend-gradient-text mt-2">
            Careers &amp; Leads Manager
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] text-[var(--color-ink-secondary)]">
            Restricted strictly to the Novesta founder. Add, edit, or delete open roles and manage
            submitted applications, consultation leads, and payments.
          </p>
        </div>

        {checkingSession ? (
          <div className="py-16 text-[15px] text-[var(--color-ink-secondary)]">
            Verifying founder session...
          </div>
        ) : !authenticated ? (
          <div className="mx-auto mt-10 max-w-md rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-6 sm:p-8">
            <div className="flex items-center gap-2.5 text-[var(--color-ink)]">
              <Lock className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-[20px] font-medium">Founder Sign In</h2>
            </div>
            <p className="mt-2 text-[14px] text-[var(--color-ink-secondary)]">
              Only the verified Novesta founder account can manage career listings and submissions.
            </p>

            <div className="mt-5 flex gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-black p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('passkey');
                  setAuthError('');
                  setAuthNotice('');
                }}
                className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] font-medium transition-colors ${
                  authMethod === 'passkey'
                    ? 'bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-ink)]'
                    : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-text-tertiary)]'
                }`}
              >
                Passkey
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('otp');
                  setAuthError('');
                  setAuthNotice('');
                }}
                className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-[13px] font-medium transition-colors ${
                  authMethod === 'otp'
                    ? 'bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-ink)]'
                    : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-text-tertiary)]'
                }`}
              >
                Email Code
              </button>
            </div>

            {authError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-[var(--radius-xs)] border border-[var(--color-error)] bg-[var(--color-bg)] p-3 text-[13px] text-[var(--color-error)]"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{authError}</span>
              </div>
            )}

            {authNotice && (
              <div
                role="status"
                className="mt-4 flex items-start gap-2 rounded-[var(--radius-xs)] border border-[var(--color-ink)] bg-[var(--color-bg)] p-3 text-[13px] text-[var(--color-ink)]"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{authNotice}</span>
              </div>
            )}

            {authMethod === 'otp' ? (
              !otpRequested ? (
                <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="founder-email" className="block text-[13px] font-medium">
                      Founder Email
                    </label>
                    <input
                      id="founder-email"
                      type="email"
                      required
                      disabled={authLoading}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="rajputpawan9765@gmail.com"
                      className={inputClass}
                    />
                    {!emailOtpEnabled && (
                      <p className="mt-2 text-[12px] text-[var(--color-ink-secondary)]">
                        Configure Hostinger SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS) in your server environment to receive 6-digit email codes.
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="resend-btn-primary inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium disabled:opacity-60"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <span>{authLoading ? 'Sending Code...' : 'Send 6-Digit Verification Code'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="founder-otp" className="block text-[13px] font-medium">
                      6-Digit Code sent to {loginEmail}
                    </label>
                    <input
                      id="founder-otp"
                      type="text"
                      inputMode="numeric"
                      required
                      disabled={authLoading}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="resend-btn-primary inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium disabled:opacity-60"
                  >
                    <span>{authLoading ? 'Verifying...' : 'Verify & Unlock Workspace'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpRequested(false);
                      setOtpCode('');
                      setAuthNotice('');
                    }}
                    className="w-full text-center text-[13px] text-[var(--color-ink-secondary)] underline"
                  >
                    Use a different founder email
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handlePasskeyLogin} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="founder-passkey" className="block text-[13px] font-medium">
                    Founder Admin Passkey
                  </label>
                  <input
                    id="founder-passkey"
                    type="password"
                    required
                    disabled={authLoading}
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Enter your founder passkey"
                    className={inputClass}
                  />
                  {!passkeyEnabled && (
                    <p className="mt-2 text-[12px] text-[var(--color-ink-secondary)]">
                      Set FOUNDER_ADMIN_KEY in your server environment variables, or switch to Email Code above.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="resend-btn-primary inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-medium disabled:opacity-60"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  <span>{authLoading ? 'Signing in...' : 'Unlock with Passkey'}</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px] text-[var(--color-ink-secondary)]">
                Signed in as <span className="font-medium text-[var(--color-ink)]">{founderEmail}</span>
              </p>
              <button
                type="button"
                onClick={fetchAdminData}
                disabled={loadingData}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-1.5 text-[13px] font-medium text-[var(--color-ink)] hover:border-[var(--color-ink)]"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>Refresh</span>
              </button>
            </div>

            {actionBanner && (
              <div
                role={actionBanner.type === 'error' ? 'alert' : 'status'}
                className={`flex items-start gap-2.5 rounded-[var(--radius-xs)] border p-3.5 text-[14px] ${
                  actionBanner.type === 'error'
                    ? 'border-[var(--color-error)] text-[var(--color-error)]'
                    : 'border-[var(--color-ink)] bg-[var(--color-bg-subtle)] text-[var(--color-ink)]'
                }`}
              >
                {actionBanner.type === 'error' ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                )}
                <span>{actionBanner.text}</span>
              </div>
            )}

            {/* 1. Add New Role Listing */}
            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-6 sm:p-8">
              <h2 className="text-[20px] font-medium text-[var(--color-ink)]">
                Add New Open Role
              </h2>
              <p className="mt-1 text-[14px] text-[var(--color-ink-secondary)]">
                New listings publish directly to the public Careers page.
              </p>

              <form onSubmit={handleAddRole} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="new-role-title" className="block text-[13px] font-medium">
                    Role Title *
                  </label>
                  <input
                    id="new-role-title"
                    type="text"
                    required
                    disabled={savingNewRole}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Next.js Frontend Engineer"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="new-role-team" className="block text-[13px] font-medium">
                    Team / Department *
                  </label>
                  <input
                    id="new-role-team"
                    type="text"
                    required
                    disabled={savingNewRole}
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    placeholder="e.g., Engineering"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="new-role-location" className="block text-[13px] font-medium">
                    Location *
                  </label>
                  <input
                    id="new-role-location"
                    type="text"
                    required
                    disabled={savingNewRole}
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Jalgaon / Remote"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="new-role-status" className="block text-[13px] font-medium">
                    Hiring Status
                  </label>
                  <select
                    id="new-role-status"
                    disabled={savingNewRole}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className={inputClass}
                  >
                    {ROLE_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <button
                    type="submit"
                    disabled={savingNewRole}
                    className="resend-btn-primary inline-flex min-h-[44px] items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-medium disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    <span>{savingNewRole ? 'Adding Role...' : 'Publish Role to Careers Page'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Manage Existing Role Listings */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[22px] font-medium text-[var(--color-ink)]">
                  Published Role Listings ({roles.length})
                </h2>
                <button
                  type="button"
                  onClick={handleResetRoles}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-1.5 text-[13px] font-medium text-[var(--color-ink-secondary)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                >
                  Restore Default Roles
                </button>
              </div>

              <div className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                {roles.map((role) => {
                  const isEditing = editingId === role.id;
                  return (
                    <div key={role.id} className="py-5">
                      {isEditing ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                          <div>
                            <label className="block text-[12px] font-medium text-[var(--color-ink-secondary)]">
                              Code
                            </label>
                            <input
                              type="text"
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-medium text-[var(--color-ink-secondary)]">
                              Title
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-medium text-[var(--color-ink-secondary)]">
                              Team
                            </label>
                            <input
                              type="text"
                              value={editTeam}
                              onChange={(e) => setEditTeam(e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-medium text-[var(--color-ink-secondary)]">
                              Location
                            </label>
                            <input
                              type="text"
                              value={editLocation}
                              onChange={(e) => setEditLocation(e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-[12px] font-medium text-[var(--color-ink-secondary)]">
                              Status
                            </label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className={inputClass}
                            >
                              {ROLE_STATUS_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5">
                            <button
                              type="button"
                              disabled={savingEdit}
                              onClick={() => handleSaveEdit(role.id)}
                              className="resend-btn-primary inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-5 py-2 text-[13px] font-medium"
                            >
                              <Save className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-2 text-[13px] font-medium text-[var(--color-ink)]"
                            >
                              <X className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div>
                            <div className="flex flex-wrap items-center gap-x-2.5 text-[13px] text-[var(--color-ink-secondary)]">
                              <span className="font-mono font-medium text-[var(--color-ink)]">
                                {role.code}
                              </span>
                              <span>·</span>
                              <span>{role.team}</span>
                              <span>·</span>
                              <span>{role.location}</span>
                              <span>·</span>
                              <span className="font-medium text-[var(--color-ink)]">{role.status}</span>
                            </div>
                            <h3 className="mt-1 text-[18px] font-medium text-[var(--color-ink)]">
                              {role.title}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(role)}
                              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-1.5 text-[13px] font-medium text-[var(--color-ink)] hover:border-[var(--color-ink)]"
                            >
                              <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRole(role)}
                              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--color-border)] px-4 py-1.5 text-[13px] font-medium text-[var(--color-error)] hover:border-[var(--color-error)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Live Applications, Consultation Leads & Razorpay Payments */}
            <div>
              <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--color-border)] pb-4">
                <button
                  type="button"
                  onClick={() => setActiveInboxTab('applications')}
                  className={`min-h-[40px] rounded-full px-5 py-2 text-[14px] font-medium transition-colors ${
                    activeInboxTab === 'applications'
                      ? 'resend-btn-primary'
                      : 'resend-btn-secondary'
                  }`}
                >
                  Career Applications ({applications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInboxTab('contacts')}
                  className={`min-h-[40px] rounded-full px-5 py-2 text-[14px] font-medium transition-colors ${
                    activeInboxTab === 'contacts'
                      ? 'resend-btn-primary'
                      : 'resend-btn-secondary'
                  }`}
                >
                  Consultation Leads ({contacts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInboxTab('payments')}
                  className={`min-h-[40px] rounded-full px-5 py-2 text-[14px] font-medium transition-colors ${
                    activeInboxTab === 'payments'
                      ? 'resend-btn-primary'
                      : 'resend-btn-secondary'
                  }`}
                >
                  Payments &amp; Webhook ({payments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInboxTab('feedback')}
                  className={`min-h-[40px] rounded-full px-5 py-2 text-[14px] font-medium transition-colors ${
                    activeInboxTab === 'feedback'
                      ? 'resend-btn-primary'
                      : 'resend-btn-secondary'
                  }`}
                >
                  Public Feedback ({feedbacks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveInboxTab('email')}
                  className={`min-h-[40px] rounded-full px-5 py-2 text-[14px] font-medium transition-colors ${
                    activeInboxTab === 'email'
                      ? 'resend-btn-primary'
                      : 'resend-btn-secondary'
                  }`}
                >
                  Email &amp; Domain
                </button>
              </div>

              {activeInboxTab === 'applications' ? (
                applications.length === 0 ? (
                  <p className="py-8 text-[15px] text-[var(--color-ink-secondary)]">
                    No career applications submitted yet.
                  </p>
                ) : (
                  <div className="mt-6 space-y-4">
                    {applications.map((app) => (
                      <article
                        key={app.id}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="text-[17px] font-medium text-[var(--color-ink)]">
                              {app.fullName} · {app.role}
                            </h3>
                            <p className="text-[13px] text-[var(--color-ink-secondary)]">
                              {app.email} · Ref: {app.id}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[12px] text-[var(--color-ink-secondary)] tabular-nums">
                              {new Date(app.submittedAt).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteApplication(app)}
                              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-1 text-[12px] font-medium text-[var(--color-error)] hover:border-[var(--color-error)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2 border-t border-[var(--color-border)] pt-3 text-[14px] text-[var(--color-ink)]">
                          <p>
                            <span className="font-medium text-[var(--color-ink-secondary)]">01: </span>
                            {app.answer1}
                          </p>
                          <p>
                            <span className="font-medium text-[var(--color-ink-secondary)]">02: </span>
                            {app.answer2}
                          </p>
                          <p>
                            <span className="font-medium text-[var(--color-ink-secondary)]">03: </span>
                            {app.answer3}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                )
              ) : activeInboxTab === 'contacts' ? (
                contacts.length === 0 ? (
                  <p className="py-8 text-[15px] text-[var(--color-ink-secondary)]">
                    No consultation requests submitted yet.
                  </p>
                ) : (
                  <div className="mt-6 space-y-4">
                    {contacts.map((lead) => (
                      <article
                        key={lead.id}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="text-[17px] font-medium text-[var(--color-ink)]">
                              {lead.name} · {lead.businessType}
                            </h3>
                            <p className="text-[13px] text-[var(--color-ink-secondary)]">
                              {lead.phone} · {lead.email} · Plan: {lead.plan} · Ref: {lead.id}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[12px] text-[var(--color-ink-secondary)] tabular-nums">
                              {new Date(lead.submittedAt).toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteContact(lead)}
                              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-1 text-[12px] font-medium text-[var(--color-error)] hover:border-[var(--color-error)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-[14px] text-[var(--color-ink)]">
                          {lead.message}
                        </p>
                      </article>
                    ))}
                  </div>
                )
              ) : activeInboxTab === 'payments' ? (
                <div className="mt-6 space-y-6">
                  {razorpaySetup && (
                    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-5">
                      <h3 className="text-[16px] font-medium text-[var(--color-ink)]">
                        Razorpay Webhook Setup
                      </h3>
                      <p className="mt-1 text-[13px] text-[var(--color-ink-secondary)]">
                        Paste this HTTPS endpoint into Razorpay Dashboard → Settings → Webhooks:
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <code className="flex-1 overflow-x-auto rounded-[8px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-ink)]">
                          {razorpaySetup.webhookUrl}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(razorpaySetup.webhookUrl);
                            setCopiedWebhook(true);
                            setTimeout(() => setCopiedWebhook(false), 2000);
                          }}
                          className="inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[13px] font-medium text-[var(--color-ink)] hover:border-[var(--color-ink)]"
                        >
                          {copiedWebhook ? (
                            <>
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-3 text-[13px] text-[var(--color-ink-secondary)]">
                        Active Events: {razorpaySetup.recommendedEvents.join(', ')} · Secret check:{' '}
                        <span className="font-medium text-[var(--color-ink)]">
                          {razorpaySetup.webhookSecretConfigured ? 'Configured on server' : 'Not set'}
                        </span>
                      </p>
                    </div>
                  )}

                  {payments.length === 0 ? (
                    <p className="py-4 text-[15px] text-[var(--color-ink-secondary)]">
                      No Razorpay orders or payments recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((pay) => (
                        <article
                          key={pay.id}
                          className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h3 className="text-[17px] font-medium text-[var(--color-ink)]">
                                {pay.customerName} · ₹{pay.amountInr.toLocaleString('en-IN')} ·{' '}
                                {pay.planName}
                              </h3>
                              <p className="text-[13px] text-[var(--color-ink-secondary)]">
                                {pay.businessName} · {pay.customerPhone} · {pay.customerEmail}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[13px] font-medium text-[var(--color-ink)]">
                                {pay.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(pay)}
                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-1 text-[12px] font-medium text-[var(--color-error)] hover:border-[var(--color-error)]"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 font-mono text-[12px] text-[var(--color-ink-secondary)]">
                            Receipt: {pay.id} · Order: {pay.orderId}
                            {pay.paymentId ? ` · Payment: ${pay.paymentId}` : ''}
                            {pay.webhookEvent ? ` · Webhook: ${pay.webhookEvent}` : ''}
                            {typeof pay.customerEmailSent === 'boolean'
                              ? ` · Customer mail: ${pay.customerEmailSent ? 'Sent' : 'Pending'}`
                              : ''}
                          </p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeInboxTab === 'feedback' ? (
                feedbacks.length === 0 ? (
                  <p className="py-8 text-[15px] text-[var(--color-ink-secondary)]">
                    No public feedback published yet.
                  </p>
                ) : (
                  <div className="mt-6 space-y-4">
                    {feedbacks.map((fb) => (
                      <article
                        key={fb.id}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-5"
                      >
                        {editingFeedbackId === fb.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <div>
                                <label className="block text-[12px] text-[var(--color-ink-secondary)]">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={editFbName}
                                  onChange={(e) => setEditFbName(e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className="block text-[12px] text-[var(--color-ink-secondary)]">
                                  Business / Role
                                </label>
                                <input
                                  type="text"
                                  value={editFbBusiness}
                                  onChange={(e) => setEditFbBusiness(e.target.value)}
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className="block text-[12px] text-[var(--color-ink-secondary)]">
                                  Rating (1–5)
                                </label>
                                <select
                                  value={editFbRating}
                                  onChange={(e) => setEditFbRating(Number(e.target.value))}
                                  className={inputClass}
                                >
                                  {[5, 4, 3, 2, 1].map((r) => (
                                    <option key={r} value={r}>
                                      {r} / 5 ★
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[12px] text-[var(--color-ink-secondary)]">
                                Feedback Comment
                              </label>
                              <textarea
                                rows={3}
                                value={editFbComment}
                                onChange={(e) => setEditFbComment(e.target.value)}
                                className={`${inputClass} min-h-[84px] resize-y`}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={savingFeedbackEdit}
                                onClick={() => handleSaveFeedbackEdit(fb.id)}
                                className="resend-btn-primary inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium disabled:opacity-60"
                              >
                                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{savingFeedbackEdit ? 'Saving...' : 'Save Changes'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={savingFeedbackEdit}
                                onClick={() => setEditingFeedbackId(null)}
                                className="resend-btn-secondary inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <h3 className="text-[17px] font-medium text-[var(--color-ink)]">
                                  {fb.name} · {fb.rating}/5 ★
                                </h3>
                                <p className="text-[13px] text-[var(--color-ink-secondary)]">
                                  {fb.business} · Ref: {fb.id}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="text-[12px] text-[var(--color-ink-secondary)] tabular-nums">
                                  {new Date(fb.createdAt).toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => startEditFeedback(fb)}
                                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-1 text-[12px] font-medium text-[var(--color-ink)] hover:border-[var(--color-ink)]"
                                >
                                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFeedback(fb)}
                                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-1 text-[12px] font-medium text-[var(--color-error)] hover:border-[var(--color-error)]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                            <p className="mt-3 border-t border-[var(--color-border)] pt-3 text-[14px] text-[var(--color-ink)]">
                              {fb.comment}
                            </p>
                          </>
                        )}
                      </article>
                    ))}
                  </div>
                )
              ) : (
                <div className="mt-6 space-y-5">
                  {/* Live Production Credentials & Hostinger Readiness Audit (read-only server checks) */}
                  {readiness && (
                    <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-[18px] font-medium text-[var(--color-ink)]">
                            Production Readiness Audit (novesta.online)
                          </h3>
                          <p className="mt-1 text-[14px] text-[var(--color-ink-secondary)]">
                            Live server-side check of required Hostinger, SMTP, Razorpay, and security variables.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(PRODUCTION_ENV_TEMPLATE);
                            setCopiedEnvTemplate(true);
                            setTimeout(() => setCopiedEnvTemplate(false), 2200);
                          }}
                          className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[13px] font-medium text-[var(--color-ink)] hover:border-[var(--color-ink)]"
                        >
                          {copiedEnvTemplate ? (
                            <>
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Copied .env Template</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Copy Production .env Template</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                          {
                            label: 'Hostinger SMTP (hello@novesta.online)',
                            ok: readiness.smtpConfigured,
                            statusText: readiness.smtpConfigured ? 'Configured' : 'Action needed',
                            detail: readiness.smtpConfigured
                              ? 'Direct SMTP active'
                              : 'Set SMTP_HOST, SMTP_USER, SMTP_PASS',
                          },
                          {
                            label: 'Razorpay Checkout Mode',
                            ok: readiness.razorpayMode === 'live',
                            statusText:
                              readiness.razorpayMode === 'live'
                                ? 'Live (rzp_live_)'
                                : readiness.razorpayMode === 'test'
                                  ? 'Test Mode'
                                  : 'Not set',
                            detail:
                              readiness.razorpayMode === 'live'
                                ? 'Live payments ready'
                                : 'Add Live Key ID & Secret in .env',
                          },
                          {
                            label: 'Razorpay Webhook Secret',
                            ok: readiness.razorpayWebhookSecretConfigured,
                            statusText: readiness.razorpayWebhookSecretConfigured
                              ? 'Configured'
                              : 'Action needed',
                            detail: readiness.razorpayWebhookSecretConfigured
                              ? 'HMAC signature enforced'
                              : 'Set RAZORPAY_WEBHOOK_SECRET',
                          },
                          {
                            label: 'Founder Passkey & Session Secret',
                            ok: readiness.founderPasskeyConfigured && readiness.sessionSecretExplicit,
                            statusText:
                              readiness.founderPasskeyConfigured && readiness.sessionSecretExplicit
                                ? 'Hardened'
                                : 'Partial',
                            detail: readiness.sessionSecretExplicit
                              ? 'Explicit 32+ char SESSION_SECRET set'
                              : 'Add FOUNDER_ADMIN_KEY & SESSION_SECRET',
                          },
                          {
                            label: 'HTTPS Domain & Build',
                            ok: readiness.appUrlIsHttps && readiness.distBuilt,
                            statusText:
                              readiness.appUrlIsHttps && readiness.distBuilt
                                ? 'Ready'
                                : readiness.appUrlIsHttps
                                  ? 'Build dist/'
                                  : 'Dev mode',
                            detail: `${readiness.appUrl} · ${readiness.nodeEnv}`,
                          },
                          {
                            label: 'Google Maps Embed Key',
                            ok: readiness.mapsKeyConfigured,
                            statusText: readiness.mapsKeyConfigured ? 'Configured' : 'Optional',
                            detail: readiness.mapsKeyConfigured
                              ? 'VITE_GOOGLE_MAPS_API_KEY set'
                              : 'Fallback map link active',
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[12px] font-medium text-[var(--color-ink-secondary)]">
                                {item.label}
                              </p>
                              <span
                                className={`text-[12px] font-medium whitespace-nowrap ${
                                  item.ok
                                    ? 'text-[var(--color-success)]'
                                    : 'text-[var(--color-error)]'
                                }`}
                              >
                                {item.statusText}
                              </span>
                            </div>
                            <p className="mt-1.5 break-all font-mono text-[12px] text-[var(--color-ink)]">
                              {item.detail}
                            </p>
                          </div>
                        ))}
                      </div>

                      <p className="mt-4 text-[13px] text-[var(--color-ink-secondary)]">
                        On your Hostinger server terminal, run{' '}
                        <code className="font-mono text-[var(--color-ink)]">npm run build && npm run check:prod</code>{' '}
                        before starting{' '}
                        <code className="font-mono text-[var(--color-ink)]">pm2 start npm --name novesta -- start</code>.
                      </p>
                    </div>
                  )}

                  <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[18px] font-medium text-[var(--color-ink)]">
                          Hostinger SMTP &amp; novesta.online Mail Diagnostics
                        </h3>
                        <p className="mt-1 text-[14px] text-[var(--color-ink-secondary)]">
                          Live server email transport check, TLS handshake test, and sandbox fallback status.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          disabled={verifyingSmtp}
                          onClick={handleVerifySmtp}
                          className="resend-btn-secondary inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-medium disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4 text-[#00a3ff]" aria-hidden="true" />
                          <span>{verifyingSmtp ? 'Verifying...' : 'Verify SMTP Handshake'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={sendingTestEmail}
                          onClick={handleSendTestEmail}
                          className="resend-btn-primary inline-flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-[13px] font-medium disabled:opacity-60"
                        >
                          <Mail className="h-4 w-4" aria-hidden="true" />
                          <span>{sendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
                        </button>
                      </div>
                    </div>

                    {testEmailResult && (
                      <div
                        role="status"
                        className={`mt-4 flex items-center gap-2.5 rounded-[var(--radius-xs)] border px-4 py-3 text-[13px] ${
                          testEmailResult.type === 'success'
                            ? 'border-[var(--color-success)]/40 bg-[var(--color-bg)] text-[var(--color-ink)]'
                            : 'border-[var(--color-error)]/40 bg-[var(--color-bg)] text-[var(--color-error)]'
                        }`}
                      >
                        {testEmailResult.type === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        <span>{testEmailResult.text}</span>
                      </div>
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                        <p className="text-[12px] uppercase tracking-wider text-[var(--color-ink-secondary)]">
                          Active Mail Transport
                        </p>
                        <p className="mt-1 text-[15px] font-medium text-[var(--color-ink)]">
                          {emailSetup?.smtpConfigured
                            ? `Hostinger SMTP (${emailSetup.smtpHost}:${emailSetup.smtpPort || 465})`
                            : emailSetup?.resendKeyConfigured
                              ? 'Resend API'
                              : 'Not configured — add SMTP_* or RESEND_API_KEY'}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                        <p className="text-[12px] uppercase tracking-wider text-[var(--color-ink-secondary)]">
                          Customer Receipt Sender
                        </p>
                        <p className="mt-1 text-[15px] font-medium text-[var(--color-ink)]">
                          {emailSetup?.customDomainConfigured
                            ? 'Direct @novesta.online active (all customers)'
                            : 'Sandbox fallback only'}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                        <p className="text-[12px] uppercase tracking-wider text-[var(--color-ink-secondary)]">
                          Sender / Primary Inbox
                        </p>
                        <p className="mt-1 break-all font-mono text-[13px] text-[var(--color-ink)]">
                          From: {emailSetup?.fromAddress || 'Novesta <hello@novesta.online>'}
                          <br />
                          To: {emailSetup?.toAddress || 'hello@novesta.online'}
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                        <p className="text-[12px] uppercase tracking-wider text-[var(--color-ink-secondary)]">
                          Backup / Fallback Inbox
                        </p>
                        <p className="mt-1 break-all font-mono text-[13px] text-[var(--color-ink)]">
                          {emailSetup?.backupEmail || 'novesta111@gmail.com'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                      <p className="text-[14px] font-medium text-[var(--color-ink)]">
                        Hostinger SMTP &amp; Razorpay Live Mail Checklist
                      </p>
                      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] text-[var(--color-ink-secondary)]">
                        <li>
                          Create <code className="font-mono text-[var(--color-ink)]">hello@novesta.online</code> in Hostinger hPanel → Emails → Email Accounts.
                        </li>
                        <li>
                          Set <code className="font-mono text-[var(--color-ink)]">SMTP_HOST=smtp.hostinger.com</code>, <code className="font-mono text-[var(--color-ink)]">SMTP_PORT=465</code>, <code className="font-mono text-[var(--color-ink)]">SMTP_USER=hello@novesta.online</code>, and your mailbox password in <code className="font-mono text-[var(--color-ink)]">SMTP_PASS</code>.
                        </li>
                        <li>
                          Every verified Razorpay checkout or <code className="font-mono text-[var(--color-ink)]">payment.captured</code> webhook automatically emails both the customer (receipt + included services) and <code className="font-mono text-[var(--color-ink)]">hello@novesta.online</code>.
                        </li>
                        <li>
                          Keep Hostinger MX, SPF, and DKIM TXT records active in DNS Zone Editor so receipts never land in spam.
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
