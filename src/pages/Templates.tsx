import React, { useState } from 'react';
import { useChai } from '../context/ChaiContext';
import { Plus, Trash2, Edit3, Mail, Search } from 'lucide-react';

export const Templates: React.FC = () => {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useChai();

  const [search, setSearch] = useState('');
  const [isAddOpen, setAddOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('newsletter');
  const [resendTemplateId, setResendTemplateId] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !resendTemplateId) return;

    const payload = {
      name,
      description,
      category,
      resend_template_id: resendTemplateId,
      thumbnail_url: thumbnailUrl || "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=150&h=150&q=80"
    };

    if (editingTemplateId) {
      updateTemplate(editingTemplateId, payload);
    } else {
      addTemplate(payload);
    }

    // Reset & Close
    setName('');
    setDescription('');
    setCategory('newsletter');
    setResendTemplateId('');
    setThumbnailUrl('');
    setEditingTemplateId(null);
    setAddOpen(false);
  };

  const handleEditClick = (tpl: any) => {
    setEditingTemplateId(tpl.id);
    setName(tpl.name);
    setDescription(tpl.description || '');
    setCategory(tpl.category);
    setResendTemplateId(tpl.resend_template_id);
    setThumbnailUrl(tpl.thumbnail_url || '');
    setAddOpen(true);
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    t.resend_template_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">Email Templates</h1>
          <p className="text-xs text-text-secondary">Register metadata and Resend template references used for automated dispatches</p>
        </div>
        <button
          onClick={() => {
            setEditingTemplateId(null);
            setName('');
            setDescription('');
            setCategory('newsletter');
            setResendTemplateId('');
            setThumbnailUrl('');
            setAddOpen(true);
          }}
          className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold shadow hover:opacity-90 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Template Reference</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex items-center bg-surface-app border border-border-app rounded-xl px-3 py-1.5 w-full md:w-80 shadow-sm">
        <Search className="w-4 h-4 text-text-secondary mr-2" />
        <input
          type="text"
          placeholder="Search templates..."
          className="w-full bg-transparent border-none text-xs text-text-primary outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Add / Edit Modal Overlay */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="bg-surface-app border border-border-app rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border-app flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                {editingTemplateId ? "Edit Template Reference" : "Create Template Reference"}
              </h3>
              <button onClick={() => setAddOpen(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleCreateOrUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Newsletter Template"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Main weekly newsletter layout"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Category</label>
                  <select
                    className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none cursor-pointer"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="newsletter">newsletter</option>
                    <option value="welcome">welcome</option>
                    <option value="proposal">proposal</option>
                    <option value="invoice">invoice</option>
                    <option value="marketing">marketing</option>
                    <option value="client">client</option>
                    <option value="system">system</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Resend ID Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. tpl_123456"
                    className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none font-mono focus:border-accent-app"
                    value={resendTemplateId}
                    onChange={e => setResendTemplateId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Thumbnail Preview URL</label>
                <input
                  type="text"
                  placeholder="https://cdn.chaibytes.in/..."
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
                  value={thumbnailUrl}
                  onChange={e => setThumbnailUrl(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-app text-white dark:text-black font-semibold text-xs py-2.5 rounded-lg hover:opacity-90 transition-all shadow"
              >
                {editingTemplateId ? "Update Reference" : "Save Reference"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Templates cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-surface-app border border-border-app rounded-2xl flex flex-col items-center justify-center">
            <Mail className="w-10 h-10 text-text-secondary/40 mb-3" />
            <h3 className="text-sm font-semibold text-text-primary">No templates indexed</h3>
            <p className="text-xs text-text-secondary mt-1">Add your first template reference to begin mapping campaigns.</p>
          </div>
        ) : (
          filteredTemplates.map(tpl => (
            <div
              key={tpl.id}
              className="bg-surface-app border border-border-app rounded-2xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between"
            >
              {/* Thumbnail header */}
              <div className="h-32 bg-hover-app/40 flex items-center justify-center border-b border-border-app/60 relative overflow-hidden">
                <img
                  src={tpl.thumbnail_url || "https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&w=150&h=150&q=80"}
                  alt={tpl.name}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-250"
                />
                
                {/* Float tags */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-[9px] bg-primary-app text-white dark:text-black font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    {tpl.category}
                  </span>
                </div>

                {/* Edit/Delete Overlay */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2.5">
                  <button
                    onClick={() => handleEditClick(tpl)}
                    className="p-1.5 rounded-lg bg-surface-app text-text-primary hover:bg-hover-app transition-colors"
                    title="Edit Metadata"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(tpl.id)}
                    className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title="Deactivate reference"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Template details */}
              <div className="p-4.5 space-y-2.5">
                <div>
                  <h4 className="text-xs font-bold text-text-primary line-clamp-1">{tpl.name}</h4>
                  <p className="text-[10px] text-text-secondary mt-1 line-clamp-2 leading-relaxed font-light">
                    {tpl.description || "No description provided."}
                  </p>
                </div>
                <div className="border-t border-border-app/45 pt-2.5 flex items-center justify-between text-[9px] font-mono text-text-secondary">
                  <span>Resend ID:</span>
                  <span className="bg-hover-app px-2 py-0.5 rounded border border-border-app/40 font-semibold">{tpl.resend_template_id}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
