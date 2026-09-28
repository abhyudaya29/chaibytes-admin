import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import type { ConnectResendPayload, GoogleCalendarStatus, ResendIntegration } from '../services/api';
import { useChai } from '../context/ChaiContext';

const emptyForm: ConnectResendPayload = {
  api_key: '',
  from_name: '',
  from_email: '',
  reply_to: '',
  sending_domain: '',
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-app/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app';

export const Integrations: React.FC = () => {
  const { addToast } = useChai();
  const [integration, setIntegration] = useState<ResendIntegration | null>(null);
  const [form, setForm] = useState<ConnectResendPayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [error, setError] = useState('');
  const [googleCalendar, setGoogleCalendar] = useState<GoogleCalendarStatus | null>(null);
  const [googleLoading, setGoogleLoading] = useState(true);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [confirmGoogleDisconnect, setConfirmGoogleDisconnect] = useState(false);

  const loadIntegration = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getResendIntegration();
      setIntegration(data);
      setForm({
        api_key: '',
        from_name: data.from_name || '',
        from_email: data.from_email || '',
        reply_to: data.reply_to || '',
        sending_domain: data.sending_domain || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Your Resend connection has expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegration();
  }, []);

  const loadGoogleCalendar = async () => {
    setGoogleLoading(true);
    try {
      const status = await api.getGoogleCalendarStatus();
      setGoogleCalendar(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Google Calendar status.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      window.history.replaceState({}, '', '/settings/integrations');
      addToast('Google Calendar connected', 'success');
    }
    loadGoogleCalendar();
  }, []);

  // Close the drawer / dialogs with Escape
  useEffect(() => {
    if (!modalOpen && !confirmDisconnect && !confirmGoogleDisconnect) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setModalOpen(false);
      setConfirmDisconnect(false);
      setConfirmGoogleDisconnect(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, confirmDisconnect, confirmGoogleDisconnect]);

  const connect = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await api.connectResend(form);
      setIntegration(updated);
      setForm(prev => ({ ...prev, api_key: '' }));
      setModalOpen(false);
      addToast('Resend connected', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to connect Resend', 'error');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      await api.testResendConnection();
      addToast('Test email sent successfully', 'success');
      loadIntegration();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Test email failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    try {
      await api.disconnectResend();
      setIntegration({ configured: false, status: 'not_connected' });
      setConfirmDisconnect(false);
      addToast('Resend disconnected', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to disconnect Resend', 'error');
    }
  };

  const connectGoogleCalendar = async () => {
    setGoogleConnecting(true);
    try {
      window.location.assign(await api.getGoogleCalendarAuthorizationUrl());
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to start Google connection', 'error');
      setGoogleConnecting(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await api.disconnectGoogleCalendar();
      setGoogleCalendar({ connected: false });
      setConfirmGoogleDisconnect(false);
      addToast('Google Calendar disconnected', 'info');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to disconnect Google Calendar', 'error');
    }
  };

  const connected = Boolean(integration?.configured || integration?.status === 'connected');
  const googleConnected = Boolean(googleCalendar?.connected);
  const domainSet = Boolean(integration?.sending_domain);
  const steps = [connected, domainSet, googleConnected];
  const doneSteps = steps.filter(Boolean).length;
  const connectedCount = [connected, googleConnected].filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-text-primary">Integrations</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-text-secondary">
            Connect email and calendar so new leads get follow-ups and booked calls without manual work.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-border-app bg-surface-app px-3.5 py-1.5 text-xs font-medium text-text-secondary shadow-sm sm:self-auto">
          <span
            className={`h-2 w-2 rounded-full ${connectedCount === 2 ? 'bg-success-app' : connectedCount === 1 ? 'bg-amber-400' : 'bg-text-secondary/40'}`}
          />
          {connectedCount} of 2 connected
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Something went wrong</p>
            <p className="mt-0.5 text-red-400/90">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Dismiss error"
            className={`rounded-md p-1 hover:bg-red-500/10 ${focusRing}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
        {/* Integration cards */}
        <div className="space-y-5">
          <IntegrationCard
            icon={<Mail className="h-5 w-5" />}
            tone="primary"
            name="Resend"
            description="Send automated emails and templates from your websites."
            connected={connected}
            loading={loading}
            emptyText="Add your Resend API key to sync templates and send follow-ups to new leads."
            emptyAction={
              <PrimaryButton onClick={() => setModalOpen(true)}>Connect Resend</PrimaryButton>
            }
            footer={
              <>
                <PrimaryButton onClick={testConnection} disabled={testing}>
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  {testing ? 'Sending test…' : 'Send test email'}
                </PrimaryButton>
                <SecondaryButton onClick={() => setModalOpen(true)}>Edit settings</SecondaryButton>
                <DangerButton onClick={() => setConfirmDisconnect(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Disconnect
                </DangerButton>
              </>
            }
          >
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoRow label="Sender name" value={integration?.from_name || 'Not set'} />
              <InfoRow label="Sender email" value={integration?.from_email || 'Not set'} />
              <InfoRow label="Sending domain" value={integration?.sending_domain || 'Not set'} />
              <InfoRow label="API key" value={integration?.masked_key || 're_••••••••'} mono />
              <InfoRow label="Status" value={integration?.status || 'connected'} />
              <InfoRow
                label="Last verified"
                value={
                  integration?.last_verified_at
                    ? new Date(integration.last_verified_at).toLocaleString()
                    : 'Just now'
                }
              />
            </dl>
          </IntegrationCard>

          <IntegrationCard
            icon={<CalendarDays className="h-5 w-5" />}
            tone="accent"
            name="Google Calendar"
            description="Create calendar events and Google Meet links for booked leads."
            connected={googleConnected}
            loading={googleLoading}
            emptyText="Connect your organization's calendar so leads can book meetings with your team."
            emptyAction={
              <PrimaryButton onClick={connectGoogleCalendar} disabled={googleConnecting}>
                {googleConnecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                ) : (
                  <Link2 className="h-3.5 w-3.5" />
                )}
                {googleConnecting ? 'Redirecting to Google…' : 'Connect Google Calendar'}
              </PrimaryButton>
            }
            footer={
              <DangerButton onClick={() => setConfirmGoogleDisconnect(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Disconnect
              </DangerButton>
            }
          >
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <InfoRow label="Google account" value={googleCalendar?.google_email || 'Connected'} />
              <InfoRow label="Calendar" value={googleCalendar?.calendar_id || 'primary'} />
            </dl>
          </IntegrationCard>
        </div>

        {/* Setup progress */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-xl border border-border-app bg-surface-app p-5 shadow-sm">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Setup progress</h2>
              <span className="text-xs font-medium text-text-secondary">{doneSteps} of 3 done</span>
            </div>
            <div
              className="mt-3 flex gap-1.5"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={3}
              aria-valuenow={doneSteps}
              aria-label="Integration setup progress"
            >
              {steps.map((done, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${done ? 'bg-primary-app' : 'bg-hover-app'}`}
                />
              ))}
            </div>

            <ul className="mt-5 space-y-4">
              <ChecklistItem
                done={connected}
                title="Connect Resend"
                copy="Needed to send templates and automated follow-ups."
              />
              <ChecklistItem
                done={domainSet}
                title="Add a sending domain"
                copy="Emails from your own domain land in inboxes more often."
              />
              <ChecklistItem
                done={googleConnected}
                title="Connect Google Calendar"
                copy="Needed to book Google Meet calls with leads."
              />
            </ul>
          </div>

          <div className="flex gap-3 rounded-xl border border-border-app bg-hover-app/20 p-4">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
            <p className="text-xs leading-5 text-text-secondary">
              Credentials are encrypted and stored on our servers. After setup, only a masked version of your key is shown.
            </p>
          </div>
        </aside>
      </div>

      {/* Resend settings drawer */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="resend-drawer-title">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setModalOpen(false)} />
          <form
            onSubmit={connect}
            className="relative flex h-full w-full max-w-md flex-col border-l border-border-app bg-surface-app shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-app px-6 py-5">
              <div className="flex items-center gap-3">
                <IconTile tone="primary">
                  <Mail className="h-5 w-5" />
                </IconTile>
                <div>
                  <h2 id="resend-drawer-title" className="text-base font-semibold text-text-primary">
                    {connected ? 'Edit Resend settings' : 'Connect Resend'}
                  </h2>
                  <p className="mt-0.5 text-xs text-text-secondary">Set up how your emails are sent.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
                className={`rounded-lg p-2 text-text-secondary hover:bg-hover-app ${focusRing}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-text-primary">API key</legend>
                <Input
                  label="Resend API key"
                  type="password"
                  required
                  value={form.api_key}
                  onChange={value => setForm({ ...form, api_key: value })}
                  placeholder="re_xxxxxxxxxxxxxxxxx"
                  hint={
                    connected
                      ? 'For security, enter your key again to save changes. It is never shown in full.'
                      : 'Find this in your Resend dashboard under API Keys. It is encrypted when saved.'
                  }
                />
              </fieldset>

              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-text-primary">Sender</legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="From name"
                    required
                    value={form.from_name}
                    onChange={value => setForm({ ...form, from_name: value })}
                    placeholder="Acme Team"
                  />
                  <Input
                    label="From email"
                    type="email"
                    required
                    value={form.from_email}
                    onChange={value => setForm({ ...form, from_email: value })}
                    placeholder="hello@acme.com"
                  />
                </div>
                <Input
                  label="Reply-to email"
                  type="email"
                  value={form.reply_to || ''}
                  onChange={value => setForm({ ...form, reply_to: value })}
                  placeholder="support@acme.com"
                  hint="Optional. Replies go here instead of the From address."
                />
                <Input
                  label="Sending domain"
                  value={form.sending_domain || ''}
                  onChange={value => setForm({ ...form, sending_domain: value })}
                  placeholder="acme.com"
                  hint="Optional. Use the domain you verified in Resend."
                />
              </fieldset>
            </div>

            <div className="flex justify-end gap-2 border-t border-border-app bg-surface-app px-6 py-4">
              <SecondaryButton type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />}
                {saving ? 'Saving…' : connected ? 'Save changes' : 'Connect Resend'}
              </PrimaryButton>
            </div>
          </form>
        </div>
      )}

      {confirmDisconnect && (
        <ConfirmDialog
          title="Disconnect Resend?"
          body="Automated emails will stop until you connect Resend again."
          onCancel={() => setConfirmDisconnect(false)}
          onConfirm={disconnect}
        />
      )}

      {confirmGoogleDisconnect && (
        <ConfirmDialog
          title="Disconnect Google Calendar?"
          body="Leads won't be able to book meetings until your organization connects Google again."
          onCancel={() => setConfirmGoogleDisconnect(false)}
          onConfirm={disconnectGoogleCalendar}
        />
      )}
    </div>
  );
};

/* ---------- Building blocks ---------- */

const IconTile = ({ tone, children }: { tone: 'primary' | 'accent'; children: React.ReactNode }) => (
  <div
    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${
      tone === 'primary'
        ? 'bg-primary-app/10 text-primary-app ring-primary-app/20'
        : 'bg-accent-app/10 text-accent-app ring-accent-app/20'
    }`}
  >
    {children}
  </div>
);

const StatusPill = ({ connected }: { connected: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      connected ? 'bg-success-app/10 text-success-app' : 'bg-hover-app text-text-secondary'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-success-app' : 'bg-text-secondary/50'}`} />
    {connected ? 'Connected' : 'Not connected'}
  </span>
);

const IntegrationCard = ({
  icon,
  tone,
  name,
  description,
  connected,
  loading,
  children,
  footer,
  emptyText,
  emptyAction,
}: {
  icon: React.ReactNode;
  tone: 'primary' | 'accent';
  name: string;
  description: string;
  connected: boolean;
  loading: boolean;
  children: React.ReactNode;
  footer: React.ReactNode;
  emptyText: string;
  emptyAction: React.ReactNode;
}) => (
  <section className="overflow-hidden rounded-xl border border-border-app bg-surface-app shadow-sm">
    <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
      <div className="flex min-w-0 gap-4">
        <IconTile tone={tone}>{icon}</IconTile>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">{name}</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{description}</p>
        </div>
      </div>
      {!loading && <StatusPill connected={connected} />}
    </div>

    {loading ? (
      <div className="space-y-3 px-5 pb-6 sm:px-6" aria-busy="true">
        <div className="h-4 w-2/3 animate-pulse rounded bg-hover-app/60 motion-reduce:animate-none" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-hover-app/60 motion-reduce:animate-none" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-hover-app/60 motion-reduce:animate-none" />
      </div>
    ) : connected ? (
      <>
        <div className="border-t border-border-app px-5 py-5 sm:px-6">{children}</div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border-app bg-hover-app/20 px-5 py-3.5 sm:px-6">
          {footer}
        </div>
      </>
    ) : (
      <div className="flex flex-col gap-4 border-t border-border-app bg-hover-app/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="max-w-md text-sm leading-6 text-text-secondary">{emptyText}</p>
        <div className="shrink-0">{emptyAction}</div>
      </div>
    )}
  </section>
);

const InfoRow = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="min-w-0">
    <dt className="text-xs text-text-secondary">{label}</dt>
    <dd className={`mt-1 break-all text-sm font-medium text-text-primary ${mono ? 'font-mono' : ''}`}>{value}</dd>
  </div>
);

const ChecklistItem = ({ done, title, copy }: { done: boolean; title: string; copy: string }) => (
  <li className="flex gap-3">
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
        done ? 'border-success-app bg-success-app text-bg-app' : 'border-border-app bg-transparent text-transparent'
      }`}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </span>
    <div>
      <p className={`text-sm font-medium ${done ? 'text-text-secondary line-through decoration-text-secondary/40' : 'text-text-primary'}`}>
        {title}
      </p>
      <p className="mt-0.5 text-xs leading-5 text-text-secondary">{copy}</p>
    </div>
  </li>
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const PrimaryButton = ({ className = '', ...props }: ButtonProps) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-app px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:text-black ${focusRing} ${className}`}
  />
);

