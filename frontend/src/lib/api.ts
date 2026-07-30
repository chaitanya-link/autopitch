import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL as string;

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type LeadStatus =
  | "queued"
  | "researching"
  | "researched"
  | "drafted"
  | "needs_review"
  | "sent"
  | "replied"
  | "failed";

export interface Campaign {
  id: string;
  user_id: string;
  product_name: string;
  product_url: string;
  product_summary: string | null;
  pacing_seconds: number;
  daily_cap: number;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  campaign_id: string;
  company_name: string;
  founder_name: string;
  email: string;
  company_url: string;
  status: LeadStatus;
  draft_subject: string | null;
  draft_body: string | null;
  confidence_score: string | null;
  confidence_reasoning: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadChunk {
  id: string;
  source_url: string;
  content: string;
}

export interface SendResult {
  success: boolean;
  error: string | null;
  rate_limited: boolean;
  retry_after_seconds: number | null;
  lead: Lead;
}

export interface PacingStatus {
  can_send_now: boolean;
  seconds_until_next_send: number;
  sent_today: number;
  daily_cap: number;
  daily_cap_reached: boolean;
}

export interface ReplyCheckResult {
  success: boolean;
  checked: number;
  new_replies: number;
  error: string | null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const auth = await authHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...auth },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listCampaigns: () => request<Campaign[]>("/campaigns"),
  createCampaign: (payload: {
    product_name: string;
    product_url: string;
    pacing_seconds?: number;
    daily_cap?: number;
  }) => request<Campaign>("/campaigns", { method: "POST", body: JSON.stringify(payload) }),

  listLeads: (campaignId: string) => request<Lead[]>(`/leads?campaign_id=${campaignId}`),
  getLead: (leadId: string) => request<Lead>(`/leads/${leadId}`),
  createLead: (payload: {
    campaign_id: string;
    company_name: string;
    founder_name: string;
    email: string;
    company_url: string;
  }) => request<Lead>("/leads", { method: "POST", body: JSON.stringify(payload) }),
  updateLead: (
    leadId: string,
    payload: Partial<Pick<Lead, "status" | "draft_subject" | "draft_body">>,
  ) => request<Lead>(`/leads/${leadId}`, { method: "PATCH", body: JSON.stringify(payload) }),
  runResearch: (leadId: string) =>
    request<{ success: boolean; chunk_count: number; errors: string[]; low_content: boolean; lead: Lead }>(
      `/leads/${leadId}/research`,
      { method: "POST" },
    ),
  runDraft: (leadId: string) =>
    request<{ success: boolean; confidence: number | null; reasoning: string | null; error: string | null; lead: Lead }>(
      `/leads/${leadId}/draft`,
      { method: "POST" },
    ),
  getContext: (leadId: string, query: string, topK = 5) =>
    request<LeadChunk[]>(`/leads/${leadId}/context?query=${encodeURIComponent(query)}&top_k=${topK}`),
  runSend: (leadId: string) => request<SendResult>(`/leads/${leadId}/send`, { method: "POST" }),
  getPacing: (campaignId: string) => request<PacingStatus>(`/campaigns/${campaignId}/pacing`),
  checkReplies: (campaignId: string) =>
    request<ReplyCheckResult>(`/campaigns/${campaignId}/check-replies`, { method: "POST" }),
  uploadLeadsCsv: async (campaignId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const auth = await authHeaders();
    const res = await fetch(`${API_URL}/leads/upload-csv?campaign_id=${campaignId}`, {
      method: "POST",
      headers: auth,
      body: form,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${res.status} ${res.statusText}: ${body}`);
    }
    return res.json() as Promise<Lead[]>;
  },
};
