import React, { useState, useEffect, useRef } from 'react';
import { useChai } from '../context/ChaiContext';
import { Search, PenTool, Mail, FileText, Settings, Moon, Sun, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveNav,
    theme,
    toggleTheme,
    setNewBlogOpen,
    setComposeOpen,
    setNewCampaignOpen
  } = useChai();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  const items = [
    { id: 'nav-dashboard', label: 'Go to Dashboard', category: 'Navigation', icon: FileText, action: () => setActiveNav('Dashboard') },
    { id: 'nav-blogs', label: 'Go to Blogs', category: 'Navigation', icon: PenTool, action: () => setActiveNav('Blogs') },
    { id: 'nav-newsletter', label: 'Go to Newsletter', category: 'Navigation', icon: Mail, action: () => setActiveNav('Subscribers') },
    { id: 'nav-leads', label: 'Go to Contact Leads', category: 'Navigation', icon: FileText, action: () => setActiveNav('Contact Leads') },
    { id: 'nav-clients', label: 'Go to Clients CRM', category: 'Navigation', icon: FileText, action: () => setActiveNav('Clients') },
    { id: 'nav-settings', label: 'Go to Settings', category: 'Navigation', icon: Settings, action: () => setActiveNav('Settings') },
    { id: 'act-new-blog', label: 'Write New Blog Draft', category: 'Actions', icon: PenTool, action: () => setNewBlogOpen(true) },
    { id: 'act-new-campaign', label: 'Create Newsletter Campaign', category: 'Actions', icon: Mail, action: () => setNewCampaignOpen(true) },
    { id: 'act-send-email', label: 'Compose Client Email', category: 'Actions', icon: Mail, action: () => setComposeOpen(true) },
    {
      id: 'theme-toggle',
      label: theme === 'dark' ? 'Switch to Morning Chai (Light)' : 'Switch to Midnight Brew (Dark)',
      category: 'System',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => toggleTheme()
    },
  ];

  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // Keep index inside bounds when list updates
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl mx-4 overflow-hidden border rounded-2xl shadow-2xl bg-surface-app border-border-app z-10"
          >
            {/* Search Input Area */}
            <div className="flex items-center px-4 py-3.5 border-b border-border-app">
              <Search className="w-5 h-5 mr-3 text-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent border-0 outline-none text-text-primary placeholder:text-text-secondary text-[15px]"
                placeholder="Search command palette... (Cmd+K)"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDownList}
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 rounded-md hover:bg-hover-app text-text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List Area */}
            <div className="max-h-[340px] overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-text-secondary text-sm font-light">
                  No commands found matching "{search}"
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-hover-app text-text-primary'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                      onClick={() => {
                        item.action();
                        setCommandPaletteOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-surface-app shadow-sm border border-border-app/40' : 'bg-transparent'}`}>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-app' : 'text-text-secondary'}`} />
                        </div>
                        <div>
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-[10px] ml-2.5 px-2 py-0.5 rounded border border-border-app/40 bg-hover-app font-light">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center text-[10px] gap-1 font-light opacity-80">
                          <span>Enter</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border-app bg-hover-app/40 flex items-center justify-between text-[11px] text-text-secondary">
              <div className="flex gap-4">
                <span>↑↓ to navigate</span>
                <span>Enter to select</span>
                <span>Esc to close</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <span className="px-1.5 py-0.5 border border-border-app rounded bg-surface-app shadow-sm">⌘</span>
                <span>K</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
