import React, { useState } from 'react';
import { useChai } from '../context/ChaiContext';
import { Search, Plus, Mail, Users, FileText, Send, Sparkles, TrendingUp, BarChart3 } from 'lucide-react';

export const Newsletter: React.FC = () => {
  const {
    subscribers,
    addSubscriber,
    campaigns,
    addCampaign,
    sendCampaign,
    isNewCampaignOpen,
    setNewCampaignOpen,
    templates: contextTemplates
  } = useChai();

  const [subSearch, setSubSearch] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubEmail, setNewSubEmail] = useState('');
  const [newSubTags, setNewSubTags] = useState('');
  const [isNewSubOpen, setNewSubOpen] = useState(false);

  // Campaign Form State
  const [campSubject, setCampSubject] = useState('');
  const [campContent, setCampContent] = useState('');
  const [campTemplate, setCampTemplate] = useState('newsletter');

  const defaultTemplates = [
    { id: 'newsletter', name: 'Technical Deep-dive', icon: FileText },
    { id: 'welcome', name: 'Product Update', icon: Sparkles },
    { id: 'proposal', name: 'Weekly Digest', icon: Mail },
  ];

  const combinedCampaignTemplates = [
    ...defaultTemplates,
    ...contextTemplates.map(t => ({
      id: t.resend_template_id,
      name: t.name,
      icon: FileText
    }))
  ];

  const handleAddSubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubEmail) return;

    const parsedTags = newSubTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    addSubscriber(newSubName, newSubEmail, parsedTags);
    setNewSubName('');
    setNewSubEmail('');
    setNewSubTags('');
    setNewSubOpen(false);
  };

  const handleCreateCampaignSubmit = (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    if (!campSubject || !campContent) return;

    addCampaign({
      subject: campSubject,
      content: campContent,
      status: isDraft ? 'draft' : 'sent',
      templateId: campTemplate
    });

    setCampSubject('');
    setCampContent('');
    setNewCampaignOpen(false);
  };

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter(s =>
    s.name.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(subSearch.toLowerCase()) ||
    s.tags.some(t => t.toLowerCase().includes(subSearch.toLowerCase()))
  );

  // Sent Campaigns list
  const sentCampaigns = campaigns.filter(c => c.status === 'sent');
  const avgOpenRate = sentCampaigns.length > 0
    ? (sentCampaigns.reduce((acc, c) => acc + c.openRate, 0) / sentCampaigns.length).toFixed(1)
    : '0';
  const avgClickRate = sentCampaigns.length > 0
    ? (sentCampaigns.reduce((acc, c) => acc + c.clickRate, 0) / sentCampaigns.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">Newsletter Engine</h1>
          <p className="text-xs text-text-secondary">Manage subscribers and deploy campaigns</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setNewSubOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border-app bg-surface-app text-xs font-semibold text-text-primary hover:bg-hover-app transition-colors shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Add Subscriber</span>
          </button>
          <button
            onClick={() => setNewCampaignOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-app text-white dark:text-black text-xs font-bold hover:opacity-90 shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Analytics Rows */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Total Audience', value: subscribers.length, change: '+2 today', icon: Users },
          { label: 'Avg Open Rate', value: `${avgOpenRate}%`, change: 'Top 5% in industry', icon: TrendingUp },
          { label: 'Avg Click Rate', value: `${avgClickRate}%`, change: 'Healthy engagement', icon: BarChart3 },
          { label: 'Total Campaigns', value: campaigns.length, change: '1 draft pending', icon: Mail },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-surface-app border border-border-app p-4.5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">{c.label}</span>
                <span className="block text-xl font-bold font-heading text-text-primary mt-1">{c.value}</span>
                <span className="block text-[10px] text-text-secondary mt-0.5 font-light">{c.change}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-hover-app text-primary-app">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscribers Table Area */}
        <div className="lg:col-span-2 bg-surface-app border border-border-app p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border-app pb-3">
            <h3 className="text-sm font-semibold text-text-primary">Subscribers Registry</h3>
            <div className="flex items-center bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-1 w-56 shadow-sm">
              <Search className="w-3.5 h-3.5 text-text-secondary mr-2" />
              <input
                type="text"
                placeholder="Search email/tags..."
                className="w-full bg-transparent border-none text-[11px] text-text-primary outline-none"
                value={subSearch}
                onChange={e => setSubSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-app/40 text-text-secondary uppercase text-[10px] font-semibold">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Tags</th>
                  <th className="py-2.5">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map(sub => (
                  <tr key={sub.id} className="border-b border-border-app/30 text-text-primary hover:bg-hover-app/20 transition-colors">
                    <td className="py-3 font-semibold">{sub.name}</td>
                    <td className="py-3 font-light text-text-secondary">{sub.email}</td>
                    <td className="py-3">
                      <span className="text-[10px] bg-emerald-500/10 text-success-app border border-emerald-500/25 px-2 py-0.5 rounded-full font-semibold">
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {sub.tags.map((tag, idx) => (
                          <span key={idx} className="text-[9px] bg-hover-app border border-border-app px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 font-light text-text-secondary">{new Date(sub.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Campaigns Panel */}
        <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-app pb-2">Campaign Logs</h3>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {campaigns.map(camp => (
              <div
                key={camp.id}
                className="p-3 border border-border-app/40 rounded-xl bg-hover-app/20 hover:border-accent-app/20 hover:bg-hover-app/40 transition-all space-y-2.5"
              >
                <div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className={`font-semibold uppercase ${camp.status === 'sent' ? 'text-success-app' : 'text-amber-500'}`}>
                      {camp.status}
                    </span>
                    {camp.sentAt && (
                      <span className="text-text-secondary">{new Date(camp.sentAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-text-primary mt-1 line-clamp-1">{camp.subject}</h4>
                </div>

                {camp.status === 'sent' ? (
                  <div className="grid grid-cols-3 gap-2 bg-surface-app border border-border-app/50 p-2 rounded-lg text-center">
                    <div>
                      <span className="text-[9px] text-text-secondary uppercase">Sent</span>
                      <span className="block text-xs font-semibold text-text-primary mt-0.5">{camp.sentCount}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-secondary uppercase">Opens</span>
                      <span className="block text-xs font-semibold text-text-primary mt-0.5">{camp.openRate}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-secondary uppercase">Clicks</span>
                      <span className="block text-xs font-semibold text-text-primary mt-0.5">{camp.clickRate}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] text-text-secondary font-light">Draft campaign ready</span>
                    <button
                      onClick={() => sendCampaign(camp.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-primary-app text-white dark:text-black rounded-lg text-[10px] font-semibold hover:opacity-90 shadow"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Now</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Subscriber Overlay Modal */}
      {isNewSubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewSubOpen(false)} />
          <div className="bg-surface-app border border-border-app rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10">
            <div className="px-5 py-4 border-b border-border-app flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Add Subscriber</h3>
              <button onClick={() => setNewSubOpen(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleAddSubSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alice Dev"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="recipient@domain.dev"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={newSubEmail}
                  onChange={e => setNewSubEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Tags (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. founder, typescript, designs"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={newSubTags}
                  onChange={e => setNewSubTags(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary-app text-white dark:text-black font-semibold text-xs py-2.5 rounded-lg hover:opacity-90 transition-all shadow"
              >
                Register Subscriber
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {isNewCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewCampaignOpen(false)} />
          <div className="bg-surface-app border border-border-app rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden z-10">
            <div className="px-5 py-4 border-b border-border-app flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Create Newsletter Campaign</h3>
              <button onClick={() => setNewCampaignOpen(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>
            <form className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Campaign Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chaibytes #43: Compilers and cardamoms"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={campSubject}
                  onChange={e => setCampSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Visual Theme / Layout</label>
                <div className="grid grid-cols-3 gap-3">
                  {combinedCampaignTemplates.map(t => {
                    const Icon = t.icon;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setCampTemplate(t.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer text-center transition-all ${
                          campTemplate === t.id
                            ? 'bg-primary-app/10 border-primary-app text-primary-app'
                            : 'bg-hover-app/40 border-border-app text-text-secondary hover:bg-hover-app'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-semibold truncate max-w-full">{t.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Campaign Content Body</label>
                <textarea
                  required
                  placeholder="Write your email content..."
                  className="w-full h-40 bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app resize-none"
                  value={campContent}
                  onChange={e => setCampContent(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={(e) => handleCreateCampaignSubmit(e, true)}
                  className="px-3.5 py-2 border border-border-app rounded-lg hover:bg-hover-app text-xs font-semibold text-text-primary"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCreateCampaignSubmit(e, false)}
                  className="px-4 py-2 bg-primary-app text-white dark:text-black rounded-lg text-xs font-bold hover:opacity-90 shadow"
                >
                  Send to {subscribers.length} Subscribers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
