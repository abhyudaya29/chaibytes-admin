import React, { useState, useRef } from 'react';
import type { Blog } from '../context/ChaiContext';
import { useChai } from '../context/ChaiContext';
import {
  Edit3, Trash2, PenTool, Clock, Plus, ArrowLeft, Search,
  Settings, Bold, Italic, Link2, Code, Quote, List, Heading, Image as ImageIcon,
  CheckCircle
} from 'lucide-react';

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) {
    return <p className="italic text-text-secondary/60 text-xs">No content written yet. Tap the Write tab to begin...</p>;
  }

  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let isInsideList = false;
  let elementKey = 0;

  const renderTextWithInlineFormatting = (text: string) => {
    const ctaRegex = /\[[cC][tT][aA]:(.*?)\]\((.*?)\)/g;
    const isFullLineCta = text.trim().match(/^\[[cC][tT][aA]:(.*?)\]\((.*?)\)$/);
    if (isFullLineCta) {
      const btnText = isFullLineCta[1];
      const btnUrl = isFullLineCta[2];
      return (
        <div key={`cta-${elementKey++}`} className="my-5 flex justify-center">
          <a
            href={btnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#ff6b00] hover:bg-[#ff8c00] text-white font-semibold rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-md text-xs"
          >
            {btnText}
          </a>
        </div>
      );
    }

    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    const boldRegex = /\*\*(.*?)\*\//g;
    const boldRegexAlt = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;
    const codeRegex = /`(.*?)`/g;
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    
    // Custom markdown extensions
    const highlightRegex = /==(.*?)==/g;
    const gradientRegex = /\[orange-gradient:(.*?)\]/g;
    const numRegex = /\[num:(.*?)\]/g;
    const autoNumRegex = /\b(\d+(?:\.\d+)?(?:%|\/\d+))\b/g;
    const statRegex = /\[stat:(.*?)\]\((.*?)\)/g;
    const calloutRegex = /\[callout:(.*?)\]/g;

    let html = text
      .replace(imageRegex, '<figure class="my-4"><img src="$2" alt="$1" class="rounded-xl border border-border-app max-h-96 mx-auto object-contain shadow-md" /><figcaption class="text-center text-[10px] text-text-secondary mt-1.5">$1</figcaption></figure>')
      .replace(boldRegex, '<strong>$1</strong>')
      .replace(boldRegexAlt, '<strong>$1</strong>')
      .replace(italicRegex, '<em>$1</em>')
      .replace(codeRegex, '<code class="bg-hover-app px-1.5 py-0.5 rounded font-mono text-xs text-accent-app font-medium">$1</code>')
      // Custom styling hooks
      .replace(highlightRegex, '<mark class="bg-amber-500/10 border-b border-amber-500/40 text-[#ff6b00] px-1.5 py-0.5 rounded font-medium">$1</mark>')
      .replace(gradientRegex, '<span class="bg-gradient-to-r from-[#ff6b00] to-[#ff9f43] bg-clip-text text-transparent font-extrabold">$1</span>')
      .replace(numRegex, '<span class="animated-underline-pulse font-bold text-[#ff6b00]">$1</span>')
      .replace(autoNumRegex, '<span class="animated-underline-pulse font-bold text-[#ff6b00]">$1</span>')
      .replace(statRegex, '<div class="inline-flex flex-col items-center justify-center text-center px-4 py-3 rounded-xl border border-border-app/60 bg-hover-app/20 shadow-sm min-w-[120px] my-2.5 mr-3 select-none"><span class="text-xl font-bold bg-gradient-to-r from-[#ff6b00] to-[#ff9f43] bg-clip-text text-transparent">$1</span><span class="text-[9px] uppercase tracking-wider text-text-secondary font-bold mt-1">$2</span></div>')
      .replace(calloutRegex, '<div class="flex items-start gap-3 bg-[#ff6b00]/10 border border-[#ff6b00]/20 p-3.5 rounded-xl my-3.5 text-xs text-text-primary"><span class="text-[#ff6b00] text-sm">💡</span><div class="leading-relaxed font-light">$1</div></div>')
      
      .replace(ctaRegex, '<a href="$2" target="_blank" class="inline-flex items-center px-3 py-1 bg-[#ff6b00] text-white rounded-lg text-[10px] font-semibold hover:opacity-90 shadow-sm mx-1">$1</a>')
      .replace(linkRegex, (m, t, u) => {
        if (u.toLowerCase().includes('cta:')) return m;
        return `<a href="${u}" target="_blank" rel="noopener noreferrer" class="text-primary-app hover:underline font-semibold">${t}</a>`;
      });

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const flushList = () => {
    if (isInsideList && currentList.length > 0) {
      renderedElements.push(
        <ul key={`ul-${elementKey++}`} className="list-disc pl-5 my-3 space-y-1.5 text-xs font-light leading-relaxed text-text-primary">
          {currentList}
        </ul>
      );
      currentList = [];
      isInsideList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') {
      flushList();
      continue;
    }

    // Terminal Code Block
    if (trimmed.startsWith('```')) {
      flushList();
      let codeLines = [];
      let lang = trimmed.slice(3).trim();
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      const codeText = codeLines.join('\n');
      
      renderedElements.push(
        <div key={`code-${elementKey++}`} className="bg-black/95 dark:bg-[#181818] rounded-xl overflow-hidden border border-border-app/40 my-4 shadow-md font-mono">
          <div className="bg-hover-app/60 px-4 py-2 flex items-center justify-between border-b border-border-app/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></span>
              <span className="text-[10px] text-text-secondary ml-2 font-semibold uppercase">{lang || 'terminal'}</span>
            </div>
          </div>
          <pre className="p-4 text-xs text-orange-400 dark:text-orange-300 overflow-x-auto leading-relaxed">
            <code>{codeText}</code>
          </pre>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith('#')) {
      flushList();
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const headingClasses = 
          level === 1 ? 'text-xl font-bold font-heading mt-6 mb-3 text-text-primary border-b border-border-app/40 pb-1' :
          level === 2 ? 'text-lg font-bold font-heading mt-5 mb-2.5 text-text-primary' :
          level === 3 ? 'text-base font-bold font-heading mt-4 mb-2 text-text-primary' :
          'text-sm font-semibold font-heading mt-3 mb-1 text-text-primary';
        
        const Tag = `h${level}` as any;
        renderedElements.push(
          <Tag key={`h-${elementKey++}`} className={headingClasses}>
            {renderTextWithInlineFormatting(text)}
          </Tag>
        );
        continue;
      }
    }

    if (trimmed.startsWith('>')) {
      flushList();
      const text = trimmed.replace(/^>\s*/, '');
      renderedElements.push(
        <blockquote key={`q-${elementKey++}`} className="border-l-4 border-[#ff6b00] bg-[#ff6b00]/5 px-4 py-2.5 my-4 rounded-r-lg italic text-text-secondary text-xs">
          {renderTextWithInlineFormatting(text)}
        </blockquote>
      );
      continue;
    }

    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('+')) {
      isInsideList = true;
      const text = trimmed.replace(/^[-*+]\s*/, '');
      currentList.push(
        <li key={`li-${elementKey++}`}>
          {renderTextWithInlineFormatting(text)}
        </li>
      );
      continue;
    }

    flushList();
    renderedElements.push(
      <p key={`p-${elementKey++}`} className="my-2.5 text-xs font-light leading-relaxed text-text-primary">
        {renderTextWithInlineFormatting(line)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1">{renderedElements}</div>;
};

export const Blogs: React.FC = () => {
  const { blogs, addBlog, updateBlog, deleteBlog, setNewBlogOpen, authors, addAuthor } = useChai();

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
  const [authorName, setAuthorName] = useState('');
  const [newAuthorInput, setNewAuthorInput] = useState('');

  // UI display toggles
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [isSettingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  
  // Image & CTA Insertion Modals
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [isCtaModalOpen, setCtaModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

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
    const isWrapper = symbol === '**' || symbol === '*' || symbol === '`';
    const replacement = symbol + (selectedText || placeholder) + (isWrapper ? symbol : '');
    
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

  const insertImageMarkdown = (url: string, alt: string) => {
    const textToInsert = `![${alt || 'image'}](${url})`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(prev => prev + '\n' + textToInsert + '\n');
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setContent(
      textarea.value.substring(0, start) +
      textToInsert +
      textarea.value.substring(end)
    );
    setImageUrl('');
    setImageAlt('');
    setImageModalOpen(false);
  };

  const insertCtaMarkdown = (text: string, url: string) => {
    const textToInsert = `\n[cta:${text || 'Click Here'}](${url || 'https://'})\n`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(prev => prev + textToInsert);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setContent(
      textarea.value.substring(0, start) +
      textToInsert +
      textarea.value.substring(end)
    );
    setCtaText('');
    setCtaUrl('');
    setCtaModalOpen(false);
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
    setAuthorName('');
    setNewAuthorInput('');
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
    setAuthorName(blog.authorName || '');
    setNewAuthorInput('');
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
      status: (isDraft ? 'draft' : 'published') as 'draft' | 'published',
      authorName: authorName || undefined
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
                  <div className="flex flex-wrap items-center gap-1.5 py-1.5 px-3 border border-border-app/60 rounded-xl bg-hover-app/20 text-text-secondary sticky top-0 z-10 backdrop-blur-md">
                    <button type="button" onClick={() => insertMarkdown('**', 'bold text')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs cursor-pointer" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => insertMarkdown('*', 'italic text')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs cursor-pointer" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => insertMarkdown('# ', 'Heading 1')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs cursor-pointer" title="Heading"><Heading className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => insertMarkdown('[', '](https://)')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs cursor-pointer" title="Link"><Link2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => insertMarkdown('`', 'inline code')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs cursor-pointer" title="Code"><Code className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => insertMarkdown('\n> ', 'blockquote')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs cursor-pointer" title="Quote"><Quote className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => insertMarkdown('\n- ', 'list item')} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs cursor-pointer" title="List"><List className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => setImageModalOpen(true)} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs cursor-pointer" title="Image"><ImageIcon className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => insertMarkdown('==', 'highlighted text')} className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-[#ff6b00] rounded text-[10px] font-bold hover:bg-amber-500/20 cursor-pointer" title="Highlight Text">Highlight</button>
                    <button type="button" onClick={() => insertMarkdown('[orange-gradient:', 'gradient text]')} className="px-2 py-1 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-orange-500 rounded text-[10px] font-extrabold hover:opacity-80 cursor-pointer" title="Orange Gradient Text">Orange Gradient</button>
                    <button type="button" onClick={() => insertMarkdown('[stat:99%](Uptime Guaranteed)')} className="px-2 py-1 bg-hover-app border border-border-app rounded text-[10px] font-semibold hover:bg-hover-app/80 cursor-pointer" title="Insert Stat Card">Stat Card</button>
                    <button type="button" onClick={() => insertMarkdown('[callout:', 'This is a callout box]')} className="px-2 py-1 bg-[#ff6b00]/10 border border-[#ff6b00]/20 text-[#ff6b00] rounded text-[10px] font-semibold hover:opacity-85 cursor-pointer" title="Insert Callout Box">Callout</button>
                    <button type="button" onClick={() => insertMarkdown('```bash\n', 'echo "Hello World"\n```')} className="px-2 py-1 bg-black/5 dark:bg-white/5 border border-border-app rounded text-[10px] font-mono hover:bg-black/10 cursor-pointer" title="Insert Terminal Shell">Terminal</button>
                    <button type="button" onClick={() => setCtaModalOpen(true)} className="p-1.5 rounded hover:bg-hover-app hover:text-text-primary text-xs flex items-center gap-1 font-bold border border-primary-app/20 px-2 text-primary-app ml-1 cursor-pointer" title="Add CTA Button">
                      <PenTool className="w-3 h-3 text-accent-app" />
                      <span className="text-[10px]">Add CTA</span>
                    </button>
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
                  <div className="border-t border-border-app/40 pt-4">
                    <MarkdownRenderer content={content} />
                  </div>
                </div>
              )}
            </div>

            {/* Image Insertion Modal */}
            {isImageModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-surface-app border border-border-app rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
                  <div className="flex items-center justify-between border-b border-border-app pb-2">
                    <h3 className="text-sm font-bold text-text-primary">Insert Image</h3>
                    <button onClick={() => setImageModalOpen(false)} className="text-text-secondary hover:text-text-primary text-xs">✕</button>
                  </div>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-text-secondary mb-1">Image URL</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-2 text-text-primary outline-none focus:border-accent-app"
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-text-secondary mb-1">Alt Text / Caption</label>
                      <input
                        type="text"
                        placeholder="A descriptive caption"
                        className="w-full bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-2 text-text-primary outline-none focus:border-accent-app"
                        value={imageAlt}
                        onChange={e => setImageAlt(e.target.value)}
                      />
                    </div>

                    <div className="relative border border-dashed border-border-app rounded-xl p-4 flex flex-col items-center justify-center bg-hover-app/20 hover:bg-hover-app/40 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64Url = event.target?.result as string;
                            insertImageMarkdown(base64Url, file.name);
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <span className="text-[10px] font-semibold text-primary-app">Upload Image from Device</span>
                      <span className="text-[9px] text-text-secondary mt-1">Converts to inline base64 data</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border-app">
                    <button
                      onClick={() => setImageModalOpen(false)}
                      className="px-3.5 py-1.5 border border-border-app text-xs rounded-lg text-text-secondary hover:bg-hover-app"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => insertImageMarkdown(imageUrl, imageAlt)}
                      className="px-3.5 py-1.5 bg-primary-app text-white dark:text-black text-xs font-bold rounded-lg hover:opacity-90 shadow"
                    >
                      Insert Image
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Insertion Modal */}
            {isCtaModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-surface-app border border-border-app rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
                  <div className="flex items-center justify-between border-b border-border-app pb-2">
                    <h3 className="text-sm font-bold text-text-primary">Insert Call To Action (CTA)</h3>
                    <button onClick={() => setCtaModalOpen(false)} className="text-text-secondary hover:text-text-primary text-xs">✕</button>
                  </div>
                  
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-text-secondary mb-1">Button Text</label>
                      <input
                        type="text"
                        placeholder="Get Started / Learn More / Try Demo"
                        className="w-full bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-2 text-text-primary outline-none focus:border-accent-app"
                        value={ctaText}
                        onChange={e => setCtaText(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-text-secondary mb-1">Destination URL</label>
                      <input
                        type="text"
                        placeholder="https://vaidya.chaibytes.in"
                        className="w-full bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-2 text-text-primary outline-none focus:border-accent-app"
                        value={ctaUrl}
                        onChange={e => setCtaUrl(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border-app">
                    <button
                      onClick={() => setCtaModalOpen(false)}
                      className="px-3.5 py-1.5 border border-border-app text-xs rounded-lg text-text-secondary hover:bg-hover-app"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => insertCtaMarkdown(ctaText, ctaUrl)}
                      className="px-3.5 py-1.5 bg-primary-app text-white dark:text-black text-xs font-bold rounded-lg hover:opacity-90 shadow"
                    >
                      Insert CTA Button
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Slide-out Sidebar Publish Settings Drawer */}
            {isSettingsDrawerOpen && (
              <div className="w-80 border-l border-border-app bg-sidebar-app p-5 overflow-y-auto space-y-5 shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between border-b border-border-app pb-2">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Publish Settings</h3>
                  <button onClick={() => setSettingsDrawerOpen(false)} className="text-text-secondary hover:text-text-primary text-xs">✕</button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-text-secondary uppercase mb-1">Author</label>
                    <select
                      value={authorName}
                      onChange={e => setAuthorName(e.target.value)}
                      className="w-full bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent-app cursor-pointer"
                    >
                      <option value="" className="bg-surface-app">— Select author —</option>
                      {authors.map(name => (
                        <option key={name} value={name} className="bg-surface-app">{name}</option>
                      ))}
                    </select>
                    <div className="flex gap-1.5 mt-2">
                      <input
                        type="text"
                        placeholder="Add new name..."
                        className="flex-1 bg-hover-app/40 border border-border-app rounded-lg px-2.5 py-1.5 text-text-primary outline-none focus:border-accent-app"
                        value={newAuthorInput}
                        onChange={e => setNewAuthorInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newAuthorInput.trim()) {
                            addAuthor(newAuthorInput);
                            setAuthorName(newAuthorInput.trim());
                            setNewAuthorInput('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newAuthorInput.trim()) {
                            addAuthor(newAuthorInput);
                            setAuthorName(newAuthorInput.trim());
                            setNewAuthorInput('');
                          }
                        }}
                        className="px-2.5 py-1.5 bg-primary-app text-white dark:text-black rounded-lg text-xs font-bold hover:opacity-90"
                      >
                        Add
                      </button>
                    </div>
                  </div>

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
                      {blog.authorName && (
                        <p className="text-[10px] font-mono text-text-secondary/60 mt-0.5">by {blog.authorName}</p>
                      )}
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
