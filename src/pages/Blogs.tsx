import React, { useState, useRef } from 'react';
import type { Blog } from '../context/ChaiContext';
import { useChai } from '../context/ChaiContext';
import {
  Edit3, Trash2, PenTool, Clock, Plus, ArrowLeft, Search,
  Settings, Bold, Italic, Link2, Code, Quote, List, Heading, Image as ImageIcon,
  CheckCircle
} from 'lucide-react';

export const Blogs: React.FC = () => {
  const { blogs, addBlog, updateBlog, deleteBlog, setNewBlogOpen } = useChai();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');

  // Editing / Writing state
  const [isWriting, setIsWriting] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  
  // Editor Content states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [coverImage, setCoverImage] = useState('');
  const [slug, setSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');

  // UI display toggles
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [isSettingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const categories = ['All', 'Engineering', 'Chai Culture', 'Productivity', 'Design'];

  // Word count & Reading time
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Compute slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setSlug(generated);
    setSeoTitle(`${val} | Chaibytes`);
  };

  // Helper to insert markdown format symbols
  const insertMarkdown = (symbol: string, placeholder = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = symbol + (selectedText || placeholder) + (symbol.startsWith('\n') ? '' : symbol);
    
    setContent(
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end)
    );

    // Reset cursor focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + symbol.length, start + symbol.length + (selectedText || placeholder).length);
    }, 50);
  };

  // Start creating new blog
  const handleStartNew = () => {
    setEditingBlogId(null);
    setTitle('');
    setContent('');
    setCategory('Engineering');
    setCoverImage('');
    setSlug('');
    setSeoTitle('');
    setSeoDesc('');
    setIsWriting(true);
    setEditorTab('write');
    setSettingsDrawerOpen(false);
  };

  // Start editing existing blog
  const handleStartEdit = (blog: Blog) => {
    setEditingBlogId(blog.id);
    setTitle(blog.title);
    setContent(blog.content);
    setCategory(blog.category);
    setCoverImage(blog.coverImage);
    setSlug(blog.slug);
    setSeoTitle(blog.seoTitle);
    setSeoDesc(blog.seoDesc);
    setIsWriting(true);
    setEditorTab('write');
    setSettingsDrawerOpen(false);
  };

  // Submit to Context
  const handleSave = (isDraft: boolean) => {
    if (!title) {
      alert("Please specify a title");
      return;
    }

    const payload = {
      title,
      content,
      category,
      coverImage: coverImage || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      seoTitle: seoTitle || `${title} | Chaibytes`,
      seoDesc: seoDesc || content.substring(0, 150) + "...",
      status: (isDraft ? 'draft' : 'published') as 'draft' | 'published'
    };

    if (editingBlogId) {
      updateBlog(editingBlogId, payload);
    } else {
      addBlog(payload);
    }

    setIsWriting(false);
    setNewBlogOpen(false);
  };

  // Filter Blogs lists
  const filteredBlogs = blogs.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesTab = activeTab === 'all' || b.status === activeTab;
    return matchesSearch && matchesCategory && matchesTab;
  });

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-140px)]">
      {isWriting ? (
        /* ==================== HASHNODE-LIKE BLOG WRITER ==================== */
        <div className="flex flex-col h-[calc(100vh-140px)] bg-surface-app border border-border-app rounded-2xl overflow-hidden relative shadow-lg">
          
          {/* Top Writer Header Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-border-app bg-hover-app/30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsWriting(false)}
                className="p-1.5 rounded-lg hover:bg-hover-app text-text-secondary hover:text-text-primary transition-all"
                title="Back to all posts"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 bg-hover-app/50 border border-border-app/50 rounded-lg p-0.5">
                <button
                  onClick={() => setEditorTab('write')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    editorTab === 'write'
                      ? 'bg-surface-app text-primary-app shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Write
                </button>
                <button
                  onClick={() => setEditorTab('preview')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    editorTab === 'preview'
                      ? 'bg-surface-app text-primary-app shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSettingsDrawerOpen(!isSettingsDrawerOpen)}
                className={`p-2 rounded-lg border border-border-app hover:bg-hover-app text-text-secondary transition-all ${
                  isSettingsDrawerOpen ? 'bg-primary-app/10 border-primary-app/20 text-primary-app' : 'bg-surface-app'
                }`}
                title="Publish Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSave(true)}
                className="px-3.5 py-1.5 border border-border-app bg-surface-app text-xs font-semibold text-text-primary rounded-lg hover:bg-hover-app transition-colors shadow-sm"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSave(false)}
                className="px-4 py-1.5 bg-primary-app text-white dark:text-black text-xs font-bold rounded-lg hover:opacity-90 shadow transition-all"
              >
                Publish article
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-3xl mx-auto w-full space-y-4">
              
              {editorTab === 'write' ? (
                <>
                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1 py-1 px-2 border border-border-app/60 rounded-xl bg-hover-app/20 text-text-secondary sticky top-0 z-10 backdrop-blur-md">
                    <button onClick={() => insertMarkdown('**', 'bold text')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                    <button onClick={() => insertMarkdown('*', 'italic text')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                    <button onClick={() => insertMarkdown('# ', 'Heading 1')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs" title="Heading"><Heading className="w-3.5 h-3.5" /></button>
                    <button onClick={() => insertMarkdown('[', '](https://)')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs" title="Link"><Link2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => insertMarkdown('`', 'inline code')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs" title="Code"><Code className="w-3.5 h-3.5" /></button>
                    <button onClick={() => insertMarkdown('\n> ', 'blockquote')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs" title="Quote"><Quote className="w-3.5 h-3.5" /></button>
                    <button onClick={() => insertMarkdown('\n- ', 'list item')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs" title="List"><List className="w-3.5 h-3.5" /></button>
                    <button onClick={() => insertMarkdown('![caption](', 'image_url)')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs" title="Image"><ImageIcon className="w-3.5 h-3.5" /></button>
                  </div>

                  {/* Hashnode Title Input */}
                  <input
                    type="text"
                    placeholder="Article Title..."
                    className="w-full bg-transparent border-0 outline-none text-2xl md:text-3xl font-heading font-bold text-text-primary placeholder:text-text-secondary/40 py-2 focus:ring-0"
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                  />

                  {/* Optional Cover Image Banner in Editor */}
                  {coverImage && (
                    <div className="relative h-48 rounded-xl overflow-hidden border border-border-app">
                      <img src={coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setCoverImage('')}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-md text-[10px]"
                      >
                        Remove cover
                      </button>
                    </div>
                  )}

                  {/* Writing Canvas Textarea */}
                  <textarea
                    ref={textareaRef}
                    placeholder="Write article in markdown... supports headers, lists, code snippets, etc."
                    className="w-full flex-1 bg-transparent border-0 outline-none resize-none text-sm text-text-primary placeholder:text-text-secondary/40 font-light leading-relaxed focus:ring-0 min-h-[300px]"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                </>
              ) : (
                /* Split Renders Preview */
                <div className="space-y-6 max-w-2xl mx-auto w-full py-2">
                  {coverImage && (
                    <img src={coverImage} alt={title} className="w-full h-64 object-cover rounded-xl border border-border-app" />
                  )}
                  <div className="flex items-center gap-3 text-[10px] text-text-secondary uppercase">
                    <span className="bg-primary-app/10 text-primary-app px-2 py-0.5 rounded font-semibold">{category}</span>
                    <span>•</span>
                    <span>{readingTime} min read</span>
                  </div>
                  <h1 className="text-3xl font-bold font-heading text-text-primary leading-tight">
                    {title || "Untitled Article"}
                  </h1>
                  <div className="text-sm font-light text-text-primary leading-relaxed whitespace-pre-wrap border-t border-border-app/40 pt-4">
                    {content || "*No content written yet. Tap the Write tab to begin...*"}
                  </div>
                </div>
              )}
            </div>

            {/* Slide-out Sidebar Publish Settings Drawer */}
            {isSettingsDrawerOpen && (
              <div className="w-80 border-l border-border-app bg-sidebar-app p-5 overflow-y-auto space-y-5 shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between border-b border-border-app pb-2">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Publish Settings</h3>
                  <button onClick={() => setSettingsDrawerOpen(false)} className="text-text-secondary hover:text-text-primary text-xs">✕</button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-text-secondary uppercase mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent-app cursor-pointer"
                    >
                      {categories.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat} className="bg-surface-app">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-text-secondary uppercase mb-1">Slug Route</label>
                    <input
                      type="text"
                      className="w-full bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-1.5 font-mono text-text-primary outline-none focus:border-accent-app"
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-text-secondary uppercase mb-1">Cover Image Link</label>
                    <input
                      type="text"
                      placeholder="https://unsplash.com/..."
                      className="w-full bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-1.5 text-text-primary outline-none focus:border-accent-app"
                      value={coverImage}
                      onChange={e => setCoverImage(e.target.value)}
                    />
                  </div>

                  <div className="border-t border-border-app/40 pt-3 space-y-3">
                    <span className="font-bold text-text-secondary uppercase tracking-wider block">SEO Meta Tags</span>
                    
                    <div>
                      <label className="block font-semibold text-text-secondary mb-1">Meta Title</label>
                      <input
                        type="text"
                        className="w-full bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-1.5 text-text-primary outline-none focus:border-accent-app"
                        value={seoTitle}
                        onChange={e => setSeoTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-text-secondary mb-1">Meta Description</label>
                      <textarea
                        className="w-full h-20 bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-1.5 text-text-primary outline-none resize-none focus:border-accent-app"
                        value={seoDesc}
                        onChange={e => setSeoDesc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Statistics Bar */}
          <div className="px-6 py-2 bg-hover-app/40 border-t border-border-app flex items-center justify-between text-[10px] text-text-secondary">
            <div className="flex gap-4 font-mono">
              <span>Words: {wordCount}</span>
              <span>Reading: {readingTime} min</span>
            </div>
            <div className="flex items-center gap-1 text-primary-app">
              <CheckCircle className="w-3.5 h-3.5 text-success-app" />
              <span>Draft autosaved locally</span>
            </div>
          </div>

        </div>
      ) : (
        /* ==================== REGULAR ARTICLES HOME ==================== */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-heading text-text-primary">Content Engine</h1>
              <p className="text-xs text-text-secondary">Draft posts and publish technical insights</p>
            </div>
            <button
              onClick={handleStartNew}
              className="flex items-center gap-1.5 bg-primary-app text-white dark:text-black px-4 py-2 rounded-lg text-xs font-bold shadow hover:opacity-90 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Article</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-app pb-4">
            <div className="flex items-center bg-surface-app border border-border-app rounded-xl px-3 py-1.5 w-full md:w-80 shadow-sm">
              <Search className="w-4 h-4 text-text-secondary mr-2" />
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full bg-transparent border-none text-xs text-text-primary outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary-app/10 border-primary-app/30 text-primary-app'
                      : 'bg-surface-app border-border-app text-text-secondary hover:bg-hover-app'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-4 text-xs font-semibold text-text-secondary border-b border-border-app/40 pb-2">
            {[
              { id: 'all', name: 'All Articles' },
              { id: 'published', name: 'Published' },
              { id: 'draft', name: 'Drafts' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2 px-1 relative transition-colors ${
                  activeTab === tab.id ? 'text-primary-app border-b-2 border-primary-app' : 'hover:text-text-primary'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Blogs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-surface-app border border-border-app rounded-2xl flex flex-col items-center justify-center">
                <PenTool className="w-10 h-10 text-text-secondary/40 mb-3" />
                <h3 className="text-sm font-semibold text-text-primary">No articles found</h3>
                <p className="text-xs text-text-secondary mt-1">Add your first custom blog or adjust filters</p>
              </div>
            ) : (
              filteredBlogs.map(blog => (
                <div
                  key={blog.id}
                  className="bg-surface-app border border-border-app rounded-2xl overflow-hidden hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="h-44 overflow-hidden border-b border-border-app relative">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 flex gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase border ${
                        blog.status === 'published'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-success-app'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      }`}>
                        {blog.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-4.5 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-text-secondary">
                        <span className="font-semibold uppercase tracking-wider text-primary-app">{blog.category}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{blog.readingTime} min</span>
                        </span>
                      </div>
                      <h3 className="text-sm font-bold font-heading text-text-primary mt-2 group-hover:text-primary-app transition-colors line-clamp-1">
                        {blog.title}
                      </h3>
                      <p className="text-xs font-light text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">
                        {blog.content}
                      </p>
                    </div>

                    <div className="border-t border-border-app/50 pt-3 flex items-center justify-between">
                      <span className="text-[10px] text-text-secondary font-mono">
                        /{blog.slug}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(blog)}
                          className="p-1.5 rounded-lg border border-border-app/40 hover:bg-hover-app text-text-secondary hover:text-text-primary transition-all"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteBlog(blog.id)}
                          className="p-1.5 rounded-lg border border-border-app/40 hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
