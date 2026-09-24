import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, MailOpen, MousePointerClick, RefreshCcw, Search, Send } from 'lucide-react';
import { api } from '../services/api';
import type { CrmEmailMessage, CrmEmailStatus, CrmEmailTemplate, CrmLead } from '../services/api';
import { useChai } from '../context/ChaiContext';

const statuses: CrmEmailStatus[] = ['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed'];

const iconForStatus = (status: CrmEmailStatus) => {
  if (status === 'opened') return MailOpen;
  if (status === 'clicked') return MousePointerClick;
  if (status === 'bounced' || status === 'complained' || status === 'failed') return AlertTriangle;
  if (status === 'queued') return Clock;
  return CheckCircle2;
};

const colorForStatus = (status: CrmEmailStatus) => {
  if (status === 'bounced' || status === 'complained' || status === 'failed') return 'bg-red-500/10 text-red-500';
  if (status === 'queued') return 'bg-amber-500/10 text-amber-500';
  if (status === 'opened' || status === 'clicked') return 'bg-blue-500/10 text-blue-500';
  return 'bg-emerald-500/10 text-success-app';
};

export const Emails: React.FC = () => {
  const { addToast } = useChai();
  const [messages, setMessages] = useState<CrmEmailMessage[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [templates, setTemplates] = useState<CrmEmailTemplate[]>([]);
  const [status, setStatus] = useState('');
  const [leadId, setLeadId] = useState('');
  const [sendLeadId, setSendLeadId] = useState('');
  const [sendTemplateId, setSendTemplateId] = useState('');
  const [extraVariables, setExtraVariables] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const rows = await api.getCrmEmailMessages({ status, lead_id: leadId, limit: 100, offset: 0 });
      setMessages(rows);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to load email messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [status]);

  useEffect(() => {
    Promise.all([
      api.getCrmLeads({ limit: 100, offset: 0 }),
      api.getCrmTemplates(false),
    ])
      .then(([leadRows, templateRows]) => {
        setLeads(leadRows);
        setTemplates(templateRows);
      })
      .catch(() => {
        setLeads([]);
        setTemplates([]);
      });
  }, []);

  const handleSendEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sendLeadId || !sendTemplateId) return;
    setSending(true);
    try {
      const variables = extraVariables.trim() ? JSON.parse(extraVariables) : undefined;
      await api.sendCrmLeadEmail(sendLeadId, { template_id: sendTemplateId, variables });
      setExtraVariables('');
      addToast('Email queued for lead', 'success');
      loadMessages();
    } catch (error) {
      addToast(error instanceof SyntaxError ? 'Extra variables must be valid JSON' : error instanceof Error ? error.message : 'Failed to send email', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">CRM Email Messages</h1>
          <p className="text-xs text-text-secondary">Audit queued sends and Resend webhook delivery states</p>
        </div>
        <button onClick={loadMessages} className="flex items-center justify-center gap-1.5 border border-border-app bg-surface-app text-text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-hover-app shadow">
          <RefreshCcw className="w-3.5 h-3.5" />
          Refresh Logs
        </button>
      </div>

      <form onSubmit={handleSendEmail} className="bg-surface-app border border-border-app rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border-app/50 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Send Template Email</h2>
            <p className="text-[10px] text-text-secondary mt-1">Default lead variables are sent automatically. Add JSON only for extra variables.</p>
          </div>
          <Send className="w-4 h-4 text-primary-app" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary">Lead</span>
            <select required value={sendLeadId} onChange={event => setSendLeadId(event.target.value)} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none">
              <option value="">Select lead</option>
              {leads.map(lead => <option key={lead.id} value={lead.id}>{lead.name} - {lead.email}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-text-secondary">Template Mapping</span>
            <select required value={sendTemplateId} onChange={event => setSendTemplateId(event.target.value)} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none">
              <option value="">Select template</option>
              {templates.map(template => <option key={template.id} value={template.id}>{template.name} ({template.resend_template_id})</option>)}
            </select>
          </label>
        </div>
        <label className="space-y-1 block">
          <span className="text-xs font-semibold text-text-secondary">Extra Variables JSON</span>
          <textarea
            rows={3}
            value={extraVariables}
            onChange={event => setExtraVariables(event.target.value)}
            placeholder='{"booking_link":"https://example.com/book"}'
            className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-accent-app"
          />
        </label>
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-text-secondary font-mono">{'Auto: {{name}} {{email}} {{phone}} {{source}} {{lead_id}}'}</p>
          <button type="submit" disabled={sending || !sendLeadId || !sendTemplateId} className="flex items-center gap-1.5 bg-primary-app disabled:opacity-50 text-white dark:text-black rounded-lg px-4 py-2 text-xs font-bold">
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px_140px] gap-3">
        <div className="flex items-center bg-surface-app border border-border-app rounded-lg px-3 py-2 ">
          <Search className="w-4 h-4 text-text-secondary mr-2" />
          <input value={leadId} onChange={event => setLeadId(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') loadMessages(); }} placeholder="Filter by lead id" className="w-full bg-transparent border-none text-xs text-text-primary outline-none font-mono" />
        </div>
        <select value={status} onChange={event => setStatus(event.target.value)} className="bg-surface-app border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none">
          <option value="">All statuses</option>
          {statuses.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <button onClick={loadMessages} className="flex items-center justify-center gap-1.5 bg-primary-app text-white dark:text-black rounded-lg px-3 py-2 text-xs font-bold">
          <Search className="w-3.5 h-3.5" />
          Apply
        </button>
      </div>

      <div className="bg-surface-app border border-border-app p-5 rounded-lg space-y-4">
        <div className="flex items-center justify-between border-b border-border-app pb-3">
          <h3 className="text-sm font-semibold text-text-primary">Delivery Logs</h3>
          <span className="text-[10px] text-text-secondary font-mono">{messages.length} messages</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-text-secondary text-xs">Loading email messages...</div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-text-secondary text-xs">No email messages found</div>
        ) : (
          <div className="space-y-3">
            {messages.map(message => {
              const Icon = iconForStatus(message.status);
              const recipient = message.to_email || message.recipient_email || message.recipient;
              const label = message.template_name || message.subject || message.template_type || 'Automated lead email';
              const errorMessage = message.error_message || message.failed_reason;
              return (
                <div key={message.id} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_140px_180px] gap-3 border-b border-border-app/40 pb-3 last:border-0 last:pb-0">
                  <div className="flex gap-3 min-w-0">
                    <div className={`p-2 rounded-lg mt-0.5 h-fit ${colorForStatus(message.status)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-text-primary truncate">{label}</span>
                        {recipient && <span className="text-[9px] bg-hover-app border border-border-app px-2 py-0.5 rounded text-text-secondary font-mono">to: {recipient}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-text-secondary font-mono">
                        {message.lead_id && <span>lead {message.lead_id}</span>}
                        {message.template_id && <span>template {message.template_id}</span>}
                        {message.provider_message_id && <span>provider {message.provider_message_id}</span>}
                      </div>
                      {errorMessage && <p className="text-[10px] text-red-500 mt-1">{errorMessage}</p>}
                    </div>
                  </div>
                  <span className={`w-fit h-fit px-2 py-1 rounded border text-[10px] font-semibold uppercase ${colorForStatus(message.status)}`}>
                    {message.status}
                  </span>
                  <div className="text-[10px] text-text-secondary lg:text-right">
                    <span className="block">Created {new Date(message.created_at).toLocaleString()}</span>
                    {message.sent_at && <span className="block">Sent {new Date(message.sent_at).toLocaleString()}</span>}
                    {message.delivered_at && <span className="block">Delivered {new Date(message.delivered_at).toLocaleString()}</span>}
                    {message.opened_at && <span className="block">Opened {new Date(message.opened_at).toLocaleString()}</span>}
                    {message.clicked_at && <span className="block">Clicked {new Date(message.clicked_at).toLocaleString()}</span>}
                    {message.bounced_at && <span className="block">Bounced {new Date(message.bounced_at).toLocaleString()}</span>}
                    {message.complained_at && <span className="block">Complained {new Date(message.complained_at).toLocaleString()}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-surface-app border border-border-app rounded-lg p-4 text-xs text-text-secondary flex items-start gap-3">
        <Send className="w-4 h-4 text-primary-app mt-0.5 shrink-0" />
        <p>Configure the Resend webhook at <span className="font-mono text-text-primary">/api/webhooks/resend</span> and enable sent, delivered, opened, clicked, bounced, and complained events.</p>
      </div>
    </div>
  );
};