const SecondaryButton = ({ className = '', ...props }: ButtonProps) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-app bg-surface-app px-3.5 py-2 text-sm font-medium text-text-primary transition hover:bg-hover-app disabled:opacity-60 ${focusRing} ${className}`}
  />
);

const DangerButton = ({ className = '', ...props }: ButtonProps) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 sm:ml-auto ${focusRing} ${className}`}
  />
);

const ConfirmDialog = ({
  title,
  body,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onCancel} />
    <div className="relative w-full max-w-sm rounded-xl border border-border-app bg-surface-app p-6 shadow-2xl">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-400">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-text-primary">{title}</h2>
      <p className="mt-1.5 text-sm leading-6 text-text-secondary">{body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
        <button
          onClick={onConfirm}
          className={`inline-flex items-center justify-center rounded-lg bg-red-500 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-red-600 ${focusRing}`}
        >
          Disconnect
        </button>
      </div>
    </div>
  </div>
);

const Input = ({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-text-primary">
      {label}
      {!required && <span className="ml-1.5 text-xs font-normal text-text-secondary">Optional</span>}
    </span>
    <input
      type={type}
      required={required}
      value={value}
      placeholder={placeholder}
      onChange={event => onChange(event.target.value)}
      className="w-full rounded-lg border border-border-app bg-surface-app px-3 py-2.5 text-sm text-text-primary shadow-sm outline-none transition placeholder:text-text-secondary/60 focus:border-primary-app focus:ring-2 focus:ring-primary-app/20"
    />
    {hint && <span className="block text-xs leading-5 text-text-secondary">{hint}</span>}
  </label>
);
