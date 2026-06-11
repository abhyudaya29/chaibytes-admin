import React, { useState } from 'react';
import type { Client } from '../context/ChaiContext';
import { useChai } from '../context/ChaiContext';
import { Plus, User, FileText, CheckCircle2, DollarSign } from 'lucide-react';

export const Clients: React.FC = () => {
  const {
    clients,
    addClient,
    addProposalToClient,
    addContractToClient,
    updateClientStatus
  } = useChai();

  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [isNewClientOpen, setNewClientOpen] = useState(false);
  const [isNewPropOpen, setNewPropOpen] = useState(false);
  const [isNewContrOpen, setNewContrOpen] = useState(false);

  // New Client Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [projectName, setProjectName] = useState('');
  const [initialValue, setInitialValue] = useState('');

  // Proposal Form
  const [propTitle, setPropTitle] = useState('');
  const [propVal, setPropVal] = useState('');

  // Contract Form
  const [contrTitle, setContrTitle] = useState('');

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company || !projectName) return;

    const val = parseFloat(initialValue) || 0;
    const newClientData = {
      name,
      email,
      company,
      projectName,
      status: 'active' as const,
      totalValue: val,
      proposals: val > 0 ? [{ id: 'p-init', title: `${projectName} Initial Scope`, value: val, status: 'accepted' as const, sentAt: new Date().toISOString() }] : [],
      contracts: val > 0 ? [{ id: 'c-init', title: `${projectName} Basic Service Agreement`, status: 'signed' as const, signedAt: new Date().toISOString() }] : []
    };

    addClient(newClientData);
    
    // Clear and close
    setName('');
    setEmail('');
    setCompany('');
    setProjectName('');
    setInitialValue('');
    setNewClientOpen(false);
  };

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !propTitle || !propVal) return;

    addProposalToClient(selectedClient.id, {
      title: propTitle,
      value: parseFloat(propVal) || 0,
      status: 'sent'
    });

    // Refresh selected client
    setTimeout(() => {
      const updated = clients.find(c => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated);
    }, 50);

    setPropTitle('');
    setPropVal('');
    setNewPropOpen(false);
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !contrTitle) return;

    addContractToClient(selectedClient.id, {
      title: contrTitle,
      status: 'review'
    });

    setTimeout(() => {
      const updated = clients.find(c => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated);
    }, 50);

    setContrTitle('');
    setNewContrOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">Accounts CRM</h1>
          <p className="text-xs text-text-secondary">Track client engagements, active scopes, proposals, and agreements</p>
        </div>
        <button
          onClick={() => setNewClientOpen(true)}
          className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold shadow hover:opacity-90 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Account</span>
        </button>
      </div>

      {/* Main Grid: Left Clients Accounts list, Right Selected client view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side Client list */}
        <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-4 h-[520px] overflow-y-auto">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Client Accounts</h3>
          
          <div className="space-y-3">
            {clients.map(cl => (
              <div
                key={cl.id}
                onClick={() => setSelectedClient(cl)}
                className={`p-4 border rounded-xl cursor-pointer hover:border-accent-app/30 hover:bg-hover-app/30 transition-all space-y-2.5 ${
                  selectedClient?.id === cl.id ? 'border-primary-app bg-hover-app/40 shadow-sm' : 'border-border-app/40 bg-surface-app'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase font-semibold">{cl.company}</span>
                    <h4 className="text-xs font-bold text-text-primary mt-0.5">{cl.projectName}</h4>
                  </div>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                    cl.status === 'active' ? 'bg-emerald-500/10 text-success-app border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {cl.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-text-secondary border-t border-border-app/35 pt-2.5">
                  <span className="font-light">Contacts: {cl.name}</span>
                  <span className="font-bold text-text-primary">${cl.totalValue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Client Details / Management */}
        {selectedClient ? (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Core Info block */}
            <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-border-app pb-3.5">
                <div>
                  <span className="text-[10px] text-primary-app font-bold uppercase tracking-wider">{selectedClient.company}</span>
                  <h2 className="text-base font-bold font-heading text-text-primary mt-0.5">{selectedClient.projectName}</h2>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedClient.status}
                    onChange={(e) => {
                      updateClientStatus(selectedClient.id, e.target.value as any);
                      setTimeout(() => {
                        const updated = clients.find(c => c.id === selectedClient.id);
                        if (updated) setSelectedClient(updated);
                      }, 50);
                    }}
                    className="bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-1 text-xs text-text-primary outline-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-hover-app/20 border border-border-app/40 p-3.5 rounded-xl text-center">
                  <DollarSign className="w-4 h-4 mx-auto text-primary-app mb-1" />
                  <span className="text-[9px] text-text-secondary uppercase">Contract Value</span>
                  <span className="block text-sm font-bold text-text-primary mt-0.5">${selectedClient.totalValue.toLocaleString()}</span>
                </div>
                <div className="bg-hover-app/20 border border-border-app/40 p-3.5 rounded-xl text-center">
                  <FileText className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                  <span className="text-[9px] text-text-secondary uppercase">Proposals</span>
                  <span className="block text-sm font-bold text-text-primary mt-0.5">{selectedClient.proposals.length} File(s)</span>
                </div>
                <div className="bg-hover-app/20 border border-border-app/40 p-3.5 rounded-xl text-center">
                  <CheckCircle2 className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                  <span className="text-[9px] text-text-secondary uppercase">Agreements</span>
                  <span className="block text-sm font-bold text-text-primary mt-0.5">
                    {selectedClient.contracts.filter(c => c.status === 'signed').length} Signed
                  </span>
                </div>
              </div>
            </div>

            {/* Split: Proposals List vs Contracts List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Proposals Block */}
              <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-border-app/50 pb-2.5">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Proposals</h3>
                  <button
                    onClick={() => setNewPropOpen(true)}
                    className="flex items-center gap-1 text-[10px] text-primary-app font-semibold hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Proposal</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {selectedClient.proposals.length === 0 ? (
                    <span className="block text-center text-[10px] text-text-secondary py-6">No proposals generated</span>
                  ) : (
                    selectedClient.proposals.map(p => (
                      <div key={p.id} className="p-3 border border-border-app/40 rounded-xl bg-hover-app/20 flex items-center justify-between text-xs">
                        <div>
                          <h4 className="font-semibold text-text-primary line-clamp-1">{p.title}</h4>
                          <span className="text-[9px] text-text-secondary block mt-0.5">${p.value.toLocaleString()}</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          p.status === 'accepted' ? 'bg-emerald-500/10 text-success-app' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Contracts Block */}
              <div className="bg-surface-app border border-border-app p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-border-app/50 pb-2.5">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Contracts</h3>
                  <button
                    onClick={() => setNewContrOpen(true)}
                    className="flex items-center gap-1 text-[10px] text-primary-app font-semibold hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Upload Agreement</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {selectedClient.contracts.length === 0 ? (
                    <span className="block text-center text-[10px] text-text-secondary py-6">No agreements uploaded</span>
                  ) : (
                    selectedClient.contracts.map(c => (
                      <div key={c.id} className="p-3 border border-border-app/40 rounded-xl bg-hover-app/20 flex items-center justify-between text-xs">
                        <div>
                          <h4 className="font-semibold text-text-primary line-clamp-1">{c.title}</h4>
                          {c.signedAt && (
                            <span className="text-[9px] text-text-secondary block mt-0.5">Signed {new Date(c.signedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          c.status === 'signed' ? 'bg-emerald-500/10 text-success-app' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="lg:col-span-2 bg-surface-app border border-border-app p-10 rounded-2xl text-center flex flex-col items-center justify-center">
            <User className="w-10 h-10 text-text-secondary/40 mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">No Client Accounts Recorded</h3>
            <p className="text-xs text-text-secondary mt-1">Create an account to manage documents.</p>
          </div>
        )}
      </div>

      {/* New Account Overlay Modal */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewClientOpen(false)} />
          <div className="bg-surface-app border border-border-app rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border-app flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Record New Client Account</h3>
              <button onClick={() => setNewClientOpen(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleCreateClient} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Company / Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solidity Labs"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Primary Project Scope Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. smart contract technical audit"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Elena Rostova"
                    className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-app"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="elena@soliditylabs.org"
                    className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-app"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Initial Valuation ($ USD)</label>
                <input
                  type="number"
                  placeholder="12000"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={initialValue}
                  onChange={e => setInitialValue(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-app text-white dark:text-black font-semibold text-xs py-2.5 rounded-lg hover:opacity-90 transition-all shadow"
              >
                Register Client Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Proposal Modal */}
      {isNewPropOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewPropOpen(false)} />
          <div className="bg-surface-app border border-border-app rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden z-10">
            <div className="px-5 py-4 border-b border-border-app flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Create Scope Proposal</h3>
              <button onClick={() => setNewPropOpen(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleCreateProposal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Proposal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design Audit Scope"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
                  value={propTitle}
                  onChange={e => setPropTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Scope Value ($ USD)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 8500"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
                  value={propVal}
                  onChange={e => setPropVal(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary-app text-white dark:text-black font-semibold text-xs py-2 rounded-lg hover:opacity-90 transition-all"
              >
                Dispatch Proposal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Contract Modal */}
      {isNewContrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setNewContrOpen(false)} />
          <div className="bg-surface-app border border-border-app rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden z-10">
            <div className="px-5 py-4 border-b border-border-app flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Upload Service Agreement</h3>
              <button onClick={() => setNewContrOpen(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleCreateContract} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Service Agreement v2"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
                  value={contrTitle}
                  onChange={e => setContrTitle(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary-app text-white dark:text-black font-semibold text-xs py-2 rounded-lg hover:opacity-90 transition-all"
              >
                Upload & Request Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
