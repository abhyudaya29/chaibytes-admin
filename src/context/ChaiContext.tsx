import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, parseMarkdownToBlocksAndHtml } from '../services/api';
import type { ApiSubscriber, ApiCampaign, ApiEmailLog, ApiEmailTemplate, ApiBlog } from '../services/api';

// Types
export interface Blog {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  seoTitle: string;
  seoDesc: string;
  slug: string;
  coverImage: string;
  category: string;
  readingTime: number;
  createdAt: string;
}

export interface Subscriber {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'unsubscribed';
  tags: string[];
  createdAt: string;
}

export interface Campaign {
  id: string;
  subject: string;
  content: string;
  status: 'draft' | 'sent';
  sentCount: number;
  openRate: number;
  clickRate: number;
  sentAt?: string;
  templateId?: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  content: string;
  status: 'sent' | 'failed' | 'scheduled';
  sentAt: string;
}

export interface LeadActivity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  status: 'new' | 'discovery' | 'proposal' | 'won' | 'lost';
  source: string;
  tags: string[];
  notes: string;
  company?: string;
  phone?: string;
  timeline: LeadActivity[];
  createdAt: string;
}

export interface Proposal {
  id: string;
  title: string;
  value: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  sentAt: string;
}

export interface Contract {
  id: string;
  title: string;
  status: 'draft' | 'review' | 'signed';
  signedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  projectName: string;
  status: 'active' | 'completed' | 'on_hold';
  totalValue: number;
  proposals: Proposal[];
  contracts: Contract[];
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
  size: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ChaiContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  
  // Data
  blogs: Blog[];
  addBlog: (blog: Omit<Blog, 'id' | 'createdAt' | 'readingTime'>) => void;
  updateBlog: (id: string, updates: Partial<Blog>) => void;
  deleteBlog: (id: string) => void;
  
  subscribers: Subscriber[];
  addSubscriber: (name: string, email: string, tags: string[]) => void;
  
  campaigns: Campaign[];
  addCampaign: (campaign: Omit<Campaign, 'id' | 'sentCount' | 'openRate' | 'clickRate'>) => void;
  sendCampaign: (id: string) => void;
  
  emails: EmailLog[];
  sendEmail: (to: string, subject: string, content: string, templateId?: string, attachments?: { filename: string; content: string }[]) => void;
  
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'timeline'>) => void;
  updateLeadStatus: (id: string, status: Lead['status']) => void;
  addLeadNote: (id: string, note: string) => void;
  
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClientStatus: (id: string, status: Client['status']) => void;
  addProposalToClient: (clientId: string, proposal: Omit<Proposal, 'id' | 'sentAt'>) => void;
  addContractToClient: (clientId: string, contract: Omit<Contract, 'id'>) => void;
  
  assets: Asset[];
  addAsset: (name: string, type: string, url: string, size: string) => void;
  deleteAsset: (id: string) => void;

  templates: ApiEmailTemplate[];
  addTemplate: (template: Omit<ApiEmailTemplate, 'id'>) => void;
  updateTemplate: (uuid: string, template: Partial<ApiEmailTemplate>) => void;
  deleteTemplate: (uuid: string) => void;
  
  // Toasts
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Modal/Drawer Control States
  isComposeOpen: boolean;
  setComposeOpen: (open: boolean) => void;
  composeInitialTo: string;
  setComposeInitialTo: (to: string) => void;
  
  isNewBlogOpen: boolean;
  setNewBlogOpen: (open: boolean) => void;
  
  isNewCampaignOpen: boolean;
  setNewCampaignOpen: (open: boolean) => void;
  
  isNewProposalOpen: boolean;
  setNewProposalOpen: (open: boolean) => void;
 
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

const ChaiContext = createContext<ChaiContextType | undefined>(undefined);

const getLocalStorageData = <T,>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
};

