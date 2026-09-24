import React, { useEffect, useState } from 'react';
import { CheckCircle2, Search, X } from 'lucide-react';
import { api } from '../services/api';
import type { EmailActivityMessage, SyncedEmailTemplate } from '../services/api';
import { StatusBadge } from './EmailOverview';
import { useChai } from '../context/ChaiContext';

const statusOptions = ['', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed'];

export const EmailActivity: React.FC = () => {
  const { addToast } = useChai();
  const [messages, setMessages] = useState<EmailActivityMessage[]>([]);
  const [templates, setTemplates] = useState<SyncedEmailTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EmailActivityMessage | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const limit = 25;

  const load = async () => {
    setLoading(true);
    try {
      const [activityRows, templateRows] = await Promise.all([
        api.getEmailActivity({ status, template_id: templateId, search, limit, offset }),
        api.getEmailTemplates().catch(() => []),
      ]);
      setMessages(activityRows);
      setTemplates(templateRows);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to load email activity', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, templateId, offset]);

  const openDetails = async (message: EmailActivityMessage) => {
    setSelected(message);
    setDetailsLoading(true);
    try {
      setSelected(await api.getEmailActivityMessage(message.id));
    } catch {
      setSelected(message);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-heading text-text-primary">Email Activity</h1>
        <p className="text-sm text-text-secondary mt-1">Search and filter automated email delivery events.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_180px_220px_100px] gap-3">
        <div className="flex items-center rounded-lg border border-border-app bg-surface-app px-3 py-2">
          <Search className="w-4 h-4 text-text-secondary mr-2" />
          <input value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') load(); }} placeholder="Search recipient..." className="w-full bg-transparent text-sm outline-none" />
        </div>
        <select value={status} onChange={event => { setOffset(0); setStatus(event.target.value); }} className="rounded-lg border border-border-app bg-surface-app px-3 py-2 text-sm outline-none">
          {statusOptions.map(option => <option key={option} value={option}>{option || 'All statuses'}</option>)}
        </select>
        <select value={templateId} onChange={event => { setOffset(0); setTemplateId(event.target.value); }} className="rounded-lg border border-border-app bg-surface-app px-3 py-2 text-sm outline-none">
          <option value="">All templates</option>
          {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
        </select>
        <button onClick={load} className="rounded-lg bg-primary-app px-3 py-2 text-xs font-semibold text-white">Apply</button>
      </div>

      <section className="rounded-lg border border-border-app bg-surface-app overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-2">{[1, 2, 3, 4].map(item => <div key={item} className="h-12 rounded-lg bg-hover-app/50 animate-pulse" />)}</div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-text-primary">No email messages found</p>
            <p className="text-xs text-text-secondary mt-1">Try clearing filters or syncing templates first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-text-secondary border-b border-border-app bg-hover-app/30">
                <tr>
                  <th className="text-left p-3 font-semibold">Recipient</th>
                  <th className="text-left p-3 font-semibold">Template</th>
                  <th className="text-left p-3 font-semibold">Related Lead</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Sent</th>
                  <th className="text-left p-3 font-semibold">Last Event</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(message => (
                  <tr key={message.id} onClick={() => openDetails(message)} className="border-b border-border-app/60 last:border-0 cursor-pointer hover:bg-hover-app/30">
                    <td className="p-3 text-text-primary">{message.recipient_email || message.to_email || message.recipient || 'Unknown'}</td>
                    <td className="p-3 text-text-secondary">{message.template_name || message.template_label || message.subject || 'Automated email'}</td>
                    <td className="p-3 text-text-secondary">{message.related_lead_name || message.lead_name || message.lead_id || '-'}</td>
                    <td className="p-3"><StatusBadge status={message.status} /></td>
                    <td className="p-3 text-text-secondary">{message.sent_at ? new Date(message.sent_at).toLocaleString() : '-'}</td>
                    <td className="p-3 text-text-secondary">{message.last_event_at ? new Date(message.last_event_at).toLocaleString() : message.last_event || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex justify-end gap-2">
        <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))} className="rounded-lg border border-border-app px-3 py-2 text-xs font-semibold disabled:opacity-50">Previous</button>
        <button disabled={messages.length < limit} onClick={() => setOffset(offset + limit)} className="rounded-lg border border-border-app px-3 py-2 text-xs font-semibold disabled:opacity-50">Next</button>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <aside className="h-full w-full max-w-md bg-surface-app border-l border-border-app shadow-xl p-5 overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-border-app pb-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Email Details</h2>
                <p className="text-xs text-text-secondary mt-1">{detailsLoading ? 'Loading latest event data...' : 'Delivery timeline and provider metadata'}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-hover-app">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm">
              <Detail label="Recipient" value={selected.recipient_email || selected.to_email || selected.recipient || 'Unknown'} />
              <Detail label="Template" value={selected.template_name || selected.template_label || selected.subject || 'Automated email'} />
              <Detail label="Status" value={selected.status} />
              <Detail label="Provider Message ID" value={selected.provider_message_id || '-'} />
              <Detail label="Related Lead" value={selected.related_lead_name || selected.lead_name || selected.lead_id || '-'} />
            </div>

            <div className="border-t border-border-app pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-3">Timeline</h3>
              <div className="space-y-3">
                {[
                  ['Sent', selected.sent_at],
                  ['Delivered', selected.delivered_at],
                  ['Opened', selected.opened_at],
                  ['Clicked', selected.clicked_at],
                  ['Bounced', selected.bounced_at],
                  ['Complained', selected.complained_at],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} className="flex gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-text-primary">{label}</p>
                      <p className="text-xs text-text-secondary">{new Date(String(value)).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {selected.error_message || selected.failed_reason ? (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">{selected.error_message || selected.failed_reason}</div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="block text-xs text-text-secondary">{label}</span>
    <span className="block mt-1 font-medium text-text-primary break-all">{value}</span>
  </div>
);
