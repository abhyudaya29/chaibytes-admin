import React, { useEffect, useState } from 'react';
import { ArrowRight, MousePointerClick, RefreshCcw } from 'lucide-react';
import { api } from '../services/api';
import type { EmailActivityMessage } from '../services/api';
import { navigateTo } from '../utils/navigation';
import { useChai } from '../context/ChaiContext';

export const EmailOverview: React.FC = () => {
  const { addToast } = useChai();
  const [messages, setMessages] = useState<EmailActivityMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setMessages(await api.getEmailActivity({ limit: 10, offset: 0 }));
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to load email overview', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const count = (status: string) => messages.filter(message => message.status === status).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">Email</h1>
          <p className="text-sm text-text-secondary mt-1">Manage automated emails sent from your websites and leads.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-border-app px-3 py-2 text-xs font-semibold hover:bg-hover-app">
          <RefreshCcw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Emails Sent', value: count('sent') + count('delivered') + count('opened') + count('clicked') },
          { label: 'Delivered', value: count('delivered') },
          { label: 'Opened', value: count('opened') },
          { label: 'Clicked', value: count('clicked') },
          { label: 'Bounced', value: count('bounced') },
        ].map(card => (
          <div key={card.label} className="rounded-lg border border-border-app bg-surface-app p-4">
            <span className="text-xs uppercase tracking-wide text-text-secondary font-semibold">{card.label}</span>
            <span className="block mt-3 text-2xl font-bold text-text-primary">{card.value}</span>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-border-app bg-surface-app p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Recent Email Activity</h2>
            <p className="text-xs text-text-secondary mt-1">Latest delivery events from Resend webhooks.</p>
          </div>
          <button onClick={() => navigateTo('/email/activity')} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-app">
            View all activity
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map(item => <div key={item} className="h-12 rounded-lg bg-hover-app/50 animate-pulse" />)}</div>
        ) : messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-app p-10 text-center">
            <MousePointerClick className="w-8 h-8 mx-auto text-text-secondary mb-3" />
            <p className="text-sm font-semibold text-text-primary">No email activity yet</p>
            <p className="text-xs text-text-secondary mt-1">Automated sends and webhook events will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-text-secondary border-b border-border-app">
                <tr>
                  <th className="text-left py-2 font-semibold">Recipient</th>
                  <th className="text-left py-2 font-semibold">Template</th>
                  <th className="text-left py-2 font-semibold">Status</th>
                  <th className="text-left py-2 font-semibold">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {messages.slice(0, 6).map(message => (
                  <tr key={message.id} className="border-b border-border-app/60 last:border-0">
                    <td className="py-3 text-text-primary">{message.recipient_email || message.to_email || message.recipient || 'Unknown'}</td>
                    <td className="py-3 text-text-secondary">{message.template_name || message.template_label || message.subject || 'Automated email'}</td>
                    <td className="py-3"><StatusBadge status={message.status} /></td>
                    <td className="py-3 text-text-secondary">{message.sent_at ? new Date(message.sent_at).toLocaleString() : 'Not sent'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  const negative = ['bounced', 'failed', 'complained'].includes(status);
  const warm = ['queued', 'sent'].includes(status);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${negative ? 'bg-red-500/10 text-red-400' : warm ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
      {status}
    </span>
  );
};
