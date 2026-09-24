import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import { api } from '../services/api';
import type { SyncedEmailTemplate, TemplateVariableMapping } from '../services/api';
import { navigateTo } from '../utils/navigation';
import { useChai } from '../context/ChaiContext';

const purposes = [
  { label: 'Lead Acknowledgement', value: 'LEAD_ACKNOWLEDGEMENT' },
  { label: 'Booking Confirmation', value: 'BOOKING_CONFIRMATION' },
  { label: 'Appointment Reminder', value: 'APPOINTMENT_REMINDER' },
  { label: 'Follow-up', value: 'FOLLOW_UP' },
  { label: 'Testimonial Request', value: 'TESTIMONIAL_REQUEST' },
  { label: 'Custom', value: 'CUSTOM' },
];

const groupedOptions = [
  { group: 'Lead', type: 'lead', fields: [['first_name', 'First Name'], ['last_name', 'Last Name'], ['full_name', 'Full Name'], ['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['source', 'Source']] },
  { group: 'Organization', type: 'organization', fields: [['name', 'Name'], ['domain', 'Domain'], ['slug', 'Slug'], ['website_url', 'Website URL']] },
  { group: 'User', type: 'user', fields: [['full_name', 'Full Name'], ['email', 'Email'], ['phone_number', 'Phone Number']] },
  { group: 'Booking', type: 'booking', fields: [['id', 'ID'], ['date', 'Date'], ['time', 'Time'], ['url', 'URL']] },
  { group: 'Static', type: 'static', fields: [['value', 'Static Value']] },
];

export const EmailTemplateDetail: React.FC<{ templateId: string }> = ({ templateId }) => {
  const { addToast } = useChai();
  const [template, setTemplate] = useState<SyncedEmailTemplate | null>(null);
  const [purpose, setPurpose] = useState('');
  const [mappings, setMappings] = useState<TemplateVariableMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const variables = useMemo(() => template?.required_variables || template?.variables || [], [template]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getEmailTemplate(templateId);
      setTemplate(data);
      setPurpose(data.template_type || '');
      const existing = data.mappings || Object.entries(data.variable_mappings || {}).map(([variable_name, source_field]) => ({
        variable_name,
        source_type: 'lead' as const,
        source_field,
      }));
      setMappings(variables.length ? variables.map(variable => existing.find(item => item.variable_name === variable) || { variable_name: variable, source_type: 'lead', source_field: '' }) : existing);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Template no longer exists in Resend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [templateId]);

  useEffect(() => {
    if (!template) return;
    const existing = template.mappings || Object.entries(template.variable_mappings || {}).map(([variable_name, source_field]) => ({
      variable_name,
      source_type: 'lead' as const,
      source_field,
    }));
    setMappings(variables.map(variable => existing.find(item => item.variable_name === variable) || { variable_name: variable, source_type: 'lead', source_field: '' }));
  }, [template, variables]);

  const unmapped = mappings.filter(mapping => !mapping.source_field || (mapping.source_type === 'static' && !mapping.static_value)).length;

  const updateMapping = (variableName: string, value: string) => {
    const [source_type, source_field] = value.split(':') as [TemplateVariableMapping['source_type'], string];
    setMappings(prev => prev.map(mapping => mapping.variable_name === variableName ? { ...mapping, source_type, source_field, static_value: source_type === 'static' ? mapping.static_value || '' : undefined } : mapping));
  };

  const save = async () => {
    if (unmapped) {
      addToast(`${unmapped} required variables need mapping.`, 'error');
      return;
    }
    setSaving(true);
    try {
      if (purpose) await api.updateEmailTemplatePurpose(templateId, purpose);
      const updated = await api.updateEmailTemplateMappings(templateId, mappings);
      setTemplate(updated);
      addToast('Template mapping saved', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to save mapping', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async (event: React.FormEvent) => {
    event.preventDefault();
    setSendingTest(true);
    try {
      await api.sendEmailTemplateTest(templateId, testRecipient);
      setTestOpen(false);
      addToast('Test email sent successfully', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Test email failed.', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) return <div className="h-64 rounded-lg bg-hover-app/50 animate-pulse" />;
  if (!template) return <div className="rounded-lg border border-border-app bg-surface-app p-10 text-center text-sm text-text-secondary">Template not found.</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigateTo('/email/templates')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to templates
      </button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-text-primary">{template.name}</h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-400">{template.status || 'Published'}</span>
          </div>
          <p className="text-xs text-text-secondary mt-2">Resend Template ID</p>
          <p className="text-sm font-mono text-text-primary mt-1">{template.provider_template_id || template.resend_template_id || 'Not available'}</p>
        </div>
        <button onClick={() => setTestOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border-app px-3 py-2 text-xs font-semibold hover:bg-hover-app">
          <Send className="w-3.5 h-3.5" />
          Send Test Email
        </button>
      </div>

      <section className="rounded-lg border border-border-app bg-surface-app p-5 space-y-3">
        <h2 className="text-sm font-semibold text-text-primary">What should this template be used for?</h2>
        <select value={purpose} onChange={event => setPurpose(event.target.value)} className="w-full max-w-md rounded-lg border border-border-app bg-hover-app/40 px-3 py-2 text-sm outline-none">
          <option value="">Not assigned</option>
          {purposes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </section>

      <section className="rounded-lg border border-border-app bg-surface-app p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Template Variables</h2>
          <p className="text-xs text-text-secondary mt-1">Connect your Resend template variables to data stored in Chaibytes.</p>
        </div>

        {unmapped > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            {unmapped} variables still need mapping.
          </div>
        )}

        {mappings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-app p-8 text-center text-sm text-text-secondary">No variables detected for this template.</div>
        ) : (
          <div className="space-y-3">
            {mappings.map(mapping => (
              <div key={mapping.variable_name} className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-3 rounded-lg border border-border-app p-4">
                <div>
                  <span className="block text-sm font-semibold text-text-primary">{mapping.variable_name}</span>
                  <span className="text-xs text-text-secondary">Map value from</span>
                </div>
                <div className="space-y-2">
                  <select value={`${mapping.source_type}:${mapping.source_field}`} onChange={event => updateMapping(mapping.variable_name, event.target.value)} className="w-full rounded-lg border border-border-app bg-hover-app/40 px-3 py-2 text-sm outline-none">
                    <option value="lead:">Select source</option>
                    {groupedOptions.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.fields.map(([field, label]) => <option key={`${group.type}:${field}`} value={`${group.type}:${field}`}>{group.group} → {label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  {mapping.source_type === 'static' && (
                    <input value={mapping.static_value || ''} onChange={event => setMappings(prev => prev.map(item => item.variable_name === mapping.variable_name ? { ...item, static_value: event.target.value } : item))} placeholder="Static value" className="w-full rounded-lg border border-border-app bg-hover-app/40 px-3 py-2 text-sm outline-none" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {purpose === 'LEAD_ACKNOWLEDGEMENT' && (
          <div className="rounded-lg border border-border-app bg-hover-app/20 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-text-primary"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Automation Active</div>
            <div className="mt-3 text-xs text-text-secondary space-y-1">
              <div>New website lead</div>
              <div>↓</div>
              <div>Lead created in Chaibytes</div>
              <div>↓</div>
              <div>Lead Acknowledgement</div>
              <div>↓</div>
              <div>Email sent automatically</div>
            </div>
          </div>
        )}

        <button onClick={save} disabled={saving || unmapped > 0} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-app px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save Mapping'}
        </button>
      </section>

      {testOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={sendTest} className="w-full max-w-md rounded-lg border border-border-app bg-surface-app p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Send Test Email</h2>
              <p className="text-xs text-text-secondary mt-1">Required variables will use sample or resolved values from Chaibytes.</p>
            </div>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-text-secondary">Recipient</span>
              <input type="email" required value={testRecipient} onChange={event => setTestRecipient(event.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-border-app bg-hover-app/40 px-3 py-2 text-sm outline-none" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTestOpen(false)} className="rounded-lg border border-border-app px-3 py-2 text-xs font-semibold hover:bg-hover-app">Cancel</button>
              <button type="submit" disabled={sendingTest} className="rounded-lg bg-primary-app px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{sendingTest ? 'Sending...' : 'Send Test'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
