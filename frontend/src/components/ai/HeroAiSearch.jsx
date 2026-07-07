import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiClock,
  FiCpu,
  FiMessageCircle,
  FiSearch,
  FiTarget,
  FiZap
} from "react-icons/fi";
import { aiApi } from "../../services/ai.api";
import { getErrorMessage } from "../../utils/errorHandler";

const QUICK_PROMPTS = [
  "Find recent Supreme Court cases on bail under section 497 CrPC",
  "Explain Article 10A of the Constitution and its application",
  "Summarise procedure for filing a writ petition in a High Court",
  "What are the latest precedents on electronic evidence in Pakistan?"
];

export default function HeroAiSearch({ autoFocus = true }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await aiApi.listSessions({ mode: "research", limit: 4 });
        if (!cancelled) setSessions(res.data || []);
      } catch {
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  async function startSearch(text) {
    const value = String(text || "").trim();
    if (!value || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await aiApi.createSession({
        mode: "research",
        title: value.length > 60 ? `${value.slice(0, 57)}...` : value
      });
      const session = res.data;
      navigate("/lawyer/ai", {
        state: { sessionId: session.id, initialMessage: value }
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      startSearch(query);
    }
  }

  function openSession(session) {
    navigate("/lawyer/ai", { state: { sessionId: session.id } });
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-card-border shadow-sm p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-primary/15 text-primary">
          <FiCpu className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-text-primary leading-tight">
            Ask your legal assistant
          </h2>
          <p className="text-xs text-text-muted">
            Research Pakistani law, drafts, and precedents — answers cite their sources.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          startSearch(query);
        }}
      >
        <div className="relative flex items-end gap-2 rounded-2xl border border-input-border bg-input-background shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <FiSearch className="absolute left-4 top-4 w-5 h-5 text-text-muted pointer-events-none" />
          <textarea
            ref={inputRef}
            rows={1}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Pakistani law, draft a notice, summarise a judgment…"
            disabled={submitting}
            className="flex-1 py-4 pl-12 pr-2 bg-transparent text-input-text text-sm sm:text-base outline-none resize-none max-h-[160px] leading-relaxed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!query.trim() || submitting}
            className={`shrink-0 m-2 h-10 px-4 rounded-xl flex items-center gap-2 transition-all text-sm font-medium ${
              query.trim() && !submitting
                ? "bg-primary text-primary-text hover:bg-primary-hover cursor-pointer"
                : "bg-surface text-text-muted cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Ask
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => startSearch(prompt)}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-card-border text-text-secondary hover:bg-surface-hover hover:text-text-primary hover:border-primary/30 transition-colors disabled:opacity-60"
          >
            <FiZap className="w-3.5 h-3.5 text-primary" />
            {prompt}
          </button>
        ))}
        <button
          type="button"
          onClick={() => navigate("/lawyer/cross-exam")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20 transition-colors"
        >
          <FiTarget className="w-3.5 h-3.5" />
          Practise cross-examination
        </button>
      </div>

      {loadingSessions ? (
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-surface animate-pulse" />
          ))}
        </div>
      ) : sessions.length > 0 ? (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">
              Recent conversations
            </p>
            <button
              type="button"
              onClick={() => navigate("/lawyer/ai")}
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              View all
              <FiArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => openSession(s)}
                className="group flex items-start gap-2 p-3 rounded-lg border border-card-border bg-card hover:bg-surface-hover hover:border-primary/30 text-left transition-colors"
              >
                <FiMessageCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate group-hover:text-primary">
                    {s.title || "New conversation"}
                  </p>
                  <p className="text-[11px] text-text-muted truncate mt-0.5 inline-flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    {formatRelative(s.updatedAt)}
                    {s.messageCount > 0 && ` · ${s.messageCount} messages`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatRelative(value) {
  if (!value) return "";
  const d = new Date(value);
  const now = new Date();
  const diffMs = now - d;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
