import React, { useEffect, useState } from 'react';
import { AlertTriangle, Mail, ShieldCheck, Trash2, X } from 'lucide-react';
import { api } from '../services/api';
import type { ConnectResendPayload, ResendIntegration } from '../services/api';
import { useChai } from '../context/ChaiContext';

const emptyForm: ConnectResendPayload = {
  api_key: '',
  from_name: '',
  from_email: '',
  reply_to: '',
  sending_domain: '',
};

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

  const connected = Boolean(integration?.configured || integration?.status === 'connected');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-heading text-text-primary">Integrations</h1>
        <p className="text-sm text-text-secondary mt-1">Connect providers used by automated website and lead workflows.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-surface-app border border-border-app rounded-lg p-5 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-lg bg-primary-app/10 text-primary-app flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">Resend</h2>
                <p className="text-sm text-text-secondary mt-1">Send transactional and automated emails from your websites.</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-hover-app text-text-secondary'}`}>
              {connected ? 'Connected' : 'Not connected'}
            </span>
          </div>

          {loading ? (
            <div className="h-32 rounded-lg bg-hover-app/40 animate-pulse" />
          ) : connected ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border-app p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <InfoRow label="From" value={integration?.from_name || 'Not set'} />
                <InfoRow label="Email" value={integration?.from_email || 'Not set'} />
                <InfoRow label="API Key" value={integration?.masked_key || 're_••••••••'} />
                <InfoRow label="Status" value={integration?.status || 'connected'} />
                <InfoRow label="Last verified" value={integration?.last_verified_at ? new Date(integration.last_verified_at).toLocaleString() : 'Just now'} />
                <InfoRow label="Domain" value={integration?.sending_domain || 'Not set'} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={testConnection} disabled={testing} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-app px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <button onClick={() => setModalOpen(true)} className="rounded-lg border border-border-app px-3 py-2 text-xs font-semibold hover:bg-hover-app">
                  Update
                </button>
                <button onClick={() => setConfirmDisconnect(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between border-t border-border-app pt-4">
              <p className="text-sm text-text-secondary">Connect Resend before syncing templates or sending automated emails.</p>
              <button onClick={() => setModalOpen(true)} className="rounded-lg bg-primary-app px-4 py-2 text-xs font-semibold text-white">
                Connect
              </button>
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={connect} className="w-full max-w-lg bg-surface-app border border-border-app rounded-lg shadow-xl">
            <div className="flex items-center justify-between border-b border-border-app px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">{connected ? 'Update Resend' : 'Connect Resend'}</h2>
                <p className="text-xs text-text-secondary mt-1">Your API key is encrypted and securely stored. Chaibytes will never display the full key again.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-hover-app">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Input label="Resend API Key" type="password" required value={form.api_key} onChange={value => setForm({ ...form, api_key: value })} placeholder="re_xxxxxxxxxxxxxxxxx" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="From Name" required value={form.from_name} onChange={value => setForm({ ...form, from_name: value })} />
                <Input label="From Email" type="email" required value={form.from_email} onChange={value => setForm({ ...form, from_email: value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Reply-To" type="email" value={form.reply_to || ''} onChange={value => setForm({ ...form, reply_to: value })} />
                <Input label="Sending Domain" value={form.sending_domain || ''} onChange={value => setForm({ ...form, sending_domain: value })} />
              </div>
            </div>
            <div className="border-t border-border-app px-5 py-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-border-app px-3 py-2 text-xs font-semibold hover:bg-hover-app">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-primary-app px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
                {saving ? 'Connecting...' : 'Connect Resend'}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-surface-app border border-border-app rounded-lg p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Disconnect Resend?</h2>
            <p className="text-sm text-text-secondary">Automated emails will stop until Resend is connected again.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDisconnect(false)} className="rounded-lg border border-border-app px-3 py-2 text-xs font-semibold hover:bg-hover-app">Cancel</button>
              <button onClick={disconnect} className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white">Disconnect</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="block text-xs text-text-secondary">{label}</span>
    <span className="block mt-1 text-sm font-medium text-text-primary break-all">{value}</span>
  </div>
);

const Input = ({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) => (
  <label className="space-y-1 block">
    <span className="text-xs font-semibold text-text-secondary">{label}</span>
    <input
      type={type}
      required={required}
      value={value}
      placeholder={placeholder}
      onChange={event => onChange(event.target.value)}
      className="w-full rounded-lg border border-border-app bg-hover-app/40 px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-app"
    />
  </label>
);
