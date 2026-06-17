const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000/api";

export interface ApiBlog {
  id: string; // uuid
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  content_html?: string;
  blocks?: any[];
  content_images?: any[];
  cover_image_url?: string;
  tags?: string[];
  seo_title?: string;
  seo_description?: string;
  author_name?: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export function parseMarkdownToBlocksAndHtml(markdown: string) {
  const lines = markdown.split('\n');
  const blocks: any[] = [];
  const contentImages: any[] = [];
  let htmlResult = '';
  
  let currentBlockType: string | null = null;
  let currentBlockText: string[] = [];
  let blockCounter = 0;
  
  const finishBlock = () => {
    if (currentBlockText.length === 0) return;
    const text = currentBlockText.join('\n').trim();
    if (!text) return;
    
    blockCounter++;
    const id = `block-${Date.now()}-${blockCounter}`;
    
    if (currentBlockType === 'paragraph') {
      blocks.push({
        id,
        type: 'paragraph',
        data: { text }
      });
      htmlResult += `<p>${text}</p>`;
    } else if (currentBlockType === 'heading') {
      const match = text.match(/^(#{1,6})\s+(.*)$/);
      const level = match ? match[1].length : 1;
      const cleanText = match ? match[2] : text;
      blocks.push({
        id,
        type: 'header',
        data: { text: cleanText, level }
      });
      htmlResult += `<h${level}>${cleanText}</h${level}>`;
    } else if (currentBlockType === 'image') {
      const match = text.match(/^!\[(.*?)\]\((.*?)(?:\s+"(.*?)"|\s+'(.*?)')?\)$/);
      if (match) {
        const alt = match[1] || '';
        const url = match[2] || '';
        const caption = match[3] || match[4] || '';
        
        blocks.push({
          id,
          type: 'image',
          data: { url, alt, caption }
        });
        
        contentImages.push({
          url,
          alt,
          caption: caption || undefined
        });
        
        htmlResult += `<figure><img src="${url}" alt="${alt}">${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
      }
    } else if (currentBlockType === 'code') {
      blocks.push({
        id,
        type: 'code',
        data: { text }
      });
      htmlResult += `<pre><code>${text}</code></pre>`;
    } else if (currentBlockType === 'list') {
      blocks.push({
        id,
        type: 'list',
        data: { style: 'unordered', items: [text] }
      });
      htmlResult += `<ul><li>${text}</li></ul>`;
    } else if (currentBlockType === 'quote') {
      blocks.push({
        id,
        type: 'quote',
        data: { text }
      });
      htmlResult += `<blockquote>${text}</blockquote>`;
    }
    
    currentBlockText = [];
    currentBlockType = null;
  };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed === '') {
      finishBlock();
      continue;
    }
    
    if (trimmed.startsWith('#')) {
      finishBlock();
      currentBlockType = 'heading';
      currentBlockText.push(line);
      finishBlock();
    } else if (trimmed.startsWith('![') && trimmed.endsWith(')')) {
      finishBlock();
      currentBlockType = 'image';
      currentBlockText.push(trimmed);
      finishBlock();
    } else if (trimmed.startsWith('>')) {
      if (currentBlockType !== 'quote') {
        finishBlock();
        currentBlockType = 'quote';
      }
      currentBlockText.push(trimmed.replace(/^>\s*/, ''));
    } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('+')) {
      if (currentBlockType !== 'list') {
        finishBlock();
        currentBlockType = 'list';
      }
      currentBlockText.push(trimmed.replace(/^[-*+]\s*/, ''));
    } else if (trimmed.startsWith('```')) {
      if (currentBlockType === 'code') {
        finishBlock();
      } else {
        finishBlock();
        currentBlockType = 'code';
      }
    } else {
      if (currentBlockType !== 'paragraph' && currentBlockType !== 'code') {
        finishBlock();
        currentBlockType = 'paragraph';
      }
      currentBlockText.push(line);
    }
  }
  finishBlock();
  
  return {
    content_html: htmlResult,
    blocks,
    content_images: contentImages
  };
}

export function normalizeMarkdownForPublicSite(markdown: string): string {
  const lines = markdown.split('\n');
  const normalizedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (trimmed === '') {
      normalizedLines.push('');
      continue;
    }
    
    if (trimmed.startsWith('#')) {
      if (normalizedLines.length > 0 && normalizedLines[normalizedLines.length - 1] !== '') {
        normalizedLines.push('');
      }
      normalizedLines.push(trimmed);
      normalizedLines.push('');
      continue;
    }
    
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('+')) {
      normalizedLines.push(trimmed);
      continue;
    }
    
    normalizedLines.push(trimmed);
    if (i < lines.length - 1) {
      const nextLineTrimmed = lines[i + 1].trim();
      if (nextLineTrimmed !== '' && !nextLineTrimmed.startsWith('#') && !nextLineTrimmed.startsWith('-') && !nextLineTrimmed.startsWith('*') && !nextLineTrimmed.startsWith('+')) {
        normalizedLines.push('');
      }
    }
  }
  
  const result: string[] = [];
  for (let i = 0; i < normalizedLines.length; i++) {
    if (normalizedLines[i] === '' && result[result.length - 1] === '') {
      continue;
    }
    result.push(normalizedLines[i]);
  }
  
  return result.join('\n');
}

const getHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("CHAIBYTES_INTERNAL_API_TOKEN");
  if (token) {
    headers["X-Internal-Api-Token"] = token;
  }
  return headers;
};

export interface ApiEmailTemplate {
  id: string; // uuid
  name: string;
  description?: string;
  category: string;
  resend_template_id: string;
  thumbnail_url?: string;
  status?: string; // active/inactive
}

export interface ApiSubscriber {
  id: string; // uuid
  email: string;
  name?: string;
  status: string;
  source: string;
  tags?: string[];
  created_at: string;
}

export interface ApiCampaign {
  id: string; // uuid
  name: string;
  subject: string;
  template_id: string; // uuid template reference
  variables: Record<string, any>;
  status: string;
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
}

export interface ApiEmailLog {
  id: string; // uuid
  campaign_id?: string;
  recipient: string;
  message_id?: string;
  status: string;
  reason?: string;
  created_at: string;
}

export const api = {
  // Email Templates
  async getTemplates(includeInactive = false): Promise<ApiEmailTemplate[]> {
    const query = includeInactive ? "?include_inactive=true" : "";
    const res = await fetch(`${BASE_URL}/email-templates${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch templates");
    return res.json();
  },

  async createTemplate(template: Omit<ApiEmailTemplate, 'id'>): Promise<ApiEmailTemplate> {
    const res = await fetch(`${BASE_URL}/email-templates`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error("Failed to create template");
    return res.json();
  },

  async updateTemplate(uuid: string, template: Partial<ApiEmailTemplate>): Promise<ApiEmailTemplate> {
    const res = await fetch(`${BASE_URL}/email-templates/${uuid}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error("Failed to update template");
    return res.json();
  },

  async deleteTemplate(uuid: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/email-templates/${uuid}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete template");
    return res.json();
  },

  // Subscribers
  async getSubscribers(search = ""): Promise<ApiSubscriber[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`${BASE_URL}/subscribers${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch subscribers");
    return res.json();
  },

  async subscribe(email: string, name: string, status = "active", source = "website"): Promise<ApiSubscriber> {
    const res = await fetch(`${BASE_URL}/subscribers`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, name, status, source }),
    });
    if (!res.ok) throw new Error("Failed to subscribe");
    return res.json();
  },

  async deleteSubscriber(uuid: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/subscribers/${uuid}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete subscriber");
    return res.json();
  },

  async importSubscribers(subscribers: { email: string; name?: string; status?: string; source?: string }[]): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/subscribers/import`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ subscribers }),
    });
    if (!res.ok) throw new Error("Failed to import subscribers");
    return res.json();
  },

  // Campaigns
  async getCampaigns(status?: string): Promise<ApiCampaign[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await fetch(`${BASE_URL}/campaigns${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch campaigns");
    return res.json();
  },

  async createCampaign(campaign: {
    name: string;
    subject: string;
    template_id: string;
    variables?: Record<string, any>;
  }): Promise<ApiCampaign> {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(campaign),
    });
    if (!res.ok) throw new Error("Failed to create campaign");
    return res.json();
  },

  async updateCampaign(uuid: string, campaign: Partial<ApiCampaign>): Promise<ApiCampaign> {
    const res = await fetch(`${BASE_URL}/campaigns/${uuid}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(campaign),
    });
    if (!res.ok) throw new Error("Failed to update campaign");
    return res.json();
  },

  async deleteCampaign(uuid: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/campaigns/${uuid}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete campaign");
    return res.json();
  },

  async sendCampaign(uuid: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/campaigns/${uuid}/send`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to send campaign");
    return res.json();
  },

  async scheduleCampaign(uuid: string, scheduledAt: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/campaigns/${uuid}/schedule`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ scheduled_at: scheduledAt }),
    });
    if (!res.ok) throw new Error("Failed to schedule campaign");
    return res.json();
  },

  async sendTestEmail(
    uuid: string,
    email: string,
    variables: Record<string, any> = {},
    attachments?: { filename: string; content: string }[]
  ): Promise<{ message: string }> {
    const payload: Record<string, any> = { email, variables };
    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }
    const res = await fetch(`${BASE_URL}/campaigns/${uuid}/test`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to send test email");
    return res.json();
  },

  // Logs
  async getEmailLogs(): Promise<ApiEmailLog[]> {
    const res = await fetch(`${BASE_URL}/email-logs`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch email logs");
    return res.json();
  },

  // Dashboard Analytics
  async getDashboardAnalytics(): Promise<any> {
    const res = await fetch(`${BASE_URL}/email-dashboard/analytics`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch analytics");
    return res.json();
  },

  async getBlogs(includeDrafts = false, search?: string, tag?: string): Promise<ApiBlog[]> {
    const params = new URLSearchParams();
    if (includeDrafts) params.append("include_drafts", "true");
    if (search) params.append("search", search);
    if (tag) params.append("tag", tag);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${BASE_URL}/portfolio/blogs${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch blogs");
    return res.json();
  },

  async createBlog(blog: Omit<ApiBlog, 'id' | 'created_at' | 'updated_at'>): Promise<ApiBlog> {
    const res = await fetch(`${BASE_URL}/portfolio/blogs`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(blog),
    });
    if (!res.ok) throw new Error("Failed to create blog");
    return res.json();
  },

  async updateBlog(uuid: string, blog: Partial<Omit<ApiBlog, 'id' | 'created_at' | 'updated_at'>>): Promise<ApiBlog> {
    const res = await fetch(`${BASE_URL}/portfolio/blogs/${uuid}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(blog),
    });
    if (!res.ok) throw new Error("Failed to update blog");
    return res.json();
  },

  async publishBlog(uuid: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/portfolio/blogs/${uuid}/publish`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to publish blog");
    return res.json();
  },

  async unpublishBlog(uuid: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/portfolio/blogs/${uuid}/unpublish`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to unpublish blog");
    return res.json();
  },

  async deleteBlog(uuid: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/portfolio/blogs/${uuid}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete blog");
    return res.json();
  },
};
