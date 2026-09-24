import React, { useEffect, useState } from 'react';
import { useChai } from '../context/ChaiContext';
import { Sun, Moon, Key, Bell, Cpu, Save } from 'lucide-react';
import { api } from '../services/api';
import type { CrmEmailConfig } from '../services/api';

export const Settings: React.FC = () => {
  const { theme, toggleTheme, addToast } = useChai();

  const [founderName, setFounderName] = useState('Chaibytes Admin');
  const [founderEmail, setFounderEmail] = useState('founder@chaibytes.com');
  const [apiKey] = useState('cb_live_9a4f8c6e2b10d3f8a5c7e9');
  const [showKey, setShowKey] = useState(false);
  const [crmToken, setCrmToken] = useState(() => api.getCrmAccessToken());
  const [crmLogin, setCrmLogin] = useState({ email: '', password: '' });
  const [emailConfig, setEmailConfig] = useState<CrmEmailConfig>({
    provider: 'resend' as const,
    api_key: '',
    from_email: '',
    from_name: '',
    reply_to: '',
    sending_domain: '',
    status: 'active' as const,
  });
  const [notifications, setNotifications] = useState({
    leads: true,
    emails: false,
    campaigns: true
  });

  useEffect(() => {
    api.getCrmEmailConfig()
      .then(config => {
        if (!config) return;
        setEmailConfig(prev => ({
          ...prev,
          from_email: config.from_email || '',
          from_name: config.from_name || '',
          reply_to: config.reply_to || '',
          sending_domain: config.sending_domain || '',
          status: config.status || 'active',
        }));
      })
      .catch(() => undefined);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings successfully updated!');
  };

  const handleTokenSave = () => {
    api.setCrmAccessToken(crmToken);
    addToast('CRM access token saved', 'success');
  };

  const handleLogin = async () => {
    try {
      const result = await api.loginCrm(crmLogin.email, crmLogin.password);
      setCrmToken(result.access_token || result.token || '');
      addToast('Logged in to CRM API', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'CRM login failed', 'error');
    }
  };

  const handleSaveEmailConfig = async () => {
    try {
      await api.saveCrmEmailConfig(emailConfig);
      setEmailConfig(prev => ({ ...prev, api_key: '' }));
      addToast('Resend email config saved', 'success');
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Failed to save email config', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-heading text-text-primary">Settings</h1>
        <p className="text-xs text-text-secondary">Configure account details, API access, email configuration, and notifications</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Admin Profile Details */}
        <div className="bg-surface-app border border-border-app p-5 rounded-lg space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-app/40 pb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary-app" />
            <span>Admin Profile</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Display Name</label>
              <input
                type="text"
                required
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                value={founderName}
                onChange={e => setFounderName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Correspondence Email</label>
              <input
                type="email"
                required
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                value={founderEmail}
                onChange={e => setFounderEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Theme customization */}
        <div className="bg-surface-app border border-border-app p-5 rounded-lg space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-app/40 pb-2 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-primary-app" /> : <Sun className="w-4 h-4 text-primary-app" />}
            <span>Appearance</span>
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-text-primary">Current Theme: {theme === 'dark' ? 'Dark mode' : 'Light mode'}</span>
              <span className="block text-[10px] text-text-secondary mt-0.5">Switch between light and dark workspace themes</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg bg-hover-app border border-border-app text-xs font-bold text-text-primary hover:bg-border-app/20 transition-all"
            >
              Toggle Theme
            </button>
          </div>
        </div>

        {/* API Credentials */}
        <div className="bg-surface-app border border-border-app p-5 rounded-lg space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-app/40 pb-2 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary-app" />
            <span>API Credentials</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Chaibytes API Access Token</label>
            <div className="flex gap-3">
              <input
                type={showKey ? 'text' : 'password'}
                readOnly
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none font-mono"
                value={apiKey}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-2 rounded-lg border border-border-app bg-surface-app text-xs font-semibold text-text-primary hover:bg-hover-app"
              >
                {showKey ? 'Hide' : 'Reveal'}
              </button>
            </div>
          </div>

          <div className="border-t border-border-app/40 pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="CRM login email"
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none"
                value={crmLogin.email}
                onChange={e => setCrmLogin({ ...crmLogin, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="CRM password"
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none"
                value={crmLogin.password}
                onChange={e => setCrmLogin({ ...crmLogin, password: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={handleLogin}
              className="px-3 py-2 rounded-lg border border-border-app bg-surface-app text-xs font-semibold text-text-primary hover:bg-hover-app"
            >
              Login and Store CRM Token
            </button>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">CRM Bearer Token</label>
              <div className="flex gap-3">
                <input
                  type="password"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none font-mono"
                  value={crmToken}
                  onChange={e => setCrmToken(e.target.value)}
                  placeholder="Paste access_token from /auth/login"
                />
                <button
                  type="button"
                  onClick={handleTokenSave}
                  className="px-3 py-2 rounded-lg border border-border-app bg-surface-app text-xs font-semibold text-text-primary hover:bg-hover-app"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CRM email provider */}
        <div className="bg-surface-app border border-border-app p-5 rounded-lg space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-app/40 pb-2 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary-app" />
            <span>CRM Resend Configuration</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Resend API Key</label>
              <input
                type="password"
                placeholder="re_xxxxxxxxxxxxxxxxx"
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                value={emailConfig.api_key}
                onChange={e => setEmailConfig({ ...emailConfig, api_key: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Status</label>
              <select
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
                value={emailConfig.status}
                onChange={e => setEmailConfig({ ...emailConfig, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">From Email</label>
              <input
                type="email"
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                value={emailConfig.from_email}
                onChange={e => setEmailConfig({ ...emailConfig, from_email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">From Name</label>
              <input
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                value={emailConfig.from_name}
                onChange={e => setEmailConfig({ ...emailConfig, from_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Reply To</label>
              <input
                type="email"
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                value={emailConfig.reply_to}
                onChange={e => setEmailConfig({ ...emailConfig, reply_to: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Sending Domain</label>
              <input
                className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                value={emailConfig.sending_domain}
                onChange={e => setEmailConfig({ ...emailConfig, sending_domain: e.target.value })}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveEmailConfig}
            className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black font-semibold text-xs px-5 py-2.5 rounded-lg hover:opacity-95 shadow transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Resend Config</span>
          </button>
        </div>

        {/* Notifications config */}
        <div className="bg-surface-app border border-border-app p-5 rounded-lg space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-app/40 pb-2 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-app" />
            <span>Alerts & Notifications</span>
          </h3>

          <div className="space-y-3">
            {[
              { id: 'leads', label: 'New Lead Alerts', desc: 'Notify immediately on contact form submission events', val: notifications.leads },
              { id: 'emails', label: 'Email Read Receipts', desc: 'Receive alert when client views dispatched emails', val: notifications.emails },
              { id: 'campaigns', label: 'Campaign Milestones', desc: 'Notify when newsletter campaign analytics reach 50% open rate', val: notifications.campaigns },
            ].map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div>
                  <span className="block font-semibold text-text-primary">{item.label}</span>
                  <span className="block text-[10px] text-text-secondary font-light mt-0.5">{item.desc}</span>
                </div>
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={() => {
                    setNotifications({
                      ...notifications,
                      [item.id]: !notifications[item.id as keyof typeof notifications]
                    });
                  }}
                  className="rounded border-border-app text-primary-app focus:ring-primary-app/25 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black font-semibold text-xs px-5 py-2.5 rounded-lg hover:opacity-95 shadow transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
