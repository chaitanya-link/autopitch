import { useEffect, useState } from "react";
import { api, type Lead, type LeadChunk, type PacingStatus } from "../lib/api";
import { StatusChip } from "./StatusChip";

export function LeadDetailDrawer({
  lead,
  onClose,
  onUpdated,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdated: (lead: Lead) => void;
}) {
  const [subject, setSubject] = useState(lead.draft_subject ?? "");
  const [body, setBody] = useState(lead.draft_body ?? "");
  const [chunks, setChunks] = useState<LeadChunk[]>([]);
  const [busy, setBusy] = useState<"research" | "draft" | "save" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendNotice, setSendNotice] = useState<string | null>(null);
  const [pacing, setPacing] = useState<PacingStatus | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    api.getPacing(lead.campaign_id).then((p) => {
      setPacing(p);
      setCountdown(p.seconds_until_next_send);
    });
  }, [lead.campaign_id, lead.status]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setSubject(lead.draft_subject ?? "");
    setBody(lead.draft_body ?? "");
    setError(null);
    if (["researched", "drafted", "needs_review", "sent", "replied"].includes(lead.status)) {
      api
        .getContext(lead.id, `${lead.company_name} product mission customers`, 5)
        .then(setChunks)
        .catch(() => setChunks([]));
    } else {
      setChunks([]);
    }
  }, [lead]);

  async function runResearch() {
    setBusy("research");
    setError(null);
    try {
      const result = await api.runResearch(lead.id);
      onUpdated(result.lead);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Research failed");
    } finally {
      setBusy(null);
    }
  }

  async function runDraft() {
    setBusy("draft");
    setError(null);
    try {
      const result = await api.runDraft(lead.id);
      onUpdated(result.lead);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Drafting failed");
    } finally {
      setBusy(null);
    }
  }

  async function saveDraft() {
    setBusy("save");
    setError(null);
    try {
      const updated = await api.updateLead(lead.id, { draft_subject: subject, draft_body: body });
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function approveAndSend() {
    setBusy("send");
    setError(null);
    setSendNotice(null);
    try {
      const result = await api.runSend(lead.id);
      onUpdated(result.lead);
      if (result.success) {
        setSendNotice("Dispatched. Signal will register here on reply.");
      } else if (result.rate_limited) {
        setSendNotice(result.error);
        if (result.retry_after_seconds) setCountdown(result.retry_after_seconds);
      } else {
        setError(result.error ?? "Send failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-20 flex justify-end bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l"
        style={{ backgroundColor: "var(--color-bg-elevated)", borderColor: "var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Lead detail: ${lead.company_name}`}
      >
        <div className="flex items-start justify-between gap-4 border-b p-5" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h2 className="font-display text-lg font-semibold">{lead.company_name}</h2>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {lead.founder_name} · <span className="font-mono text-xs">{lead.email}</span>
            </p>
            <div className="mt-2">
              <StatusChip status={lead.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="rounded-sm px-2 py-1 font-mono text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            ESC
          </button>
        </div>

        <div className="flex flex-col gap-6 p-5">
          {error && (
            <div
              className="rounded-sm border px-3 py-2 text-sm"
              style={{ borderColor: "var(--color-status-failed)", color: "var(--color-status-failed)" }}
            >
              {error}
            </div>
          )}

          {(lead.failure_reason || lead.confidence_reasoning) && (
            <div>
              <SectionLabel>Agent notes</SectionLabel>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {lead.failure_reason ?? lead.confidence_reasoning}
              </p>
              {lead.confidence_score && (
                <p className="mt-1 font-mono text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                  confidence: {Number(lead.confidence_score).toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <ActionButton onClick={runResearch} busy={busy === "research"}>
              Run Research
            </ActionButton>
            <ActionButton onClick={runDraft} busy={busy === "draft"} disabled={chunks.length === 0}>
              Run Draft
            </ActionButton>
          </div>

          {chunks.length > 0 && (
            <div>
              <SectionLabel>Researched context ({chunks.length} chunks)</SectionLabel>
              <div className="mt-2 flex flex-col gap-2">
                {chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="rounded-sm border p-2.5 text-xs"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}
                  >
                    <div className="mb-1 truncate font-mono" style={{ color: "var(--color-text-tertiary)" }}>
                      {chunk.source_url}
                    </div>
                    <p style={{ color: "var(--color-text-secondary)" }}>{chunk.content.slice(0, 220)}…</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionLabel>Draft subject</SectionLabel>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="No draft yet — run research and drafting"
              className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            />
          </div>

          <div>
            <SectionLabel>Draft body</SectionLabel>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              placeholder="No draft yet — run research and drafting"
              className="mt-1 w-full resize-none rounded-sm border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            />
          </div>

          <div className="flex items-center gap-3">
            <ActionButton onClick={saveDraft} busy={busy === "save"}>
              Save Edits
            </ActionButton>
            <ActionButton
              onClick={approveAndSend}
              busy={busy === "send"}
              disabled={!subject || !body || countdown > 0 || pacing?.daily_cap_reached}
              primary
            >
              Approve &amp; Send
            </ActionButton>
          </div>

          {sendNotice && (
            <p className="text-sm" style={{ color: "var(--color-accent-success)" }}>
              {sendNotice}
            </p>
          )}

          {pacing && (
            <div className="flex items-center gap-4 font-mono text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              <span>
                sent today: {pacing.sent_today}/{pacing.daily_cap}
              </span>
              {countdown > 0 && (
                <span style={{ color: "var(--color-status-review)" }}>next send in {countdown}s</span>
              )}
              {pacing.daily_cap_reached && (
                <span style={{ color: "var(--color-status-failed)" }}>daily cap reached</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
      {children}
    </h3>
  );
}

function ActionButton({
  children,
  onClick,
  busy,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors disabled:opacity-40"
      style={{
        borderColor: primary ? "var(--color-accent-live)" : "var(--color-border)",
        backgroundColor: primary ? "var(--color-accent-live-dim)" : "transparent",
        color: primary ? "var(--color-accent-live)" : "var(--color-text-secondary)",
      }}
    >
      {busy ? "…" : children}
    </button>
  );
}
