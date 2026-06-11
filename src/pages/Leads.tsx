import React, { useState } from 'react';
import type { Lead } from '../context/ChaiContext';
import { useChai } from '../context/ChaiContext';
import { Plus, MessageSquare, Phone, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';

export const Leads: React.FC = () => {
  const {
    leads,
    addLead,
    updateLeadStatus,
    addLeadNote,
    setComposeOpen,
    setComposeInitialTo
  } = useChai();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isNewLeadOpen, setNewLeadOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Contact Form');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const stages: Lead['status'][] = ['new', 'discovery', 'proposal', 'won'];

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    addLead({
      name,
      email,
      company,
      phone,
      source,
      tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      notes,
      status: 'new'
    });

    // Reset
    setName('');
    setEmail('');
    setCompany('');
    setPhone('');
    setTags('');
    setNotes('');
    setNewLeadOpen(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText || !selectedLead) return;

    addLeadNote(selectedLead.id, noteText);
    
    // Update active selected display
    const updated = leads.find(l => l.id === selectedLead.id);
    if (updated) {
      setSelectedLead(updated);
    }
    setNoteText('');
  };

  // Helper for rendering status labels
  const getStageHeader = (stage: Lead['status']) => {
    switch (stage) {
      case 'new': return { label: 'New Inbox', color: 'border-blue-500 text-blue-500 bg-blue-500/5' };
      case 'discovery': return { label: 'Discovery Session', color: 'border-purple-500 text-purple-500 bg-purple-500/5' };
      case 'proposal': return { label: 'Proposal Sent', color: 'border-amber-500 text-amber-500 bg-amber-500/5' };
      case 'won': return { label: 'Won / Client Conversion', color: 'border-emerald-500 text-emerald-500 bg-emerald-500/5' };
      default: return { label: 'Inbox', color: 'border-gray-500 text-gray-500 bg-gray-500/5' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">Outreach Pipeline</h1>
          <p className="text-xs text-text-secondary">Convert contact form submissions and discovery request leads</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setNewLeadOpen(true)}
            className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Manual Lead</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Kanban + Inspector Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Kanban Board columns */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-5 ${selectedLead ? 'xl:col-span-3' : 'xl:col-span-4'}`}>
          {stages.map(stage => {
            const stageLeads = leads.filter(l => l.status === stage);
            const header = getStageHeader(stage);
            return (
              <div key={stage} className="space-y-4">
                {/* Column Header */}
                <div className={`flex items-center justify-between border-l-2 p-3 rounded-r-xl border-border-app bg-surface-app shadow-sm ${header.color}`}>
                  <span className="text-xs font-semibold">{header.label}</span>
                  <span className="text-[10px] bg-hover-app border px-2 py-0.5 rounded-full text-text-secondary font-mono">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 min-h-[300px]">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-[10px] text-text-secondary border border-dashed border-border-app/40 rounded-2xl bg-hover-app/10">
                      Empty stage
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`bg-surface-app border p-4 rounded-xl cursor-pointer hover:shadow-md transition-all space-y-3 ${
                          selectedLead?.id === lead.id ? 'border-primary-app shadow-sm ring-1 ring-primary-app/20' : 'border-border-app'
                        }`}
                      >
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-text-secondary font-mono">{lead.company || 'Individual'}</span>
                          <h4 className="text-xs font-bold text-text-primary mt-0.5">{lead.name}</h4>
                          <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-2 font-light">{lead.notes}</p>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[9px] bg-hover-app border border-border-app/60 px-1.5 py-0.5 rounded text-text-secondary">
                            {lead.source}
                          </span>
                          {lead.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-[9px] bg-primary-app/10 text-primary-app px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Move Actions shortcuts */}
                        <div className="border-t border-border-app/40 pt-2 flex items-center justify-between text-[10px]">
                          <span className="text-[9px] text-text-secondary font-mono">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex gap-2.5">
                            {stage !== 'new' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const prevIdx = stages.indexOf(stage) - 1;
                                  updateLeadStatus(lead.id, stages[prevIdx]);
                                }}
                                className="text-text-secondary hover:text-text-primary"
                                title="Move Back"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {stage !== 'won' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextIdx = stages.indexOf(stage) + 1;
                                  updateLeadStatus(lead.id, stages[nextIdx]);
                                }}
                                className="text-primary-app hover:text-accent-app font-semibold flex items-center gap-0.5"
                                title="Advance Stage"
                              >
                                <span>Advance</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lead Details Drawer (Slides/displays to the right) */}
        {selectedLead && (
          <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-5 shadow-lg relative flex flex-col justify-between max-h-[620px] overflow-y-auto">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-app pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-primary-app tracking-wider">Lead Inspector</span>
                  <h3 className="text-sm font-bold text-text-primary mt-0.5">{selectedLead.name}</h3>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 rounded hover:bg-hover-app text-text-secondary hover:text-text-primary"
                >
                  ✕
                </button>
              </div>

              {/* Contact info list */}
              <div className="space-y-3.5 py-4 border-b border-border-app/40">
                <div className="flex items-center gap-2.5 text-xs">
                  <MessageSquare className="w-3.5 h-3.5 text-text-secondary" />
                  <span className="text-text-primary">{selectedLead.email}</span>
                  <button
                    onClick={() => {
                      setComposeInitialTo(selectedLead.email);
                      setComposeOpen(true);
                    }}
                    className="ml-auto text-[10px] text-primary-app hover:underline font-semibold"
                  >
                    Email Lead
                  </button>
                </div>
                {selectedLead.phone && (
                  <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedLead.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Recorded: {new Date(selectedLead.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Timeline feed */}
              <div className="py-4 space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Activity Log</h4>
                <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
                  {selectedLead.timeline.map((evt) => (
                    <div key={evt.id} className="text-[11px] border-l-2 border-border-app pl-2.5 relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-app absolute -left-[4px] top-1" />
                      <span className="font-semibold text-text-primary">{evt.type}</span>
                      <p className="text-text-secondary font-light mt-0.5">{evt.description}</p>
                      <span className="text-[9px] text-text-secondary mt-0.5 block">
                        {new Date(evt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Note logging form */}
            <form onSubmit={handleAddNote} className="border-t border-border-app pt-4 space-y-3.5 bg-surface-app">
              <label className="block text-[10px] uppercase font-bold text-text-secondary tracking-wider">Log Note / Log Call Details</label>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Log discussion details or updates..."
                className="w-full h-20 bg-hover-app/40 border border-border-app rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-accent-app resize-none"
              />
              <button
                type="submit"
                className="w-full bg-primary-app text-white dark:text-black font-semibold text-[11px] py-2 rounded-lg hover:opacity-90 transition-all shadow"
              >
                Log Entry
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Add Lead Manual Overlay Dialog */}
      {isNewLeadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewLeadOpen(false)} />
          <div className="bg-surface-app border border-border-app rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10">
            <div className="px-5 py-4 border-b border-border-app flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Add manual Lead Record</h3>
              <button onClick={() => setNewLeadOpen(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleCreateLead} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Chen"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="recipient@domain.dev"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Company</label>
                  <input
                    type="text"
                    placeholder="e.g. TeamBrew"
                    className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Lead Source</label>
                  <select
                    className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-app"
                    value={source}
                    onChange={e => setSource(e.target.value)}
                  >
                    <option value="Contact Form">Contact Form</option>
                    <option value="Twitter DM">Twitter DM</option>
                    <option value="Referral">Referral</option>
                    <option value="Direct Outreach">Direct Outreach</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. custom ui, node audit"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Context Notes</label>
                <textarea
                  placeholder="Details regarding scope or inquiries..."
                  className="w-full h-24 bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-app resize-none"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-app text-white dark:text-black font-semibold text-xs py-2.5 rounded-lg hover:opacity-90 transition-all shadow"
              >
                Register Lead
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
