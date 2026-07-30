import { useRef } from "react";

const PIPELINE_STEPS = [
  {
    step: "01",
    title: "Research",
    color: "var(--color-accent-live)",
    pulsing: true,
    description: "Scrapes the lead's site (respecting robots.txt), chunks and embeds it — real content, not a guess.",
  },
  {
    step: "02",
    title: "Draft",
    color: "var(--color-status-drafted)",
    pulsing: false,
    description: "Cross-references that research against your product and writes a specific, non-templated opening line.",
  },
  {
    step: "03",
    title: "Verify",
    color: "var(--color-status-review)",
    pulsing: false,
    description: "Scores its own confidence. Thin research gets flagged for your review instead of guessed at.",
  },
  {
    step: "04",
    title: "Send",
    color: "var(--color-status-sent)",
    pulsing: false,
    description: "Dispatches through your inbox with real pacing and a daily cap — never a burst of spam.",
  },
  {
    step: "05",
    title: "Reply",
    color: "var(--color-accent-success)",
    pulsing: false,
    description: "Polls for replies and surfaces the signal the moment it lands, threaded to the original send.",
  },
];

export function Landing({ onSignIn }: { onSignIn: () => void }) {
  const heroRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-primary)" }}>
      <nav className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-sm font-display text-xs font-semibold"
            style={{ backgroundColor: "var(--color-accent-live)", color: "var(--color-bg-base)" }}
            aria-hidden="true"
          >
            AP
          </div>
          <span className="font-display text-sm font-semibold">AutoPitch</span>
        </div>
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors"
          style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)" }}
        >
          Sign In
        </button>
      </nav>

      <div
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="hero-spotlight relative overflow-hidden px-6 pb-24 pt-16 md:px-10 md:pt-24"
      >
        <div className="relative mx-auto max-w-3xl text-center">
          <span
            className="inline-flex items-center gap-2 rounded-sm border px-3 py-1 font-mono text-xs"
            style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)" }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-dot"
              style={{ backgroundColor: "var(--color-accent-live)" }}
              aria-hidden="true"
            />
            Agent pipeline, not a mail-merge
          </span>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight md:text-6xl">
            Outreach that researches
            <br />
            <span style={{ color: "var(--color-accent-live)" }}>before it ever writes.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
            AutoPitch reads each lead's own site, cross-references it against your product, and drafts a genuinely
            personal email — flagging anything it isn't confident about instead of guessing.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onSignIn}
              className="rounded-sm border px-5 py-2.5 font-mono text-sm transition-colors"
              style={{
                borderColor: "var(--color-accent-live)",
                backgroundColor: "var(--color-accent-live-dim)",
                color: "var(--color-accent-live)",
              }}
            >
              Sign In / Get Started
            </button>
            <a
              href="#pipeline"
              className="rounded-sm border px-5 py-2.5 font-mono text-sm transition-colors"
              style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)" }}
            >
              See how it works
            </a>
          </div>
        </div>
      </div>

      <section id="pipeline" className="mx-auto max-w-2xl px-6 pb-28 md:px-10">
        <h2 className="text-center font-display text-2xl font-semibold md:text-3xl">The pipeline, step by step</h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>
          Every lead moves through these five stages, visibly — not a black-box single LLM call.
        </p>

        <div className="relative mt-14 flex flex-col gap-10">
          <div
            className="absolute bottom-6 left-[15px] top-6 w-px md:left-[19px]"
            style={{ backgroundColor: "var(--color-border)" }}
            aria-hidden="true"
          />
          {PIPELINE_STEPS.map((s) => (
            <div key={s.step} className="relative flex gap-5">
              <div
                className={`relative z-10 mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 md:h-10 md:w-10 ${
                  s.pulsing ? "animate-pulse-dot" : ""
                }`}
                style={{ borderColor: s.color, backgroundColor: "var(--color-bg-base)" }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                    STEP {s.step}
                  </span>
                  <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                </div>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer
        className="border-t px-6 py-6 text-center font-mono text-xs md:px-10"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text-tertiary)" }}
      >
        AutoPitch — an agentic cold outreach engine, built end to end.
      </footer>
    </div>
  );
}
