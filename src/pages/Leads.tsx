import React, { useEffect, useEffectEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock3, Mail, Phone, Plus, RefreshCcw, Search, Send, X } from 'lucide-react';
import { api } from '../services/api';
import type { CrmEmailMessage, CrmEmailTemplate, CrmLead, CrmLeadStatus } from '../services/api';
import { useChai } from '../context/ChaiContext';

const statuses: CrmLeadStatus[] = ['new', 'contacted', 'booked', 'closed', 'lost'];

const statusMeta: Record<CrmLeadStatus, { label: string; color: string }> = {
  new: { label: 'New', color: 'border-blue-500 text-blue-500 bg-blue-500/5' },
  contacted: { label: 'Contacted', color: 'border-purple-500 text-purple-500 bg-purple-500/5' },
  booked: { label: 'Booked', color: 'border-emerald-500 text-emerald-500 bg-emerald-500/5' },
  closed: { label: 'Closed', color: 'border-text-secondary text-text-secondary bg-hover-app' },
  lost: { label: 'Lost', color: 'border-red-500 text-red-500 bg-red-500/5' },
};

const sourceOptions = ['manual', 'lead_form', 'booking', 'newsletter', 'contact_page', 'landing_page'];
const pageSize = 50;

export const Leads: React.FC = () => {
  const { addToast } = useChai();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [templates, setTemplates] = useState<CrmEmailTemplate[]>([]);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [isNewLeadOpen, setNewLeadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [emailMessages, setEmailMessages] = useState<CrmEmailMessage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'manual',
    status: 'new' as CrmLeadStatus,
    notes: '',
  });

  const loadLeads = async () => {
    setLoading(true);
    try {
      const rows = await api.getCrmLeads({ search, status: statusFilter, source: sourceFilter, limit: pageSize, offset });
      setLeads(rows);
      if (selectedLead) {
        setSelectedLead(rows.find(item => item.id === selectedLead.id) || null);
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to load leads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadError = useEffectEvent((error: unknown) => {
    addToast(error instanceof Error ? error.message : 'Failed to load leads', 'error');
  });

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      api.getCrmLeads({ search, status: statusFilter, source: sourceFilter, limit: pageSize, offset })
        .then(rows => {
          if (cancelled) return;
          setLeads(rows);
          setSelectedLead(current => current ? rows.find(item => item.id === current.id) || null : null);
        })
        .catch(handleLoadError)
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search, statusFilter, sourceFilter, offset]);

  useEffect(() => {
    api.getCrmTemplates(false).then(setTemplates).catch(() => setTemplates([]));
  }, []);

  const handleCreateLead = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const created = await api.createCrmLead(form);
      setLeads(prev => [created, ...prev]);
      setSelectedLead(created);
      setForm({ name: '', email: '', phone: '', source: 'manual', status: 'new', notes: '' });
      setNewLeadOpen(false);
      addToast('Lead created and new_lead automations queued', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to create lead', 'error');
    }
  };

  const updateLead = async (lead: CrmLead, updates: Partial<CrmLead>) => {
    try {
      const updated = await api.updateCrmLead(lead.id, updates);
      setLeads(prev => prev.map(item => item.id === updated.id ? updated : item));
      if (selectedLead?.id === updated.id) setSelectedLead(updated);
      addToast('Lead updated', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to update lead', 'error');
    }
  };

  const inspectLead = async (lead: CrmLead) => {
    setSelectedLead(lead);
    setEmailMessages([]);
    setDetailLoading(true);
    try {
      const [detail, messages] = await Promise.all([
        api.getCrmLead(lead.id),
        api.getCrmEmailMessages({ lead_id: lead.id, status: 'sent', limit: 100, offset: 0 }),
      ]);
      setSelectedLead(detail);
      setEmailMessages(messages);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to load lead details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const sendTemplate = async () => {
    if (!selectedLead || !selectedTemplateId) return;
    try {
      await api.sendCrmLeadEmail(selectedLead.id, { template_id: selectedTemplateId });
      addToast('Email queued for lead', 'success');
      const messages = await api.getCrmEmailMessages({ lead_id: selectedLead.id, status: 'sent', limit: 100, offset: 0 });
      setEmailMessages(messages);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to send email', 'error');
    }
  };

  const retriggerAutomations = async () => {
    if (!selectedLead) return;
    try {
      await api.triggerCrmLeadAutomations(selectedLead.id, 'new_lead');
      addToast('new_lead automations queued again', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to trigger automations', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">CRM Leads</h1>
          <p className="text-xs text-text-secondary">Track public website leads, bookings, newsletters, and follow-up status</p>
        </div>
        <button onClick={() => setNewLeadOpen(true)} className="flex items-center justify-center gap-1.5 bg-primary-app text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 shadow">
          <Plus className="w-3.5 h-3.5" />
          Add Manual Lead
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex items-center bg-surface-app border border-border-app rounded-lg px-3 py-2 w-full md:w-96 ">
          <Search className="w-4 h-4 text-text-secondary mr-2" />
          <input value={search} onChange={event => { setLoading(true); setSearch(event.target.value); setOffset(0); }} onKeyDown={event => { if (event.key === 'Enter') loadLeads(); }} placeholder="Search name, email, or notes" className="w-full bg-transparent border-none text-xs text-text-primary outline-none" />
        </div>
        <select value={statusFilter} onChange={event => { setLoading(true); setStatusFilter(event.target.value); setOffset(0); }} className="bg-surface-app border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none">
          <option value="">All statuses</option>
          {statuses.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={sourceFilter} onChange={event => { setLoading(true); setSourceFilter(event.target.value); setOffset(0); }} className="bg-surface-app border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none">
          <option value="">All sources</option>
          {sourceOptions.map(source => <option key={source} value={source}>{source.replaceAll('_', ' ')}</option>)}
        </select>
        <button onClick={loadLeads} className="flex items-center gap-1.5 border border-border-app rounded-lg px-3 py-2 text-xs font-semibold hover:bg-hover-app">
          <RefreshCcw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {isNewLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewLeadOpen(false)} />
          <form onSubmit={handleCreateLead} className="bg-surface-app border border-border-app rounded-lg shadow-xl w-full max-w-lg p-5 z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-border-app pb-3">
              <h3 className="text-sm font-semibold text-text-primary">Create Lead</h3>
              <button type="button" onClick={() => setNewLeadOpen(false)} aria-label="Close create lead dialog" className="p-1 text-text-secondary hover:text-text-primary"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none" />
              <input required type="email" placeholder="Email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none" />
              <input placeholder="Phone" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className="bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none" />
              <select value={form.source} onChange={event => setForm({ ...form, source: event.target.value })} className="bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none">
                {sourceOptions.map(source => <option key={source} value={source}>{source}</option>)}
              </select>
            </div>
            <textarea placeholder="Notes" rows={4} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none" />
            <button type="submit" className="w-full bg-primary-app text-white dark:text-black font-semibold text-xs py-2.5 rounded-lg hover:opacity-90">Create Lead</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 ${selectedLead ? 'xl:col-span-3' : 'xl:col-span-4'}`}>
          {statuses.map(status => {
            const stageLeads = leads.filter(lead => lead.status === status);
            const meta = statusMeta[status];
            return (
              <div key={status} className="space-y-3">
                <div className={`flex items-center justify-between border-l-2 p-3 rounded-r-xl border-border-app bg-surface-app  ${meta.color}`}>
                  <span className="text-xs font-semibold">{meta.label}</span>
                  <span className="text-[10px] bg-hover-app border px-2 py-0.5 rounded-full text-text-secondary font-mono">{stageLeads.length}</span>
                </div>
                <div className="space-y-3 min-h-[260px]">
                  {loading ? (
                    <div className="py-8 text-center text-[10px] text-text-secondary">Loading</div>
                  ) : stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-text-secondary border border-dashed border-border-app/40 rounded-lg bg-hover-app/10">Empty</div>
                  ) : stageLeads.map(lead => (
                    <button key={lead.id} onClick={() => inspectLead(lead)} className={`w-full text-left bg-surface-app border p-4 rounded-lg hover:shadow-md transition-all space-y-3 ${selectedLead?.id === lead.id ? 'border-primary-app ring-1 ring-primary-app/20' : 'border-border-app'}`}>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">{lead.source}</span>
                        <h4 className="text-xs font-bold text-text-primary mt-0.5">{lead.name}</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-2">{lead.notes || lead.email}</p>
                      </div>
                      <div className="border-t border-border-app/40 pt-2 flex items-center justify-between text-[10px]">
                        <span className="text-[9px] text-text-secondary font-mono">{new Date(lead.created_at).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          {statuses.indexOf(status) > 0 && <span onClick={event => { event.stopPropagation(); updateLead(lead, { status: statuses[statuses.indexOf(status) - 1] }); }} className="text-text-secondary hover:text-text-primary"><ArrowLeft className="w-3 h-3" /></span>}
                          {statuses.indexOf(status) < statuses.length - 1 && <span onClick={event => { event.stopPropagation(); updateLead(lead, { status: statuses[statuses.indexOf(status) + 1] }); }} className="text-primary-app hover:text-accent-app"><ArrowRight className="w-3 h-3" /></span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {selectedLead && (
          <aside className="bg-surface-app border border-border-app p-5 rounded-lg space-y-5 shadow-md max-h-[720px] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border-app pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-primary-app tracking-wider">Lead Inspector</span>
                <h3 className="text-sm font-bold text-text-primary mt-0.5">{selectedLead.name}</h3>
              </div>
              <button onClick={() => setSelectedLead(null)} aria-label="Close lead inspector" className="p-1 rounded hover:bg-hover-app text-text-secondary"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-text-primary"><Mail className="w-3.5 h-3.5 text-text-secondary" /> {selectedLead.email}</div>
              {selectedLead.phone && <div className="flex items-center gap-2 text-text-secondary"><Phone className="w-3.5 h-3.5" /> {selectedLead.phone}</div>}
              <div className="text-text-secondary">Source: <span className="font-mono">{selectedLead.source}</span></div>
              <div className="text-text-secondary">Created: {new Date(selectedLead.created_at).toLocaleString()}</div>
            </div>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-text-secondary">Status</span>
              <select value={selectedLead.status} onChange={event => updateLead(selectedLead, { status: event.target.value as CrmLeadStatus })} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none">
                {statuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-text-secondary">Notes</span>
              <textarea rows={5} value={selectedLead.notes || ''} onChange={event => setSelectedLead({ ...selectedLead, notes: event.target.value })} onBlur={() => updateLead(selectedLead, { notes: selectedLead.notes || '' })} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none" />
            </label>
            <div className="space-y-3 border-t border-border-app pt-4">
              <select value={selectedTemplateId} onChange={event => setSelectedTemplateId(event.target.value)} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs outline-none">
                <option value="">Select template to send</option>
                {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
              <button onClick={sendTemplate} disabled={!selectedTemplateId} className="w-full flex items-center justify-center gap-1.5 bg-primary-app disabled:opacity-50 text-white dark:text-black font-semibold text-xs py-2.5 rounded-lg">
                <Send className="w-3.5 h-3.5" />
                Send Template Now
              </button>
              <button onClick={retriggerAutomations} className="w-full flex items-center justify-center gap-1.5 border border-border-app font-semibold text-xs py-2.5 rounded-lg hover:bg-hover-app">
                <RefreshCcw className="w-3.5 h-3.5" />
                Re-Trigger new_lead Automations
              </button>
            </div>
            <div className="space-y-3 border-t border-border-app pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-text-primary">Sent messages</h4>
                <span className="text-[10px] text-text-secondary">{emailMessages.length}</span>
              </div>
              {detailLoading ? (
                <p className="py-3 text-center text-[10px] text-text-secondary">Loading activity...</p>
              ) : emailMessages.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border-app p-3 text-center text-[10px] text-text-secondary">No sent messages for this lead.</p>
              ) : (
                <div className="space-y-2">
                  {emailMessages.map(message => (
                    <div key={message.id} className="rounded-lg border border-border-app bg-hover-app/20 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-text-primary line-clamp-2">{message.subject || message.template_name || 'Email message'}</p>
                        <span className="shrink-0 rounded border border-success-app/30 bg-success-app/10 px-1.5 py-0.5 text-[9px] font-semibold text-success-app">{message.status}</span>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-[10px] text-text-secondary">
                        <Clock3 className="h-3 w-3" />
                        {new Date(message.sent_at || message.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border-app pt-4">
        <p className="text-xs text-text-secondary">Showing {leads.length} leads from {offset + 1}</p>
        <div className="flex gap-2">
          <button disabled={offset === 0 || loading} onClick={() => { setLoading(true); setOffset(current => Math.max(0, current - pageSize)); }} className="rounded-lg border border-border-app px-3 py-2 text-xs font-semibold disabled:opacity-40 hover:bg-hover-app">Previous</button>
          <button disabled={leads.length < pageSize || loading} onClick={() => { setLoading(true); setOffset(current => current + pageSize); }} className="rounded-lg border border-border-app px-3 py-2 text-xs font-semibold disabled:opacity-40 hover:bg-hover-app">Next</button>
        </div>
      </div>
    </div>
  );
};
