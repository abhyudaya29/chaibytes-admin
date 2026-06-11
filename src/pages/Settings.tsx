import React, { useState } from 'react';
import { useChai } from '../context/ChaiContext';
import { Sun, Moon, Key, Bell, Cpu, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useChai();

  const [founderName, setFounderName] = useState('Founder, Chaibytes');
  const [founderEmail, setFounderEmail] = useState('founder@chaibytes.com');
  const [apiKey] = useState('cb_live_9a4f8c6e2b10d3f8a5c7e9');
  const [showKey, setShowKey] = useState(false);
  const [notifications, setNotifications] = useState({
    leads: true,
    emails: false,
    campaigns: true
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings successfully updated!');
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold font-heading text-text-primary">System Preferences</h1>
        <p className="text-xs text-text-secondary">Configure profile defaults, API access tokens, and alert channels</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Founder Profile Details */}
        <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-app/40 pb-2 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary-app" />
            <span>Founder Profile</span>
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
        <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-app/40 pb-2 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-primary-app" /> : <Sun className="w-4 h-4 text-primary-app" />}
            <span>Visual Theme Engine</span>
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-semibold text-text-primary">Current Theme: {theme === 'dark' ? 'Midnight Brew' : 'Morning Chai'}</span>
              <span className="block text-[10px] text-text-secondary mt-0.5">Toggle morning/midnight color environments</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg bg-hover-app border border-border-app text-xs font-bold text-text-primary hover:bg-border-app/20 transition-all"
            >
              Toggle Environment
            </button>
          </div>
        </div>

        {/* API Credentials */}
        <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider border-b border-border-app/40 pb-2 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary-app" />
            <span>Developer Credentials</span>
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
        </div>

        {/* Notifications config */}
        <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-4">
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