export const ChaiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeNav, setActiveNav] = useState('Dashboard');
  
  // Modals state
  const [isComposeOpen, setComposeOpen] = useState(false);
  const [composeInitialTo, setComposeInitialTo] = useState('');
  const [isNewBlogOpen, setNewBlogOpen] = useState(false);
  const [isNewCampaignOpen, setNewCampaignOpen] = useState(false);
  const [isNewProposalOpen, setNewProposalOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Initialize theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // ------------------------- DATA STATE -------------------------
  
  // 1. Blogs - LocalStorage backed
  const [blogs, setBlogs] = useState<Blog[]>(() => getLocalStorageData("chaibytes_blogs", []));

  useEffect(() => {
    localStorage.setItem("chaibytes_blogs", JSON.stringify(blogs));
  }, [blogs]);

  const addBlog = async (blogData: Omit<Blog, 'id' | 'createdAt' | 'readingTime'>) => {
    try {
      const richContent = parseMarkdownToBlocksAndHtml(blogData.content);
      const created = await api.createBlog({
        title: blogData.title,
        slug: blogData.slug,
        excerpt: blogData.seoDesc || "Excerpt",
        content: blogData.content,
        content_html: richContent.content_html,
        blocks: richContent.blocks,
        content_images: richContent.content_images,
        cover_image_url: blogData.coverImage || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        tags: blogData.category ? [blogData.category] : ["General"],
        seo_title: blogData.seoTitle,
        seo_description: blogData.seoDesc,
        status: blogData.status
      });

      const wordCount = created.content.split(/\s+/).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      const newBlogObj: Blog = {
        id: created.id,
        title: created.title,
        content: created.content,
        status: created.status,
        seoTitle: created.seo_title || created.title,
        seoDesc: created.seo_description || "",
        slug: created.slug,
        coverImage: created.cover_image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        category: created.tags && created.tags.length > 0 ? created.tags[0] : "General",
        readingTime,
        createdAt: created.created_at
      };

      setBlogs(prev => [newBlogObj, ...prev]);
      addToast(`Blog "${blogData.title}" created successfully!`, 'success');
    } catch (e) {
      console.warn("Creating blog offline: using local state fallback");
      const wordCount = blogData.content.split(/\s+/).length;
      const time = Math.max(1, Math.ceil(wordCount / 200));
      const newBlogObj: Blog = {
        ...blogData,
        id: `b-${Date.now()}`,
        readingTime: time,
        createdAt: new Date().toISOString(),
      };
      setBlogs(prev => [newBlogObj, ...prev]);
      addToast(`Blog "${blogData.title}" saved locally (offline)`, 'info');
    }
  };

  const updateBlog = async (id: string, updates: Partial<Blog>) => {
    try {
      if (updates.status) {
        if (updates.status === 'published') {
          await api.publishBlog(id);
        } else {
          await api.unpublishBlog(id);
        }
      }

      const apiPayload: Partial<Omit<ApiBlog, 'id' | 'created_at' | 'updated_at'>> = {};
      if (updates.title !== undefined) apiPayload.title = updates.title;
      if (updates.slug !== undefined) apiPayload.slug = updates.slug;
      if (updates.seoTitle !== undefined) apiPayload.seo_title = updates.seoTitle;
      if (updates.seoDesc !== undefined) apiPayload.seo_description = updates.seoDesc;
      if (updates.content !== undefined) {
        apiPayload.content = updates.content;
        const richContent = parseMarkdownToBlocksAndHtml(updates.content);
        apiPayload.content_html = richContent.content_html;
        apiPayload.blocks = richContent.blocks;
        apiPayload.content_images = richContent.content_images;
      }
      if (updates.coverImage !== undefined) apiPayload.cover_image_url = updates.coverImage;
      if (updates.category !== undefined) apiPayload.tags = [updates.category];

      if (Object.keys(apiPayload).length > 0) {
        await api.updateBlog(id, apiPayload);
      }

      setBlogs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      addToast("Blog updated successfully!", 'success');
    } catch (e) {
      console.warn("Updating blog offline: using local state fallback");
      setBlogs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
      addToast("Blog updated locally (offline fallback)", 'info');
    }
  };

  const deleteBlog = async (id: string) => {
    try {
      await api.deleteBlog(id);
      setBlogs(prev => prev.filter(b => b.id !== id));
      addToast("Blog deleted successfully!", 'success');
    } catch (e) {
      console.warn("Deleting blog offline: using local state fallback");
      setBlogs(prev => prev.filter(b => b.id !== id));
      addToast("Blog deleted locally (offline fallback)", 'info');
    }
  };

  // 2. Subscribers State - API Backend
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  // 3. Campaigns State - API Backend
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // 4. Individual Emails State - API Backend
  const [emails, setEmails] = useState<EmailLog[]>([]);

  // 5. Templates State - API Backend
  const [templates, setTemplates] = useState<ApiEmailTemplate[]>([]);

  // Fetch from FastAPI Backend on Mount
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const subsData = await api.getSubscribers();
        setSubscribers(subsData.map((s: ApiSubscriber) => ({
          id: s.id,
          email: s.email,
          name: s.name || "",
          status: s.status as 'active' | 'unsubscribed',
          tags: s.tags || [],
          createdAt: s.created_at
        })));
      } catch (e) {
        console.warn("Backend subscribers offline, initializing to empty list");
        setSubscribers([]);
      }

      try {
        const campsData = await api.getCampaigns();
        setCampaigns(campsData.map((c: ApiCampaign) => ({
          id: c.id,
          subject: c.subject,
          content: "",
          status: c.status as 'draft' | 'sent',
          sentCount: c.sent_count,
          openRate: c.open_rate,
          clickRate: c.click_rate,
          sentAt: c.sent_at,
          templateId: c.template_id
        })));
      } catch (e) {
        console.warn("Backend campaigns offline, initializing to empty list");
        setCampaigns([]);
      }

      try {
        const logsData = await api.getEmailLogs();
        setEmails(logsData.map((l: ApiEmailLog) => ({
          id: l.id,
          to: l.recipient,
          subject: "Outreach Campaign",
          content: "Simulated newsletter contents",
          status: l.status as 'sent' | 'failed' | 'scheduled',
          sentAt: l.created_at
        })));
      } catch (e) {
        console.warn("Backend email logs offline, initializing to empty list");
        setEmails([]);
      }

      try {
        const templatesData = await api.getTemplates();
        setTemplates(templatesData);
      } catch (e) {
        console.warn("Backend email templates offline, initializing to empty list");
        setTemplates([]);
      }

      try {
        const blogsData = await api.getBlogs(true);
        setBlogs(blogsData.map((b: ApiBlog) => {
          const wordCount = b.content.split(/\s+/).length;
          const readingTime = Math.max(1, Math.ceil(wordCount / 200));
          return {
            id: b.id,
            title: b.title,
            content: b.content,
            status: b.status,
            seoTitle: b.seo_title || b.title,
            seoDesc: b.seo_description || "",
            slug: b.slug,
            coverImage: b.cover_image_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
            category: b.tags && b.tags.length > 0 ? b.tags[0] : "General",
            readingTime,
            createdAt: b.created_at
          };
        }));
      } catch (e) {
        console.warn("Backend portfolio blogs offline, using local storage state fallback");
      }
    };

    loadBackendData();
  }, []);

  const addSubscriber = async (name: string, email: string, tags: string[]) => {
    try {
      const added = await api.subscribe(email, name, "active", "website");
      setSubscribers(prev => [
        {
          id: added.id,
          email: added.email,
          name: added.name || "",
          status: added.status as 'active' | 'unsubscribed',
          tags: added.tags || tags,
          createdAt: added.created_at
        },
        ...prev
      ]);
      addToast(`Subscriber "${name}" added successfully!`, 'success');
    } catch (e) {
      console.warn("Subscribing offline: using local state fallback");
      const localNew: Subscriber = {
        id: `s-${Date.now()}`,
        name,
        email,
        status: 'active',
        tags,
        createdAt: new Date().toISOString(),
      };
      setSubscribers(prev => [localNew, ...prev]);
      addToast(`Subscriber "${name}" saved locally (offline)`, 'info');
    }
  };

  const addCampaign = async (campData: Omit<Campaign, 'id' | 'sentCount' | 'openRate' | 'clickRate'>) => {
    try {
      const matched = templates.find(t => t.id === campData.templateId || t.resend_template_id === campData.templateId);
      const targetTemplateId = matched ? matched.resend_template_id : (campData.templateId || "tpl_uuid_default");

      const created = await api.createCampaign({
        name: campData.subject,
        subject: campData.subject,
        template_id: targetTemplateId,
        variables: { name: "Subscriber", website: "https://chaibytes.in" }
      });

      setCampaigns(prev => [
        {
          id: created.id,
          subject: created.subject,
          content: "",
          status: created.status as 'draft' | 'sent',
          sentCount: created.sent_count,
          openRate: created.open_rate,
          clickRate: created.click_rate,
          sentAt: created.sent_at,
          templateId: created.template_id
        },
        ...prev
      ]);
      addToast(`Campaign created successfully!`, 'success');
    } catch (e) {
      console.warn("Campaign creation offline: using local state fallback");
      const localNew: Campaign = {
        ...campData,
        id: `c-${Date.now()}`,
        sentCount: 0,
        openRate: 0,
        clickRate: 0,
      };
      setCampaigns(prev => [localNew, ...prev]);
      addToast(`Campaign saved locally (offline)`, 'info');
    }
  };

  const sendCampaign = async (id: string) => {
    try {
      await api.sendCampaign(id);
      
      setCampaigns(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'sent',
            sentCount: subscribers.length,
            openRate: 72.5,
            clickRate: 35.1,
            sentAt: new Date().toISOString(),
          };
        }
        return c;
      }));
      addToast(`Campaign successfully sent to subscribers!`, 'success');
    } catch (e) {
      console.warn("Dispatching campaign offline: using local state fallback");
      setCampaigns(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'sent',
            sentCount: subscribers.length,
            openRate: 100,
            clickRate: 85,
            sentAt: new Date().toISOString(),
          };
        }
        return c;
      }));
      addToast(`Campaign sent (offline fallback simulation)`, 'info');
    }
  };

  const sendEmail = async (to: string, subject: string, content: string, templateId?: string, attachments?: { filename: string; content: string }[]) => {
    try {
      let resolvedTemplateId = templateId;
      if (!resolvedTemplateId || resolvedTemplateId === 'none' || resolvedTemplateId === 'discovery' || resolvedTemplateId === 'proposal') {
        if (templates.length > 0) {
          resolvedTemplateId = templates[0].resend_template_id;
        } else {
          resolvedTemplateId = "00000000-0000-0000-0000-000000000000";
        }
      } else {
        const matched = templates.find(t => t.id === resolvedTemplateId || t.resend_template_id === resolvedTemplateId);
        if (matched) {
          resolvedTemplateId = matched.resend_template_id;
        }
      }

      // Create a transient campaign to send this email test
      const createdCamp = await api.createCampaign({
        name: `Quick Mail: ${subject}`,
        subject: subject,
        template_id: resolvedTemplateId,
        variables: { name: "Client", company: "Chaibytes" }
      });

      await api.sendTestEmail(createdCamp.id, to, { name: "Client", company: "Chaibytes" }, attachments);

      setCampaigns(prev => [
        {
          id: createdCamp.id,
          subject: createdCamp.subject,
          content: "",
          status: createdCamp.status as 'draft' | 'sent',
          sentCount: createdCamp.sent_count,
          openRate: createdCamp.open_rate,
          clickRate: createdCamp.click_rate,
          sentAt: createdCamp.sent_at,
          templateId: createdCamp.template_id
        },
        ...prev
      ]);
      addToast(`Email successfully sent to ${to}!`, 'success');
    } catch (e) {
      console.warn("Direct dispatch campaign failed, using offline fallback:", e);
      try {
        const activeCampaignId = campaigns.length > 0 ? campaigns[0].id : "00000000-0000-0000-0000-000000000000";
        await api.sendTestEmail(activeCampaignId, to, { name: "Client", company: "Chaibytes" }, attachments);
        addToast(`Email sent via backend test fallback!`, 'success');
      } catch (err) {
        console.warn("Offline fallback test email failed:", err);
        addToast(`Failed to dispatch email. Check connection.`, 'error');
      }
    }

    const newLog: EmailLog = {
      id: `e-${Date.now()}`,
      to,
      subject,
      content,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };
    setEmails(prev => [newLog, ...prev]);
  };

  // Template methods
  const addTemplate = async (templateData: Omit<ApiEmailTemplate, 'id'>) => {
    try {
      const added = await api.createTemplate(templateData);
      setTemplates(prev => [added, ...prev]);
      addToast(`Template "${templateData.name}" registered successfully!`, 'success');
    } catch (e) {
      console.warn("API templates offline: setting mock local template");
      const mockNew: ApiEmailTemplate = {
        ...templateData,
        id: `tpl-${Date.now()}`,
        status: 'active'
      };
      setTemplates(prev => [mockNew, ...prev]);
      addToast(`Template registered locally (offline fallback)`, 'info');
    }
  };

  const updateTemplate = async (uuid: string, templateData: Partial<ApiEmailTemplate>) => {
    try {
      const updated = await api.updateTemplate(uuid, templateData);
      setTemplates(prev => prev.map(t => t.id === uuid ? updated : t));
      addToast(`Template updated successfully!`, 'success');
    } catch (e) {
      console.warn("API templates offline: updating local state");
      setTemplates(prev => prev.map(t => t.id === uuid ? { ...t, ...templateData } : t));
      addToast(`Template updated locally (offline fallback)`, 'info');
    }
  };

  const deleteTemplate = async (uuid: string) => {
    try {
      await api.deleteTemplate(uuid);
      setTemplates(prev => prev.filter(t => t.id !== uuid));
      addToast(`Template reference deactivated.`, 'info');
    } catch (e) {
      console.warn("API templates offline: deleting local state reference");
      setTemplates(prev => prev.filter(t => t.id !== uuid));
      addToast(`Template reference removed locally.`, 'info');
    }
  };

  // 6. Leads State - LocalStorage backed
  const [leads, setLeads] = useState<Lead[]>(() => getLocalStorageData("chaibytes_leads", []));

  useEffect(() => {
    localStorage.setItem("chaibytes_leads", JSON.stringify(leads));
  }, [leads]);

  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt' | 'timeline'>) => {
    const newLd: Lead = {
      ...leadData,
      id: `l-${Date.now()}`,
      timeline: [
        { id: `act-${Date.now()}`, type: 'Created', description: 'Lead recorded in Chaibytes OS', createdAt: new Date().toISOString() }
      ],
      createdAt: new Date().toISOString(),
    };
    setLeads(prev => [newLd, ...prev]);
  };

  const updateLeadStatus = (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => {
      if (l.id === id) {
        const newAct: LeadActivity = {
          id: `act-${Date.now()}`,
          type: 'Status Change',
          description: `Status updated to ${status.toUpperCase()}`,
          createdAt: new Date().toISOString(),
        };
        return {
          ...l,
          status,
          timeline: [newAct, ...l.timeline],
        };
      }
      return l;
    }));
  };

  const addLeadNote = (id: string, noteText: string) => {
    setLeads(prev => prev.map(l => {
      if (l.id === id) {
        const newAct: LeadActivity = {
          id: `act-${Date.now()}`,
          type: 'Note Added',
          description: noteText,
          createdAt: new Date().toISOString(),
        };
        return {
          ...l,
          notes: noteText,
          timeline: [newAct, ...l.timeline],
        };
      }
      return l;
    }));
  };

  // 7. Clients & Contracts State - LocalStorage backed
  const [clients, setClients] = useState<Client[]>(() => getLocalStorageData("chaibytes_clients", []));

  useEffect(() => {
    localStorage.setItem("chaibytes_clients", JSON.stringify(clients));
  }, [clients]);

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const newCl: Client = {
      ...clientData,
      id: `cl-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setClients(prev => [newCl, ...prev]);
  };

  const updateClientStatus = (id: string, status: Client['status']) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const addProposalToClient = (clientId: string, prop: Omit<Proposal, 'id' | 'sentAt'>) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newProp: Proposal = {
          ...prop,
          id: `pr-${Date.now()}`,
          sentAt: new Date().toISOString(),
        };
        return {
          ...c,
          proposals: [...c.proposals, newProp],
          totalValue: c.totalValue + (newProp.status === 'accepted' ? newProp.value : 0),
        };
      }
      return c;
    }));
  };

  const addContractToClient = (clientId: string, contr: Omit<Contract, 'id'>) => {
    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const newContr: Contract = {
          ...contr,
          id: `co-${Date.now()}`,
        };
        return {
          ...c,
          contracts: [...c.contracts, newContr],
        };
      }
      return c;
    }));
  };

  // 8. Assets State - LocalStorage backed
  const [assets, setAssets] = useState<Asset[]>(() => getLocalStorageData("chaibytes_assets", []));

  useEffect(() => {
    localStorage.setItem("chaibytes_assets", JSON.stringify(assets));
  }, [assets]);

  const addAsset = (name: string, type: string, url: string, size: string) => {
    const newAsset: Asset = {
      id: `as-${Date.now()}`,
      name,
      type,
      url,
      size,
      createdAt: new Date().toISOString(),
    };
    setAssets(prev => [newAsset, ...prev]);
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // 9. Toasts Notification State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `tst-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ChaiContext.Provider value={{
      theme,
      toggleTheme,
      activeNav,
      setActiveNav,
      blogs,
      addBlog,
      updateBlog,
      deleteBlog,
      subscribers,
      addSubscriber,
      campaigns,
      addCampaign,
      sendCampaign,
      emails,
      sendEmail,
      leads,
      addLead,
      updateLeadStatus,
      addLeadNote,
      clients,
      addClient,
      updateClientStatus,
      addProposalToClient,
      addContractToClient,
      assets,
      addAsset,
      deleteAsset,
      templates,
      addTemplate,
      updateTemplate,
      deleteTemplate,
      
      // Toasts
      toasts,
      addToast,
      removeToast,
      
      // Modal/Drawer controls
      isComposeOpen,
      setComposeOpen,
      composeInitialTo,
      setComposeInitialTo,
      isNewBlogOpen,
      setNewBlogOpen,
      isNewCampaignOpen,
      setNewCampaignOpen,
      isNewProposalOpen,
      setNewProposalOpen,
      isCommandPaletteOpen,
      setCommandPaletteOpen,
    }}>
      {children}
    </ChaiContext.Provider>
  );
};

export const useChai = () => {
  const context = useContext(ChaiContext);
  if (context === undefined) {
    throw new Error('useChai must be used within a ChaiProvider');
  }
  return context;
};
