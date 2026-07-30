import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

export function Login() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "sign-in") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.user && !data.session) {
          setNotice("Account created. Check your email to confirm before signing in.");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex min-h-svh items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg-base)" }}
    >
      <div
        className="w-full max-w-sm rounded-sm border p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-sm font-display text-sm font-semibold"
            style={{ backgroundColor: "var(--color-accent-live)", color: "var(--color-bg-base)" }}
            aria-hidden="true"
          >
            AP
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold">AutoPitch</h1>
            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              Mission control for outreach
            </p>
          </div>
        </div>

        <div className="mb-5 flex gap-1 rounded-sm border p-0.5" style={{ borderColor: "var(--color-border)" }}>
          {(["sign-in", "sign-up"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setNotice(null);
              }}
              className="flex-1 rounded-sm py-1.5 font-mono text-xs transition-colors"
              style={{
                backgroundColor: mode === m ? "var(--color-bg-hover)" : "transparent",
                color: mode === m ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              }}
            >
              {m === "sign-in" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--color-status-failed)" }}>
              {error}
            </p>
          )}
          {notice && (
            <p className="text-sm" style={{ color: "var(--color-accent-success)" }}>
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-sm border px-3 py-2 font-mono text-sm transition-colors disabled:opacity-40"
            style={{
              borderColor: "var(--color-accent-live)",
              backgroundColor: "var(--color-accent-live-dim)",
              color: "var(--color-accent-live)",
            }}
          >
            {busy ? "…" : mode === "sign-in" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
