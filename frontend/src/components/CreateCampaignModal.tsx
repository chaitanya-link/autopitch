import { useState, type FormEvent } from "react";
import { api, type Campaign } from "../lib/api";

export function CreateCampaignModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (campaign: Campaign) => void;
}) {
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderAppPassword, setSenderAppPassword] = useState("");
  const [pacingSeconds, setPacingSeconds] = useState(60);
  const [dailyCap, setDailyCap] = useState(50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const campaign = await api.createCampaign({
        product_name: productName,
        product_url: productUrl,
        sender_email: senderEmail,
        sender_app_password: senderAppPassword.replace(/\s+/g, ""),
        pacing_seconds: pacingSeconds,
        daily_cap: dailyCap,
      });
      onCreated(campaign);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create campaign");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" onClick={onClose} role="presentation">
      <div
        className="w-full max-w-md rounded-sm border p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Create campaign"
      >
        <h2 className="font-display text-lg font-semibold">New Campaign</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Tell the agent what you're pitching — this is cross-referenced against every lead's research.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <Field label="Product / company name">
            <input
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. AutoPitch"
              className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            />
          </Field>
          <Field label="Product URL">
            <input
              required
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://yourproduct.com"
              className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            />
          </Field>
          <Field label="Send from (Gmail address)">
            <input
              required
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="you@gmail.com"
              className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            />
          </Field>
          <Field label="Gmail App Password">
            <input
              required
              type="password"
              value={senderAppPassword}
              onChange={(e) => setSenderAppPassword(e.target.value)}
              placeholder="16-character app password"
              className="mt-1 w-full rounded-sm border px-3 py-2 text-sm font-mono outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            />
            <span className="mt-1 block text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              Requires 2-Step Verification enabled on that account. Generate one at{" "}
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="underline"
                style={{ color: "var(--color-accent-live)" }}
              >
                myaccount.google.com/apppasswords
              </a>
              . Emails send from this account, not your personal inbox.
            </span>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pacing (seconds)">
              <input
                type="number"
                min={1}
                required
                value={pacingSeconds}
                onChange={(e) => setPacingSeconds(Number(e.target.value))}
                className="mt-1 w-full rounded-sm border px-3 py-2 text-sm font-mono outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
              />
            </Field>
            <Field label="Daily cap">
              <input
                type="number"
                min={1}
                required
                value={dailyCap}
                onChange={(e) => setDailyCap(Number(e.target.value))}
                className="mt-1 w-full rounded-sm border px-3 py-2 text-sm font-mono outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
              />
            </Field>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--color-status-failed)" }}>
              {error}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border px-3 py-1.5 font-mono text-xs"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-sm border px-3 py-1.5 font-mono text-xs disabled:opacity-40"
              style={{
                borderColor: "var(--color-accent-live)",
                backgroundColor: "var(--color-accent-live-dim)",
                color: "var(--color-accent-live)",
              }}
            >
              {busy ? "…" : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
