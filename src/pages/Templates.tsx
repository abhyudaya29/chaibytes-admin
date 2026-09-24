import React, { useEffect, useState } from 'react';
import { Bot, Clock, Edit3, FileText, Info, Plus, Save, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { api } from '../services/api';
import type { CrmEmailAutomation, CrmEmailTemplate } from '../services/api';
import { useChai } from '../context/ChaiContext';

const emptyTemplate = {
  name: '',
  resend_template_id: '',
  template_type: 'new_lead_thank_you',
  variable_mappings: {} as Record<string, string>,
  is_active: true,
};

const emptyAutomation = {
  name: '',
  trigger: 'new_lead',
  template_id: '',
  delay_minutes: 0,
  is_active: true,
};

const leadVariableFields = ['name', 'email', 'phone', 'source', 'lead_id'];

export const Templates: React.FC = () => {
  const { addToast } = useChai();
  const [templates, setTemplates] = useState<CrmEmailTemplate[]>([]);
  const [automations, setAutomations] = useState<CrmEmailAutomation[]>([]);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [automationForm, setAutomationForm] = useState(emptyAutomation);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingAutomationId, setEditingAutomationId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [newMapping, setNewMapping] = useState({ resendVariable: '', leadField: 'name' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [templateRows, automationRows] = await Promise.all([
        api.getCrmTemplates(true),
        api.getCrmAutomations(),
      ]);
      setTemplates(templateRows);
      setAutomations(automationRows);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to load CRM email setup', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const cleanedMappings = Object.fromEntries(
        Object.entries(templateForm.variable_mappings).filter(([key, value]) => key.trim() && value.trim())
      );
      const payload = {
        ...templateForm,
        variable_mappings: cleanedMappings,
      };
      const saved = editingTemplateId
        ? await api.updateCrmTemplate(editingTemplateId, payload)
        : await api.createCrmTemplate(payload);
      setTemplates(prev => editingTemplateId ? prev.map(item => item.id === saved.id ? saved : item) : [saved, ...prev]);
      setTemplateForm(emptyTemplate);
      setEditingTemplateId(null);
      setNewMapping({ resendVariable: '', leadField: 'name' });
      addToast('Email template saved', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to save template', 'error');
    }
  };

  const handleSaveAutomation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!automationForm.template_id) return;
    try {
      const saved = editingAutomationId
        ? await api.updateCrmAutomation(editingAutomationId, automationForm)
        : await api.createCrmAutomation(automationForm);
      setAutomations(prev => editingAutomationId ? prev.map(item => item.id === saved.id ? saved : item) : [saved, ...prev]);
      setAutomationForm(emptyAutomation);
      setEditingAutomationId(null);
      addToast('Automation saved', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to save automation', 'error');
    }
  };

  const filteredTemplates = templates.filter(template => {
    const needle = search.toLowerCase();
    return template.name.toLowerCase().includes(needle) || template.resend_template_id.toLowerCase().includes(needle) || template.template_type.toLowerCase().includes(needle);
  });

  const addVariableMapping = () => {
    const key = newMapping.resendVariable.trim().replace(/^\{\{|\}\}$/g, '');
    if (!key) return;
    setTemplateForm(prev => ({
      ...prev,
      variable_mappings: {
        ...prev.variable_mappings,
        [key]: newMapping.leadField,
      },
    }));
    setNewMapping({ resendVariable: '', leadField: 'name' });
  };

  const removeVariableMapping = (key: string) => {
    setTemplateForm(prev => {
      const nextMappings = { ...prev.variable_mappings };
      delete nextMappings[key];
      return { ...prev, variable_mappings: nextMappings };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">CRM Email Templates</h1>
          <p className="text-xs text-text-secondary">Map Resend templates to Chaibytes automations without editing email HTML here</p>
        </div>
        <div className="flex items-center bg-surface-app border border-border-app rounded-lg px-3 py-2 w-full lg:w-80 ">
          <Search className="w-4 h-4 text-text-secondary mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search templates"
            className="w-full bg-transparent border-none text-xs text-text-primary outline-none"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] gap-6">
        <section className="space-y-4">
          <form onSubmit={handleSaveTemplate} className="bg-surface-app border border-border-app rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-app/50 pb-3">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-app" />
                {editingTemplateId ? 'Edit Resend Mapping' : 'New Resend Mapping'}
              </h2>
              {editingTemplateId && (
                <button type="button" onClick={() => { setEditingTemplateId(null); setTemplateForm(emptyTemplate); }} className="text-xs text-text-secondary hover:text-text-primary">
                  Clear
                </button>
              )}
            </div>
            <div className="flex gap-3 rounded-lg border border-primary-app/20 bg-primary-app/10 p-3 text-xs text-text-secondary">
              <Info className="w-4 h-4 shrink-0 text-primary-app mt-0.5" />
              <p>Create and edit the actual email content in Resend. Paste the Resend Template ID here so Chaibytes can use it in automations.</p>
            </div>
            <div className="rounded-lg border border-border-app bg-hover-app/20 p-3 text-xs text-text-secondary">
              Default variables are sent automatically: <span className="font-mono text-text-primary">{'{{name}} {{email}} {{phone}} {{source}} {{lead_id}}'}</span>. Add mappings only when your Resend template uses custom names like <span className="font-mono text-text-primary">{'{{client_name}}'}</span>.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-text-secondary">Template Name</span>
                <input required value={templateForm.name} onChange={event => setTemplateForm({ ...templateForm, name: event.target.value })} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-app" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-text-secondary">Resend Template ID</span>
                <input required value={templateForm.resend_template_id} onChange={event => setTemplateForm({ ...templateForm, resend_template_id: event.target.value })} placeholder="tmpl_xxxxxxxxx" className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-accent-app" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-text-secondary">Template Type</span>
                <select value={templateForm.template_type} onChange={event => setTemplateForm({ ...templateForm, template_type: event.target.value })} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="new_lead_thank_you">new_lead_thank_you</option>
                  <option value="lead_followup">lead_followup</option>
                  <option value="booking_followup">booking_followup</option>
                  <option value="newsletter_welcome">newsletter_welcome</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-text-secondary">Status</span>
                <button type="button" onClick={() => setTemplateForm({ ...templateForm, is_active: !templateForm.is_active })} className="w-full flex items-center justify-between bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm">
                  <span>{templateForm.is_active ? 'Active' : 'Inactive'}</span>
                  {templateForm.is_active ? <ToggleRight className="w-5 h-5 text-success-app" /> : <ToggleLeft className="w-5 h-5 text-text-secondary" />}
                </button>
              </label>
            </div>
            <div className="space-y-3 border-t border-border-app/50 pt-4">
              <div>
                <h3 className="text-xs font-semibold text-text-primary">Variable Mappings</h3>
                <p className="text-[10px] text-text-secondary mt-1">Map custom Resend variables to Chaibytes lead fields.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_180px_90px] gap-3">
                <input
                  value={newMapping.resendVariable}
                  onChange={event => setNewMapping({ ...newMapping, resendVariable: event.target.value })}
                  placeholder="Resend variable, e.g. client_name"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-accent-app"
                />
                <select
                  value={newMapping.leadField}
                  onChange={event => setNewMapping({ ...newMapping, leadField: event.target.value })}
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none"
                >
                  {leadVariableFields.map(field => <option key={field} value={field}>{field}</option>)}
                </select>
                <button type="button" onClick={addVariableMapping} className="rounded-lg border border-border-app text-xs font-semibold hover:bg-hover-app">
                  Add
                </button>
              </div>
              {Object.keys(templateForm.variable_mappings).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(templateForm.variable_mappings).map(([resendVariable, leadField]) => (
                    <div key={resendVariable} className="flex items-center justify-between gap-3 rounded-lg border border-border-app bg-surface-app px-3 py-2 text-xs">
                      <span className="font-mono text-text-primary">{`{{${resendVariable}}}`}</span>
                      <span className="text-text-secondary">gets lead</span>
                      <select
                        value={leadField}
                        onChange={event => setTemplateForm(prev => ({
                          ...prev,
                          variable_mappings: {
                            ...prev.variable_mappings,
                            [resendVariable]: event.target.value,
                          },
                        }))}
                        className="bg-hover-app/40 border border-border-app rounded px-2 py-1 text-xs outline-none"
                      >
                        {leadVariableFields.map(field => <option key={field} value={field}>{field}</option>)}
                      </select>
                      <button type="button" onClick={() => removeVariableMapping(resendVariable)} className="text-red-400 hover:text-red-500">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Variables and content are managed inside the Resend template.</span>
              <button type="submit" className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold shadow hover:opacity-90">
                <Save className="w-3.5 h-3.5" />
                Save Mapping
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="md:col-span-2 text-xs text-text-secondary py-8">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="md:col-span-2 py-12 text-center bg-surface-app border border-border-app rounded-lg text-xs text-text-secondary">No CRM templates found</div>
            ) : filteredTemplates.map(template => (
              <article key={template.id} className="bg-surface-app border border-border-app rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{template.name}</h3>
                    <p className="text-xs text-text-secondary mt-1 font-mono">{template.resend_template_id}</p>
                  </div>
                  <button type="button" title="Edit template mapping" onClick={() => { setEditingTemplateId(template.id); setTemplateForm({ name: template.name, resend_template_id: template.resend_template_id, template_type: template.template_type, variable_mappings: template.variable_mappings || {}, is_active: template.is_active }); }} className="p-2 rounded-lg border border-border-app hover:bg-hover-app">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-1 rounded bg-hover-app border border-border-app text-text-secondary">{template.template_type}</span>
                  <span className={`px-2 py-1 rounded border ${template.is_active ? 'text-success-app border-success-app/30 bg-success-app/10' : 'text-text-secondary border-border-app bg-hover-app'}`}>
                    {template.is_active ? 'active' : 'inactive'}
                  </span>
                  {template.variable_mappings && Object.keys(template.variable_mappings).length > 0 && (
                    <span className="px-2 py-1 rounded bg-primary-app/10 border border-primary-app/20 text-primary-app">
                      {Object.keys(template.variable_mappings).length} mappings
                    </span>
                  )}
                </div>
                {template.variable_mappings && Object.keys(template.variable_mappings).length > 0 && (
                  <div className="border-t border-border-app/50 pt-2 space-y-1">
                    {Object.entries(template.variable_mappings).map(([resendVariable, leadField]) => (
                      <div key={resendVariable} className="flex items-center justify-between text-[10px] text-text-secondary">
                        <span className="font-mono">{`{{${resendVariable}}}`}</span>
                        <span>{leadField}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <form onSubmit={handleSaveAutomation} className="bg-surface-app border border-border-app rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-app/50 pb-3">
              <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary-app" />
                {editingAutomationId ? 'Edit Automation' : 'New Automation'}
              </h2>
              <button type="button" onClick={() => { setAutomationForm({ name: 'New lead thank-you', trigger: 'new_lead', template_id: templates[0]?.id || '', delay_minutes: 0, is_active: true }); }} className="flex items-center gap-1 text-xs text-primary-app font-semibold">
                <Plus className="w-3.5 h-3.5" />
                Quick Fill
              </button>
            </div>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-text-secondary">Name</span>
              <input required value={automationForm.name} onChange={event => setAutomationForm({ ...automationForm, name: event.target.value })} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-app" />
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-text-secondary">Template</span>
              <select required value={automationForm.template_id} onChange={event => setAutomationForm({ ...automationForm, template_id: event.target.value })} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none">
                <option value="">Select template</option>
                {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-text-secondary">Trigger</span>
                <select value={automationForm.trigger} onChange={event => setAutomationForm({ ...automationForm, trigger: event.target.value })} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none">
                  <option value="new_lead">new_lead</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-text-secondary">Delay Minutes</span>
                <input type="number" min={0} required value={automationForm.delay_minutes} onChange={event => setAutomationForm({ ...automationForm, delay_minutes: Number(event.target.value) })} className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm outline-none focus:border-accent-app" />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Immediate', value: 0 },
                { label: '24 hours', value: 1440 },
                { label: '3 days', value: 4320 },
              ].map(delay => (
                <button key={delay.value} type="button" onClick={() => setAutomationForm({ ...automationForm, delay_minutes: delay.value })} className={`rounded-lg border px-2 py-2 text-[10px] font-semibold ${automationForm.delay_minutes === delay.value ? 'border-primary-app text-primary-app bg-primary-app/10' : 'border-border-app text-text-secondary hover:bg-hover-app'}`}>
                  {delay.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <input type="checkbox" checked={automationForm.is_active} onChange={event => setAutomationForm({ ...automationForm, is_active: event.target.checked })} />
                Active
              </label>
              <button type="submit" className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold shadow hover:opacity-90">
                <Save className="w-3.5 h-3.5" />
                Save Automation
              </button>
            </div>
          </form>

          <div className="bg-surface-app border border-border-app rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-text-primary">Lead Automations</h3>
            {automations.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-secondary">No automations configured</div>
            ) : automations.map(automation => {
              const template = templates.find(item => item.id === automation.template_id);
              return (
                <div key={automation.id} className="border border-border-app rounded-lg p-3 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-bold text-text-primary">{automation.name}</span>
                      <p className="text-text-secondary mt-1">{template?.name || automation.template_id}</p>
                    </div>
                    <button type="button" title="Edit automation" onClick={() => { setEditingAutomationId(automation.id); setAutomationForm({ name: automation.name, trigger: automation.trigger, template_id: automation.template_id, delay_minutes: automation.delay_minutes, is_active: automation.is_active }); }} className="p-1.5 rounded border border-border-app hover:bg-hover-app">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-text-secondary">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {automation.delay_minutes} min</span>
                    <span className="flex items-center gap-1">{automation.is_active ? <ToggleRight className="w-4 h-4 text-success-app" /> : <ToggleLeft className="w-4 h-4" />} {automation.is_active ? 'active' : 'paused'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
