import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCcw } from 'lucide-react';
import { api } from '../services/api';
import type { ResendIntegration, SyncedEmailTemplate } from '../services/api';
import { navigateTo } from '../utils/navigation';
import { useChai } from '../context/ChaiContext';

export const EmailTemplates: React.FC = () => {
  const { addToast } = useChai();
  const [integration, setIntegration] = useState<ResendIntegration | null>(null);
  const [templates, setTemplates] = useState<SyncedEmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [integrationData, templateRows] = await Promise.all([
        api.getResendIntegration().catch(() => ({ configured: false })),
        api.getEmailTemplates().catch(() => []),
      ]);
      setIntegration(integrationData);
      setTemplates(templateRows);
      const newestSync = templateRows.map(template => template.last_synced_at).filter(Boolean)[0];
      if (newestSync) setLastSynced(new Date(newestSync).toLocaleString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const result = await api.syncEmailTemplates();
      const count = result.synced ?? result.count ?? result.templates?.length ?? 0;
      addToast(`${count} templates synced`, 'success');
      await load();
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Unable to sync templates. Try again.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const connected = Boolean(integration?.configured || integration?.status === 'connected');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">Email Templates</h1>
          <p className="text-sm text-text-secondary mt-1">Templates are synced directly from your connected Resend account.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastSynced && <span className="text-xs text-text-secondary">Last synced {lastSynced}</span>}
          <button onClick={sync} disabled={!connected || syncing} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-app px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
            <RefreshCcw className="w-3.5 h-3.5" />
            {syncing ? 'Syncing templates...' : 'Sync Templates'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{[1, 2, 3, 4].map(item => <div key={item} className="h-36 rounded-lg bg-hover-app/50 animate-pulse" />)}</div>
      ) : !connected ? (
        <div className="rounded-lg border border-dashed border-border-app bg-surface-app p-12 text-center">
          <p className="text-sm font-semibold text-text-primary">Connect Resend to start syncing your email templates.</p>
          <p className="text-xs text-text-secondary mt-1">Once connected, templates from Resend will appear here.</p>
          <button onClick={() => navigateTo('/settings/integrations')} className="mt-4 rounded-lg bg-primary-app px-4 py-2 text-xs font-semibold text-white">Connect Resend</button>
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-app bg-surface-app p-12 text-center">
          <p className="text-sm font-semibold text-text-primary">No templates were found in your Resend account.</p>
          <p className="text-xs text-text-secondary mt-1">Create a template in Resend and sync again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {templates.map(template => {
            const variables = template.required_variables || template.variables || [];
            const mappingComplete = template.mapping_complete ?? variables.every(variable => template.variable_mappings?.[variable] || template.mappings?.some(mapping => mapping.variable_name === variable));
            return (
              <article key={template.id} className="rounded-lg border border-border-app bg-surface-app p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary">{template.name}</h2>
                    <p className="text-xs text-text-secondary mt-1">Used for {template.template_type || 'Not assigned'}</p>
                  </div>
                  <StatusBadge label={template.status || 'Published'} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Info label="Variables" value={String(variables.length)} />
                  <Info label="Last synced" value={template.last_synced_at ? new Date(template.last_synced_at).toLocaleString() : '-'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${mappingComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {mappingComplete ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {mappingComplete ? 'Mapping Complete' : 'Mapping Required'}
                  </span>
                  <button onClick={() => navigateTo(`/email/templates/${template.id}`)} className="rounded-lg border border-border-app px-3 py-2 text-xs font-semibold hover:bg-hover-app">
                    Configure
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border-app bg-hover-app/20 p-3">
    <span className="block text-text-secondary">{label}</span>
    <span className="block mt-1 font-semibold text-text-primary">{value}</span>
  </div>
);

const StatusBadge = ({ label }: { label: string }) => {
  const unavailable = label.toLowerCase().includes('unavailable');
  const draft = label.toLowerCase().includes('draft');
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${unavailable ? 'bg-red-500/10 text-red-400' : draft ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{label}</span>;
};
