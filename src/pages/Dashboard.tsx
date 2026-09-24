import React from 'react';
import { useChai } from '../context/ChaiContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { PenTool, Mail, Plus, Send, CheckCircle2, ChevronRight, UserPlus, FileCheck, Users, LayoutTemplate } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    blogs,
    subscribers,
    campaigns,
    leads,
    clients,
    emails,
    setComposeOpen,
    setNewBlogOpen,
    setNewCampaignOpen,
    setActiveNav
  } = useChai();

  // Metrics calculations
  const totalBlogs = blogs.length;
  const totalSubscribers = subscribers.length;
  const campaignsSent = campaigns.filter(c => c.status === 'sent').length;
  const openLeads = leads.filter(l => !['closed', 'won', 'lost'].includes(String(l.status))).length;
  const totalClients = clients.length;
  const totalEmails = emails.length;

  // Chart data
  const performanceData = [
    { date: 'June 01', subscribers: 120, openRate: 64 },
    { date: 'June 03', subscribers: 128, openRate: 68 },
    { date: 'June 05', subscribers: 135, openRate: 70 },
    { date: 'June 07', subscribers: 142, openRate: 67 },
    { date: 'June 09', subscribers: 153, openRate: 72 },
    { date: 'June 11', subscribers: 160, openRate: 75 },
  ];

  // Activities log combined
  const activities = [
    { id: '1', text: 'New lead automation queued for website submission', date: '2 hours ago', icon: FileCheck, color: 'text-amber-500 bg-amber-500/10' },
    { id: '2', text: 'Subscriber added from newsletter form', date: '5 hours ago', icon: UserPlus, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: '3', text: 'Resend delivery status updated from webhook', date: '1 day ago', icon: Mail, color: 'text-blue-500 bg-blue-500/10' },
    { id: '4', text: 'Blog draft updated for public website', date: '2 days ago', icon: PenTool, color: 'text-primary-app bg-primary-app/10' },
  ];

  const tasks = [
    { id: 't-1', text: 'Verify Resend sender domain', done: false },
    { id: 't-2', text: 'Map thank-you and follow-up templates', done: false },
    { id: 't-3', text: 'Review newly captured leads', done: true },
    { id: 't-4', text: 'Check bounced or failed messages', done: false },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-text-primary">
            CRM Overview
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Monitor leads, automations, campaigns, and delivery health across your organization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNewBlogOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border-app bg-surface-app text-xs font-semibold text-text-primary hover:bg-hover-app transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Blog</span>
          </button>
          <button
            onClick={() => setComposeOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-app text-white text-xs font-bold hover:opacity-95 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Email</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {[
          { label: 'Open Leads', value: openLeads, change: 'Needs follow-up', nav: 'Contact Leads', icon: Users },
          { label: 'Messages', value: totalEmails, change: 'Delivery events', nav: 'Email Logs', icon: Send },
          { label: 'Subscribers', value: totalSubscribers, change: 'Newsletter audience', nav: 'Subscribers', icon: Mail },
          { label: 'Campaigns', value: campaignsSent, change: 'Sent campaigns', nav: 'Subscribers', icon: LayoutTemplate },
          { label: 'Clients', value: totalClients, change: 'Active accounts', nav: 'Clients', icon: FileCheck },
          { label: 'Content', value: totalBlogs, change: 'Blog resources', nav: 'Blogs', icon: PenTool },
        ].map((item, idx) => (
          <div
            key={idx}
            onClick={() => setActiveNav(item.nav)}
            className="bg-surface-app border border-border-app p-4 rounded-lg hover:border-primary-app/35 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary font-semibold uppercase tracking-wider">{item.label}</span>
              <item.icon className="w-4 h-4 text-text-secondary" />
            </div>
            <span className="block mt-4 text-2xl font-bold font-heading text-text-primary">{item.value}</span>
            <span className="block text-xs text-text-secondary mt-1">{item.change}</span>
          </div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-app border border-border-app p-5 rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Audience & Email Performance</h3>
              <p className="text-xs text-text-secondary">Subscriber growth and engagement trend</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-app block"></span>
                <span className="text-text-secondary font-medium">Subscribers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-app block"></span>
                <span className="text-text-secondary font-medium">Open Rate %</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-app)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--primary-app)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOpen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-app)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--accent-app)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-app)',
                    borderColor: 'var(--border-app)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="subscribers" stroke="var(--primary-app)" strokeWidth={2} fillOpacity={1} fill="url(#colorSubs)" />
                <Area type="monotone" dataKey="openRate" stroke="var(--accent-app)" strokeWidth={2} fillOpacity={1} fill="url(#colorOpen)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick actions panel */}
        <div className="bg-surface-app border border-border-app p-5 rounded-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Quick Actions</h3>
            <p className="text-xs text-text-secondary mb-4">Common setup and CRM workflows</p>
            <div className="space-y-2.5">
              {[
                { title: 'Create campaign', desc: 'Draft subscriber announcement', action: () => setNewCampaignOpen(true), icon: Mail },
                { title: 'Send manual email', desc: 'Open compose modal', action: () => setComposeOpen(true), icon: Send },
                { title: 'Review leads', desc: 'Open CRM lead pipeline', action: () => setActiveNav('Contact Leads'), icon: FileCheck },
                { title: 'Write content', desc: 'Create a public website blog', action: () => setNewBlogOpen(true), icon: PenTool },
              ].map((act, index) => {
                const Icon = act.icon;
                return (
                  <div
                    key={index}
                    onClick={act.action}
                    className="flex items-center justify-between p-3 rounded-lg border border-border-app/60 hover:bg-hover-app hover:border-primary-app/25 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-hover-app text-primary-app">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-text-primary">{act.title}</h4>
                        <p className="text-[10px] text-text-secondary">{act.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-text-secondary group-hover:translate-x-0.5 transition-transform" />
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] text-text-secondary bg-hover-app/40 px-3 py-2 rounded-lg border border-border-app/40 mt-4 text-center">
            Press <kbd className="bg-surface-app border border-border-app px-1 py-0.5 rounded font-mono">⌘K</kbd> to search workspace actions.
          </div>
        </div>
      </div>

      {/* Grid of Activites and Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activities */}
        <div className="bg-surface-app border border-border-app p-5 rounded-lg">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Recent Activity</h3>
          <p className="text-xs text-text-secondary mb-5">Audit log of latest workspace events</p>
          <div className="space-y-4">
            {activities.map(act => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex items-start justify-between text-xs">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${act.color} mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{act.text}</p>
                      <span className="text-[10px] text-text-secondary block mt-0.5">{act.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending tasks list */}
        <div className="bg-surface-app border border-border-app p-5 rounded-lg">
          <h3 className="text-sm font-semibold text-text-primary mb-1">Setup Checklist</h3>
          <p className="text-xs text-text-secondary mb-5">Recommended steps before going live</p>
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-hover-app/30 border border-transparent hover:border-border-app/20 transition-all">
                <div className="flex items-center gap-3">
                  <button className="text-text-secondary hover:text-success-app transition-colors">
                    {task.done ? (
                      <CheckCircle2 className="w-4 h-4 text-success-app fill-success-app/10" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-text-secondary block" />
                    )}
                  </button>
                  <span className={`text-xs ${task.done ? 'line-through text-text-secondary' : 'text-text-primary font-medium'}`}>
                    {task.text}
                  </span>
                </div>
                {!task.done && (
                  <span className="text-[10px] bg-primary-app/10 text-primary-app font-semibold px-2 py-0.5 rounded-full">
                    High
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
