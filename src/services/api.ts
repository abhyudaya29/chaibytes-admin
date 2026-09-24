const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000/api";
export const ARHASOFT_SITE_KEY = "arahasoft";
export const CHAIBYTES_SITE_KEY = "chaibytes";

export interface ApiBlog {
  id: string; // uuid
  site_key?: string;
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
  published_at?: string;
}

interface ApiBlogListResponse {
  items: ApiBlog[];
  total: number;
}

export interface PublishedBlogList {
  items: ApiBlog[];
  total: number;
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
  const configuredToken = token || import.meta.env.VITE_CHAIBYTES_INTERNAL_API_TOKEN;
  if (configuredToken) {
    headers["X-Internal-Api-Token"] = configuredToken;
  }
  return headers;
};

const getCrmHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("CHAIBYTES_CRM_ACCESS_TOKEN") || import.meta.env.VITE_CHAIBYTES_CRM_ACCESS_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const getCrmUrl = (path: string) => {
  const url = new URL(`${BASE_URL}${path}`);
  const orgToken = localStorage.getItem("CHAIBYTES_CRM_ORG_TOKEN");
  if (orgToken) url.searchParams.set("org_token", orgToken);
  return url.toString();
};

const getApiErrorMessage = async (res: Response, fallback: string) => {
  try {
    const payload = await res.json();
    const detail = payload?.detail ?? payload?.message ?? payload?.error;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return `${fallback}: ${JSON.stringify(detail)}`;
  } catch (e) {
    // Fall back to the response status below when the body is not JSON.
  }
  return `${fallback} (${res.status})`;
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

export type CrmLeadStatus = "new" | "contacted" | "booked" | "closed" | "lost";
export type CrmEmailStatus = "queued" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained" | "failed";

export interface CrmLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: CrmLeadStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CrmEmailConfig {
  id?: string;
  provider: "resend";
  api_key?: string;
  from_email: string;
  from_name: string;
  reply_to?: string;
  sending_domain?: string;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

export interface CrmEmailTemplate {
  id: string;
  name: string;
  resend_template_id: string;
  template_type: string;
  variable_mappings?: Record<string, string>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrmEmailAutomation {
  id: string;
  name: string;
  trigger: "new_lead" | string;
  template_id: string;
  delay_minutes: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CrmEmailMessage {
  id: string;
  lead_id?: string;
  template_id?: string;
  automation_id?: string;
  provider_message_id?: string;
  to_email?: string;
  recipient_email?: string;
  recipient?: string;
  subject?: string;
  template_name?: string;
  template_type?: string;
  status: CrmEmailStatus;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  complained_at?: string;
  error_message?: string;
  failed_reason?: string;
}

export interface ResendIntegration {
  configured: boolean;
  provider?: "resend";
  status?: "connected" | "not_connected" | "expired" | "error" | string;
  masked_key?: string;
  from_email?: string;
  from_name?: string;
  reply_to?: string;
  sending_domain?: string;
  last_verified_at?: string;
  updated_at?: string;
}

export interface ConnectResendPayload {
  api_key: string;
  from_email: string;
  from_name: string;
  reply_to?: string;
  sending_domain?: string;
}

export interface SyncedEmailTemplate {
  id: string;
  name: string;
  provider_template_id?: string;
  resend_template_id?: string;
  template_type?: string;
  status?: "published" | "draft" | "unavailable" | string;
  variables?: string[];
  required_variables?: string[];
  variable_mappings?: Record<string, string>;
  mappings?: TemplateVariableMapping[];
  mapping_complete?: boolean;
  last_synced_at?: string;
  updated_at?: string;
}

export interface TemplateVariableMapping {
  variable_name: string;
  source_type: "lead" | "organization" | "user" | "booking" | "static";
  source_field: string;
  static_value?: string;
}

export interface EmailActivityMessage extends CrmEmailMessage {
  recipient_email?: string;
  recipient?: string;
  template?: string;
  template_label?: string;
  related_lead_name?: string;
  lead_name?: string;
  last_event_at?: string;
  last_event?: string;
}

export interface CrmListResponse<T> {
  items: T[];
  total?: number;
}

export interface CrmSignupPayload {
  full_name: string;
  phone_number: string;
  email: string;
  password: string;
  domain: string;
  organization_type: string;
}

export interface CrmAuthResponse {
  access_token?: string;
  token?: string;
  org_token?: string;
  org_id?: string;
  org_identifier?: string;
  organization?: {
    id?: string;
    org_id?: string;
    org_token?: string;
    slug?: string;
    org_identifier?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

const normalizeList = <T,>(payload: T[] | CrmListResponse<T>): T[] => {
  return Array.isArray(payload) ? payload : payload.items;
};

export const api = {
  crmTokenStorageKey: "CHAIBYTES_CRM_ACCESS_TOKEN",
  crmOrgTokenStorageKey: "CHAIBYTES_CRM_ORG_TOKEN",
  crmOrgIdentifierStorageKey: "CHAIBYTES_CRM_ORG_IDENTIFIER",
  crmOrgDataStorageKey: "CHAIBYTES_CRM_ORG_DATA",

  setCrmAccessToken(token: string) {
    localStorage.setItem("CHAIBYTES_CRM_ACCESS_TOKEN", token.trim());
  },

  getCrmAccessToken() {
    return localStorage.getItem("CHAIBYTES_CRM_ACCESS_TOKEN") || "";
  },

  setCrmOrgData(payload: CrmAuthResponse) {
    const orgToken = payload.org_token || payload.organization?.org_token;
    if (orgToken) {
      localStorage.setItem("CHAIBYTES_CRM_ORG_TOKEN", orgToken);
    }
    const orgIdentifier = payload.org_identifier || payload.org_id || payload.organization?.org_identifier || payload.organization?.org_id || payload.organization?.id || payload.organization?.slug;
    if (orgIdentifier) {
      localStorage.setItem("CHAIBYTES_CRM_ORG_IDENTIFIER", orgIdentifier);
    }
    localStorage.setItem("CHAIBYTES_CRM_ORG_DATA", JSON.stringify({
      ...payload.organization,
      org_token: orgToken || "",
      org_identifier: orgIdentifier || "",
    }));
  },

  getCrmOrgToken() {
    return localStorage.getItem("CHAIBYTES_CRM_ORG_TOKEN") || "";
  },

  getCrmOrgIdentifier() {
    return localStorage.getItem("CHAIBYTES_CRM_ORG_IDENTIFIER") || "";
  },

  getCrmOrgData() {
    try {
      return JSON.parse(localStorage.getItem("CHAIBYTES_CRM_ORG_DATA") || "{}") as Record<string, unknown>;
    } catch {
      return {};
    }
  },

  clearCrmAuth() {
    localStorage.removeItem("CHAIBYTES_CRM_ACCESS_TOKEN");
    localStorage.removeItem("CHAIBYTES_CRM_ORG_TOKEN");
    localStorage.removeItem("CHAIBYTES_CRM_ORG_IDENTIFIER");
    localStorage.removeItem("CHAIBYTES_CRM_ORG_DATA");
  },

  async registerCrm(payload: CrmSignupPayload): Promise<CrmAuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to create account"));
    const data: CrmAuthResponse = await res.json();
    const token = data.access_token || data.token;
    if (token) this.setCrmAccessToken(token);
    this.setCrmOrgData(data);
    return data;
  },

  async loginCrm(email: string, password: string): Promise<CrmAuthResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to login"));
    const payload: CrmAuthResponse = await res.json();
    const token = payload.access_token || payload.token;
    if (token) this.setCrmAccessToken(token);
    this.setCrmOrgData(payload);
    return payload;
  },

  async createCrmLead(lead: Omit<CrmLead, "id" | "created_at" | "updated_at">): Promise<CrmLead> {
    const res = await fetch(getCrmUrl("/crm/leads"), {
      method: "POST",
      headers: getCrmHeaders(),
      body: JSON.stringify(lead),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to create lead"));
    return res.json();
  },

  async createPublicCrmLead(orgIdentifier: string, lead: Pick<CrmLead, "name" | "email" | "phone" | "source" | "notes">): Promise<CrmLead> {
    const res = await fetch(`${BASE_URL}/crm/public/${encodeURIComponent(orgIdentifier)}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to submit public lead"));
    return res.json();
  },

  async getCrmLeads(filters: { search?: string; status?: string; source?: string; limit?: number; offset?: number } = {}): Promise<CrmLead[]> {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.source) params.set("source", filters.source);
    if (filters.limit) params.set("limit", String(filters.limit));
    if (filters.offset !== undefined) params.set("offset", String(filters.offset));
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(getCrmUrl(`/crm/leads${query}`), { headers: getCrmHeaders() });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch leads"));
    return normalizeList(await res.json());
  },

  async getCrmLead(id: string): Promise<CrmLead> {
    const res = await fetch(getCrmUrl(`/crm/leads/${encodeURIComponent(id)}`), { headers: getCrmHeaders() });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch lead"));
    return res.json();
  },

  async updateCrmLead(id: string, updates: Partial<Pick<CrmLead, "status" | "notes" | "name" | "email" | "phone" | "source">>): Promise<CrmLead> {
    const res = await fetch(getCrmUrl(`/crm/leads/${encodeURIComponent(id)}`), {
      method: "PUT",
      headers: getCrmHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to update lead"));
    return res.json();
  },

  async triggerCrmLeadAutomations(id: string, trigger = "new_lead"): Promise<{ message: string }> {
    const res = await fetch(getCrmUrl(`/crm/leads/${encodeURIComponent(id)}/trigger-automations?trigger=${encodeURIComponent(trigger)}`), {
      method: "POST",
      headers: getCrmHeaders(),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to trigger automations"));
    return res.json();
  },

  async sendCrmLeadEmail(id: string, payload: { template_id: string; variables?: Record<string, any> }): Promise<CrmEmailMessage> {
    const res = await fetch(getCrmUrl(`/crm/leads/${encodeURIComponent(id)}/send-email`), {
      method: "POST",
      headers: getCrmHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to send lead email"));
    return res.json();
  },

  async getCrmEmailConfig(): Promise<CrmEmailConfig | null> {
    const res = await fetch(getCrmUrl("/crm/email-config"), { headers: getCrmHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch email config"));
    return res.json();
  },

  async saveCrmEmailConfig(config: CrmEmailConfig): Promise<CrmEmailConfig> {
    const res = await fetch(getCrmUrl("/crm/email-config"), {
      method: "POST",
      headers: getCrmHeaders(),
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to save email config"));
    return res.json();
  },

  async patchCrmEmailConfig(config: Partial<CrmEmailConfig>): Promise<CrmEmailConfig> {
    const res = await fetch(getCrmUrl("/crm/email-config"), {
      method: "PATCH",
      headers: getCrmHeaders(),
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to update email config"));
    return res.json();
  },

  async getCrmTemplates(includeInactive = false): Promise<CrmEmailTemplate[]> {
    const query = includeInactive ? "?include_inactive=true" : "?include_inactive=false";
    const res = await fetch(getCrmUrl(`/crm/email-templates${query}`), { headers: getCrmHeaders() });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch CRM templates"));
    return normalizeList(await res.json());
  },

  async createCrmTemplate(template: Omit<CrmEmailTemplate, "id" | "created_at" | "updated_at">): Promise<CrmEmailTemplate> {
    const res = await fetch(getCrmUrl("/crm/email-templates"), {
      method: "POST",
      headers: getCrmHeaders(),
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to create CRM template"));
    return res.json();
  },

  async updateCrmTemplate(id: string, template: Partial<Omit<CrmEmailTemplate, "id" | "created_at" | "updated_at">>): Promise<CrmEmailTemplate> {
    const res = await fetch(getCrmUrl(`/crm/email-templates/${encodeURIComponent(id)}`), {
      method: "PUT",
      headers: getCrmHeaders(),
      body: JSON.stringify(template),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to update CRM template"));
    return res.json();
  },

  async getCrmAutomations(): Promise<CrmEmailAutomation[]> {
    const res = await fetch(getCrmUrl("/crm/email-automations"), { headers: getCrmHeaders() });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch automations"));
    return normalizeList(await res.json());
  },

  async createCrmAutomation(automation: Omit<CrmEmailAutomation, "id" | "created_at" | "updated_at">): Promise<CrmEmailAutomation> {
    const res = await fetch(getCrmUrl("/crm/email-automations"), {
      method: "POST",
      headers: getCrmHeaders(),
      body: JSON.stringify(automation),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to create automation"));
    return res.json();
  },

  async updateCrmAutomation(id: string, automation: Partial<Omit<CrmEmailAutomation, "id" | "created_at" | "updated_at">>): Promise<CrmEmailAutomation> {
    const res = await fetch(getCrmUrl(`/crm/email-automations/${encodeURIComponent(id)}`), {
      method: "PUT",
      headers: getCrmHeaders(),
      body: JSON.stringify(automation),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to update automation"));
    return res.json();
  },

  async getCrmEmailMessages(filters: { lead_id?: string; status?: string; limit?: number; offset?: number } = {}): Promise<CrmEmailMessage[]> {
    const params = new URLSearchParams();
    if (filters.lead_id) params.set("lead_id", filters.lead_id);
    if (filters.status) params.set("status", filters.status);
    if (filters.limit) params.set("limit", String(filters.limit));
    if (filters.offset) params.set("offset", String(filters.offset));
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(getCrmUrl(`/crm/email-messages${query}`), { headers: getCrmHeaders() });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch CRM email messages"));
    return normalizeList(await res.json());
  },

  async getResendIntegration(): Promise<ResendIntegration> {
    const res = await fetch(getCrmUrl("/email/integrations/resend"), { headers: getCrmHeaders() });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch Resend integration"));
    return res.json();
  },

  async connectResend(payload: ConnectResendPayload): Promise<ResendIntegration> {
    const res = await fetch(getCrmUrl("/email/integrations/resend/connect"), {
      method: "POST",
      headers: getCrmHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to connect Resend"));
    return res.json();
  },

  async testResendConnection(): Promise<{ message?: string; status?: string }> {
    const res = await fetch(getCrmUrl("/email/integrations/resend/test"), {
      method: "POST",
      headers: getCrmHeaders(),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Test email failed"));
    return res.json();
  },

  async disconnectResend(): Promise<{ message?: string }> {
    const res = await fetch(getCrmUrl("/email/integrations/resend"), {
      method: "DELETE",
      headers: getCrmHeaders(),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to disconnect Resend"));
    return res.json();
  },

  async syncEmailTemplates(): Promise<{ synced?: number; count?: number; templates?: SyncedEmailTemplate[]; message?: string }> {
    const res = await fetch(getCrmUrl("/email/templates/sync"), {
      method: "POST",
      headers: getCrmHeaders(),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Unable to sync templates. Try again."));
    return res.json();
  },

  async getEmailTemplates(): Promise<SyncedEmailTemplate[]> {
    const res = await fetch(getCrmUrl("/email/templates"), { headers: getCrmHeaders() });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch email templates"));
    return normalizeList(await res.json());
  },

  async getEmailTemplate(id: string): Promise<SyncedEmailTemplate> {
    const res = await fetch(getCrmUrl(`/email/templates/${encodeURIComponent(id)}`), { headers: getCrmHeaders() });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Template no longer exists in Resend."));
    return res.json();
  },

  async updateEmailTemplatePurpose(id: string, templateType: string): Promise<SyncedEmailTemplate> {
    const res = await fetch(getCrmUrl(`/email/templates/${encodeURIComponent(id)}/purpose`), {
      method: "PATCH",
      headers: getCrmHeaders(),
      body: JSON.stringify({ template_type: templateType }),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to update template purpose"));
    return res.json();
  },

  async updateEmailTemplateMappings(id: string, mappings: TemplateVariableMapping[]): Promise<SyncedEmailTemplate> {
    const res = await fetch(getCrmUrl(`/email/templates/${encodeURIComponent(id)}/mappings`), {
      method: "PUT",
      headers: getCrmHeaders(),
      body: JSON.stringify({ mappings }),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to save variable mappings"));
    return res.json();
  },

  async sendEmailTemplateTest(id: string, recipient: string, variables: Record<string, any> = {}): Promise<{ message?: string }> {
    const res = await fetch(getCrmUrl(`/email/templates/${encodeURIComponent(id)}/test`), {
      method: "POST",
      headers: getCrmHeaders(),
      body: JSON.stringify({ recipient, email: recipient, variables }),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Test email failed."));
    return res.json();
  },

  async getEmailActivity(filters: { status?: string; template_id?: string; search?: string; date_from?: string; date_to?: string; limit?: number; offset?: number } = {}): Promise<EmailActivityMessage[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.template_id) params.set("template_id", filters.template_id);
    if (filters.search) params.set("search", filters.search);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
    if (filters.limit) params.set("limit", String(filters.limit));
    if (filters.offset) params.set("offset", String(filters.offset));
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(getCrmUrl(`/email/messages${query}`), { headers: getCrmHeaders() });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch email activity"));
    return normalizeList(await res.json());
  },

  async getEmailActivityMessage(id: string): Promise<EmailActivityMessage> {
    const res = await fetch(getCrmUrl(`/email/messages/${encodeURIComponent(id)}`), { headers: getCrmHeaders() });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch email details"));
    return res.json();
  },

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

  async getBlogs(includeDrafts = false, search?: string, tag?: string, siteKey = ARHASOFT_SITE_KEY): Promise<ApiBlog[]> {
    const params = new URLSearchParams();
    params.append("site_key", siteKey);
    if (includeDrafts) params.append("include_drafts", "true");
    if (search) params.append("search", search);
    if (tag) params.append("tag", tag);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${BASE_URL}/portfolio/blogs${query}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch blogs"));
    const payload: ApiBlog[] | ApiBlogListResponse = await res.json();
    return Array.isArray(payload) ? payload : payload.items;
  },

  async getPublishedBlogs(limit = 20, offset = 0, siteKey = ARHASOFT_SITE_KEY): Promise<PublishedBlogList> {
    const params = new URLSearchParams({
      site_key: siteKey,
      limit: String(limit),
      offset: String(offset),
    });
    const res = await fetch(`${BASE_URL}/portfolio/blogs?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch published blogs"));
    return res.json();
  },

  async getPublishedBlog(slug: string, siteKey = ARHASOFT_SITE_KEY): Promise<ApiBlog> {
    const params = new URLSearchParams({ site_key: siteKey });
    const res = await fetch(`${BASE_URL}/portfolio/blogs/${encodeURIComponent(slug)}?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to fetch blog"));
    return res.json();
  },

  async createBlog(blog: Omit<ApiBlog, 'id' | 'created_at' | 'updated_at'>, siteKey = ARHASOFT_SITE_KEY): Promise<ApiBlog> {
    const res = await fetch(`${BASE_URL}/portfolio/blogs`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ ...blog, site_key: siteKey }),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to create blog"));
    return res.json();
  },

  async updateBlog(uuid: string, blog: Partial<Omit<ApiBlog, 'id' | 'created_at' | 'updated_at'>>, siteKey = ARHASOFT_SITE_KEY): Promise<ApiBlog> {
    const res = await fetch(`${BASE_URL}/portfolio/blogs/${uuid}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ ...blog, site_key: siteKey }),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to update blog"));
    return res.json();
  },

  async publishBlog(uuid: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/portfolio/blogs/${uuid}/publish`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to publish blog"));
    return res.json();
  },

  async unpublishBlog(uuid: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/portfolio/blogs/${uuid}/unpublish`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to unpublish blog"));
    return res.json();
  },

  async deleteBlog(uuid: string): Promise<{ message: string }> {
    const res = await fetch(`${BASE_URL}/portfolio/blogs/${uuid}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await getApiErrorMessage(res, "Failed to delete blog"));
    return res.json();
  },
};
