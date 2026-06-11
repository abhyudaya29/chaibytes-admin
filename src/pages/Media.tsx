import React, { useState } from 'react';
import { useChai } from '../context/ChaiContext';
import { Plus, Trash2, FileText, Search, Link2 } from 'lucide-react';

export const Media: React.FC = () => {
  const { assets, addAsset, deleteAsset } = useChai();
  const [search, setSearch] = useState('');

  // Upload Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [size, setSize] = useState('');
  const [type, setType] = useState('image/png');
  const [isAddOpen, setAddOpen] = useState(false);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) return;

    addAsset(name, type, url, size || '45 KB');
    setName('');
    setUrl('');
    setSize('');
    setAddOpen(false);
  };

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-heading text-text-primary">Media Library</h1>
          <p className="text-xs text-text-secondary">Host and index project resources, documentation assets, and logos</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold shadow hover:opacity-90 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Upload Asset</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center bg-surface-app border border-border-app rounded-xl px-3 py-1.5 w-full md:w-80 shadow-sm">
        <Search className="w-4 h-4 text-text-secondary mr-2" />
        <input
          type="text"
          placeholder="Search assets..."
          className="w-full bg-transparent border-none text-xs text-text-primary outline-none"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Upload Modal Overlay */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="bg-surface-app border border-border-app rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border-app flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Record Asset URL</h3>
              <button onClick={() => setAddOpen(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>
            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Asset Filename</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. chaibytes_cover.jpg"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-app"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Asset Content Type</label>
                <select
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-xs text-text-primary outline-none"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="image/png">image/png</option>
                  <option value="image/jpeg">image/jpeg</option>
                  <option value="image/svg+xml">image/svg+xml</option>
                  <option value="application/pdf">application/pdf</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Resource URL (or Unsplash URL)</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">File Size String</label>
                <input
                  type="text"
                  placeholder="e.g. 250 KB"
                  className="w-full bg-hover-app/40 border border-border-app rounded-lg px-3 py-2 text-sm text-text-primary outline-none"
                  value={size}
                  onChange={e => setSize(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-app text-white dark:text-black font-semibold text-xs py-2.5 rounded-lg hover:opacity-90 transition-all shadow"
              >
                Index Asset
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {filteredAssets.map(asset => {
          const isPdf = asset.type === 'application/pdf';
          return (
            <div
              key={asset.id}
              className="bg-surface-app border border-border-app rounded-2xl overflow-hidden hover:shadow-md transition-all group flex flex-col justify-between"
            >
              {/* Asset Preview Frame */}
              <div className="h-32 bg-hover-app/40 flex items-center justify-center border-b border-border-app/60 relative overflow-hidden">
                {isPdf ? (
                  <FileText className="w-10 h-10 text-primary-app/70" />
                ) : (
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-250"
                  />
                )}
                
                {/* Copy link overlay trigger */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(asset.url);
                      alert('Asset URL copied to clipboard!');
                    }}
                    className="p-1.5 rounded-lg bg-surface-app text-text-primary hover:bg-hover-app transition-colors"
                    title="Copy Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAsset(asset.id)}
                    className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Asset metadata */}
              <div className="p-3">
                <span className="block text-[11px] font-bold text-text-primary truncate">{asset.name}</span>
                <div className="flex justify-between items-center text-[9px] text-text-secondary mt-1 font-mono">
                  <span>{asset.size}</span>
                  <span>{asset.type.split('/')[1] || 'binary'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
