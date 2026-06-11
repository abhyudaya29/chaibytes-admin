import React, { useState } from 'react';
import { useChai } from '../context/ChaiContext';
import { Watermark } from './Watermark';
import { ComposeEmail } from './ComposeEmail';
import { CommandPalette } from './CommandPalette';
import {
  Menu, Bell, Search, Sun, Moon,
  PenTool, Mail, FileText, Settings, User,
  Plus, ChevronDown, CheckSquare, Layers, FolderHeart, Send
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    theme,
    toggleTheme,
    activeNav,
    setActiveNav,
    setComposeOpen,
    setNewBlogOpen,
    setNewCampaignOpen,
    setCommandPaletteOpen,
    toasts,
    removeToast
  } = useChai();

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isQuickActionsOpen, setQuickActionsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

  // Quick helper to determine active state of menu items
  const isSelected = (navName: string) => activeNav === navName;

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
  };

  return (
    <div className="min-h-screen flex text-text-primary bg-bg-app relative overflow-hidden">
      {/* Background Watermark Codes */}
      <Watermark />

      {/* Sidebar Navigation */}
      <aside
        className={`bg-sidebar-app border-r border-border-app flex flex-col justify-between transition-all duration-300 z-30 relative ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 space-y-7">
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3.5 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gradient-start to-gradient-end flex items-center justify-center text-white dark:text-black font-bold shadow-md shadow-primary-app/10 relative">
              <span className="font-heading text-lg">C</span>
              <span className="absolute -bottom-1 -right-1 text-[10px]">☕</span>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-heading font-semibold text-sm tracking-wide text-text-primary uppercase">Chaibytes</span>
                <span className="text-[10px] text-text-secondary">Brew. Code. Connect.</span>
              </div>
            )}
          </div>

          {/* Navigation Section */}
          <nav className="space-y-6">
            <div>
              <span className={`text-[10px] uppercase font-bold text-text-secondary/50 tracking-widest px-3 block mb-2 ${!isSidebarOpen && 'sr-only'}`}>
                Core Operations
              </span>
              <div className="space-y-1">
                {[
                  { name: 'Dashboard', icon: Layers },
                  { name: 'Blogs', icon: PenTool },
                  { name: 'Subscribers', icon: Mail },
                  { name: 'Email Templates', icon: FileText },
                  { name: 'Email Logs', icon: Send },
                  { name: 'Contact Leads', icon: CheckSquare },
                  { name: 'Clients', icon: FolderHeart },
                  { name: 'Assets', icon: FileText },
                  { name: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = isSelected(item.name);
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        active
                          ? 'bg-hover-app text-primary-app font-semibold border-l-4 border-primary-app'
                          : 'text-text-secondary hover:text-text-primary hover:bg-hover-app/30'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {isSidebarOpen && <span className="text-xs">{item.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-app/40">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-hover-app border flex items-center justify-center text-xs text-primary-app font-semibold">
                  F
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-text-primary leading-tight">Founder</span>
                  <span className="text-[9px] text-text-secondary">Chai & Code</span>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-hover-app text-text-secondary ml-auto"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Top Header bar */}
        <header className="h-16 border-b border-border-app bg-surface-app/75 backdrop-blur-md px-6 flex items-center justify-between gap-4">
          
          {/* Left search click trigger */}
          <div
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center bg-hover-app/40 border border-border-app/60 rounded-xl px-3 py-1.5 w-64 cursor-pointer text-text-secondary hover:border-accent-app/30 shadow-sm transition-all"
          >
            <Search className="w-4 h-4 mr-2" />
            <span className="text-xs">Quick search...</span>
            <kbd className="bg-surface-app border border-border-app px-1 py-0.5 rounded text-[9px] ml-auto font-mono">⌘K</kbd>
          </div>

          {/* Right Header Panel Actions */}
          <div className="flex items-center gap-3">
            
            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setQuickActionsOpen(!isQuickActionsOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border-app rounded-xl bg-surface-app text-xs font-semibold text-text-primary hover:bg-hover-app transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Quick Actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
              </button>
              {isQuickActionsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setQuickActionsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-surface-app border border-border-app rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <button
                      onClick={() => {
                        setNewBlogOpen(true);
                        setQuickActionsOpen(false);
                      }}
                      className="w-full text-left px-4.5 py-2 text-xs text-text-primary hover:bg-hover-app/60 flex items-center gap-2"
                    >
                      <PenTool className="w-3.5 h-3.5 text-primary-app" />
                      <span>New Blog</span>
                    </button>
                    <button
                      onClick={() => {
                        setNewCampaignOpen(true);
                        setQuickActionsOpen(false);
                      }}
                      className="w-full text-left px-4.5 py-2 text-xs text-text-primary hover:bg-hover-app/60 flex items-center gap-2"
                    >
                      <Mail className="w-3.5 h-3.5 text-accent-app" />
                      <span>New Campaign</span>
                    </button>
                    <button
                      onClick={() => {
                        setComposeOpen(true);
                        setQuickActionsOpen(false);
                      }}
                      className="w-full text-left px-4.5 py-2 text-xs text-text-primary hover:bg-hover-app/60 flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-success-app" />
                      <span>Send Client Email</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Premium Animated Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-app bg-surface-app hover:bg-hover-app transition-all text-xs font-semibold text-text-primary shadow-sm"
              title={theme === 'dark' ? 'Switch to Morning Chai' : 'Switch to Midnight Brew'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                  <span className="hidden sm:inline">Morning Chai</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Midnight Brew</span>
                </>
              )}
            </button>

            {/* Notifications panel */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!isNotificationsOpen)}
                className="p-2 border border-border-app rounded-xl bg-surface-app text-text-secondary hover:text-text-primary shadow-sm"
              >
                <Bell className="w-4 h-4" />
              </button>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-surface-app border border-border-app rounded-xl shadow-xl z-20 p-4 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Alerts</span>
                    <div className="space-y-2.5">
                      <div className="text-xs border-b border-border-app/40 pb-2">
                        <span className="font-semibold block">New form submission</span>
                        <span className="text-text-secondary font-light">Sarah Chen submitted a contact form request.</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold block">System update</span>
                        <span className="text-text-secondary font-light">Chai SDK v1.2 index update successful.</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!isProfileOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-gradient-start to-gradient-end flex items-center justify-center text-white dark:text-black font-semibold text-xs border border-border-app shadow-sm"
              >
                F
              </button>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-surface-app border border-border-app rounded-xl shadow-xl z-20 py-1.5">
                    <button
                      onClick={() => {
                        setActiveNav('Settings');
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-4.5 py-2 text-xs text-text-primary hover:bg-hover-app/60 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Founder Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveNav('Settings');
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-4.5 py-2 text-xs text-text-primary hover:bg-hover-app/60 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Preferences</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full relative">
          {children}
        </main>
      </div>

      {/* Gmail Inbox Drawer Compose Email overlay component */}
      <ComposeEmail />

      {/* Command Palette component */}
      <CommandPalette />

      {/* Toast Notifications container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg cursor-pointer transition-all duration-300 transform hover:translate-y-[-2px] animate-in fade-in slide-in-from-top-4 ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
            }`}
          >
            <span className="text-xs font-semibold">{toast.message}</span>
            <button className="text-[10px] opacity-65 hover:opacity-100 font-bold ml-2">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
};
