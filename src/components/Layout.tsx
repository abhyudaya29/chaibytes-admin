import React, { useState } from 'react';
import { useChai } from '../context/ChaiContext';
import { Watermark } from './Watermark';
import { ComposeEmail } from './ComposeEmail';
import { CommandPalette } from './CommandPalette';
import {
  Menu, Bell, Search, Sun, Moon,
  PenTool, Mail, FileText, Settings, User,
  Plus, ChevronDown, CheckSquare, Layers, FolderHeart, Send, LogOut, Users, LayoutTemplate, X
} from 'lucide-react';
import { navigateTo } from '../utils/navigation';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
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

  const [isSidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isQuickActionsOpen, setQuickActionsOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

  // Quick helper to determine active state of menu items
  const isSelected = (navName: string) => activeNav === navName;

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    const pathByNav: Record<string, string> = {
      Dashboard: '/',
      'Contact Leads': '/leads',
      Subscribers: '/subscribers',
      Blogs: '/content',
      Clients: '/clients',
      Assets: '/assets',
      Settings: '/settings',
      'Email Overview': '/email',
      'Email Templates': '/email/templates',
      'Email Activity': '/email/activity',
      Integrations: '/settings/integrations',
    };
    if (pathByNav[nav]) {
      navigateTo(pathByNav[nav]);
    }
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  const workspaceNavItems = [
    { name: 'Dashboard', label: 'Overview', icon: Layers },
    { name: 'Contact Leads', label: 'Leads', icon: CheckSquare },
    { name: 'Subscribers', label: 'Subscribers', icon: Mail },
    { name: 'Blogs', label: 'Content', icon: PenTool },
    { name: 'Clients', label: 'Clients', icon: FolderHeart },
    { name: 'Assets', label: 'Assets', icon: FileText },
  ];

  const emailNavItems = [
    { name: 'Email Overview', label: 'Overview', icon: Mail },
    { name: 'Email Templates', label: 'Templates', icon: LayoutTemplate },
    { name: 'Email Activity', label: 'Activity', icon: Send },
  ];

  const settingsNavItems = [
    { name: 'Settings', label: 'Settings', icon: Settings },
    { name: 'Integrations', label: 'Integrations', icon: Settings },
  ];

  const renderNavItem = (item: { name: string; label: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const currentPath = window.location.pathname;
    const pathByName: Record<string, string> = {
      Dashboard: '/',
      'Contact Leads': '/leads',
      Subscribers: '/subscribers',
      Blogs: '/content',
      Clients: '/clients',
      Assets: '/assets',
      Settings: '/settings',
      'Email Overview': '/email',
      'Email Templates': '/email/templates',
      'Email Activity': '/email/activity',
      Integrations: '/settings/integrations',
    };
    const pathActive =
      pathByName[item.name] === currentPath ||
      (item.name === 'Email Overview' && currentPath === '/email') ||
      (item.name === 'Email Templates' && currentPath.startsWith('/email/templates')) ||
      (item.name === 'Email Activity' && currentPath === '/email/activity') ||
      (item.name === 'Integrations' && currentPath === '/settings/integrations');
    const active = isSelected(item.name) || pathActive;
    return (
      <button
        key={item.name}
        onClick={() => handleNavClick(item.name)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
          active
            ? 'bg-primary-app/10 text-primary-app font-semibold'
            : 'text-text-secondary hover:text-text-primary hover:bg-hover-app/30'
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {isSidebarOpen && <span className="text-sm">{item.label}</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex text-text-primary bg-bg-app relative overflow-hidden">
      <Watermark />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/45 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 bg-sidebar-app border-r border-border-app flex flex-col justify-between transition-all duration-300 z-30 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:w-20'
        }`}
      >
        <div className="p-5 space-y-8">
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-lg bg-primary-app flex items-center justify-center text-white font-bold shadow-sm">
              <span className="font-heading text-lg">C</span>
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-heading font-semibold text-sm tracking-wide text-text-primary uppercase">Chaibytes</span>
                <span className="text-[11px] text-text-secondary">CRM workspace</span>
              </div>
            )}
            <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation" className="ml-auto rounded-lg p-2 text-text-secondary hover:bg-hover-app lg:hidden">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Section */}
          <nav className="space-y-6">
            <div>
              <span className={`text-[10px] uppercase font-bold text-text-secondary/70 tracking-widest px-3 block mb-3 ${!isSidebarOpen && 'sr-only'}`}>
                Workspace
              </span>
              <div className="space-y-1.5">
                {workspaceNavItems.map(renderNavItem)}
              </div>
            </div>

            <div>
              <span className={`text-[10px] uppercase font-bold text-text-secondary/70 tracking-widest px-3 block mb-3 ${!isSidebarOpen && 'sr-only'}`}>
                Email
              </span>
              <div className="space-y-1.5">
                {emailNavItems.map(renderNavItem)}
              </div>
            </div>

            <div>
              <span className={`text-[10px] uppercase font-bold text-text-secondary/70 tracking-widest px-3 block mb-3 ${!isSidebarOpen && 'sr-only'}`}>
                Settings
              </span>
              <div className="space-y-1.5">
                {settingsNavItems.map(renderNavItem)}
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-border-app/60">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-hover-app border border-border-app flex items-center justify-center text-xs text-primary-app font-semibold">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary leading-tight">Admin</span>
                  <span className="text-[10px] text-text-secondary">Authenticated</span>
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
        <header className="relative z-20 h-16 border-b border-border-app bg-surface-app/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation" className="shrink-0 rounded-lg border border-border-app p-2 text-text-secondary hover:bg-hover-app lg:hidden">
            <Menu className="h-4 w-4" />
          </button>
          
          {/* Left search click trigger */}
          <div
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden sm:flex items-center bg-hover-app/50 border border-border-app rounded-lg px-3 py-2 w-48 lg:w-72 cursor-pointer text-text-secondary hover:border-primary-app/40 transition-all"
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
              className="flex items-center gap-1.5 px-3 py-2 border border-border-app rounded-lg bg-surface-app text-xs font-semibold text-text-primary hover:bg-hover-app transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Quick Actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
              </button>
              {isQuickActionsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setQuickActionsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-surface-app border border-border-app rounded-lg shadow-xl z-20 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
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
                      <span>Manual Email</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Premium Animated Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-app bg-surface-app hover:bg-hover-app transition-all text-xs font-semibold text-text-primary"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                  <span className="hidden sm:inline">Light mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="hidden sm:inline">Dark mode</span>
                </>
              )}
            </button>

            {/* Notifications panel */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!isNotificationsOpen)}
                className="p-2 border border-border-app rounded-lg bg-surface-app text-text-secondary hover:text-text-primary"
              >
                <Bell className="w-4 h-4" />
              </button>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 bg-surface-app border border-border-app rounded-lg shadow-xl z-20 p-4 space-y-3">
                    <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Alerts</span>
                    <div className="space-y-2.5">
                      <div className="text-xs border-b border-border-app/40 pb-2">
                        <span className="font-semibold block">New form submission</span>
                        <span className="text-text-secondary">A lead submitted a website form.</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold block">Email automation</span>
                        <span className="text-text-secondary">Resend template mapping is ready.</span>
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
                className="w-9 h-9 rounded-full bg-primary-app flex items-center justify-center text-white font-semibold text-xs border border-border-app"
              >
                F
              </button>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-surface-app border border-border-app rounded-lg shadow-xl z-20 py-1.5">
                    <button
                      onClick={() => {
                        setActiveNav('Settings');
                        setProfileOpen(false);
                      }}
                      className="w-full text-left px-4.5 py-2 text-xs text-text-primary hover:bg-hover-app/60 flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Profile</span>
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
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-4.5 py-2 text-xs text-red-400 hover:bg-hover-app/60 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-[1440px] mx-auto w-full relative">
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
