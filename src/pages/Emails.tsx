import React from 'react';
import { useChai } from '../context/ChaiContext';
import { Send, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export const Emails: React.FC = () => {
  const { emails, setComposeOpen, setComposeInitialTo } = useChai();

  const presets = [
    {
      title: 'Follow up Proposal',
      subject: 'Reviewing proposal details',
      desc: 'Follow up on the sent estimate document.',
      to: 'elena@soliditylabs.org'
    },
    {
      title: 'Discovery Scheduling',
      subject: 'Finding a time to connect',
      desc: 'Suggest meeting link to new leads.',
      to: 'marcus@infraflow.tech'
    },
    {
      title: 'Monthly Retainer Report',
      subject: 'Chaibytes Monthly Retainer Update',
      desc: 'Status report detailing hours and milestones.',
      to: 'ada@analytical.engine'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">Email Outreach</h1>
          <p className="text-xs text-text-secondary">Send dedicated correspondence and audit delivery logs</p>
        </div>
        <button
          onClick={() => {
            setComposeInitialTo('');
            setComposeOpen(true);
          }}
          className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 shadow transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Compose Email</span>
        </button>
      </div>

      {/* Preset templates list */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Quick Preset Dispatches</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {presets.map((p, idx) => (
            <div
              key={idx}
              onClick={() => {
                setComposeInitialTo(p.to);
                setComposeOpen(true);
              }}
              className="bg-surface-app border border-border-app p-4 rounded-xl hover:border-accent-app/30 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <h4 className="text-xs font-bold text-text-primary group-hover:text-primary-app transition-colors">{p.title}</h4>
                <p className="text-[10px] text-text-secondary mt-1 line-clamp-2">{p.desc}</p>
              </div>
              <div className="border-t border-border-app/40 pt-2.5 mt-3 flex items-center justify-between text-[10px] text-text-secondary">
                <span>To: {p.to}</span>
                <span className="text-primary-app font-medium group-hover:translate-x-0.5 transition-transform">Use →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email delivery logs list */}
      <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-4">
        <h3 className="text-sm font-semibold text-text-primary border-b border-border-app pb-3">Delivery Logs</h3>
        
        <div className="space-y-4">
          {emails.length === 0 ? (
            <div className="py-12 text-center text-text-secondary text-xs font-light">
              No emails sent yet
            </div>
          ) : (
            emails.map(log => {
              const isSent = log.status === 'sent';
              const isScheduled = log.status === 'scheduled';
              
              return (
                <div key={log.id} className="flex items-start justify-between border-b border-border-app/30 pb-3 last:border-0 last:pb-0">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 ${
                      isSent ? 'bg-emerald-500/10 text-success-app' : isScheduled ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {isSent ? <CheckCircle2 className="w-4 h-4" /> : isScheduled ? <Clock className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">{log.subject}</span>
                        <span className="text-[9px] bg-hover-app border border-border-app px-2 py-0.5 rounded text-text-secondary font-mono">
                          to: {log.to}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-1 font-light">{log.content}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-text-secondary whitespace-nowrap mt-1 font-light">
                    {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
