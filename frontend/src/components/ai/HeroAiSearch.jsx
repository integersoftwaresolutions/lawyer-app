import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiChevronRight,
  FiCpu,
  FiSearch,
  FiTarget
} from "react-icons/fi";
import { aiApi } from "../../services/ai.api";
import { Card, Button } from "../ui";
import { timeAgo } from "../../utils/timeAgo";
import { getErrorMessage } from "../../utils/errorHandler";

const QUICK_PROMPTS = [
  "Recent Supreme Court cases on bail under Section 497 CrPC",
  "Explain Article 10A and how courts apply it",
  "Procedure for filing a writ petition in the High Court"
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
        const res = await aiApi.listSessions({ mode: "research", limit: 3 });
        if (!cancelled) setSessions(res.items || []);
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
    <Card
      title="Ask your legal assistant"
      subtitle="Research Pakistani law, drafts, and precedents."
      headerAction={
        <Button
          variant="secondary"
          size="sm"
          icon={FiTarget}
          onClick={() => navigate("/lawyer/cross-exam")}
          className="shrink-0"
        >
          Cross-exam
        </Button>
      }
      padding="p-4 sm:p-5"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          startSearch(query);
        }}
      >
        <div className="flex items-center gap-2 rounded-xl border border-input-border bg-input-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-light transition-colors">
          <FiSearch className="w-4 h-4 text-text-muted shrink-0 ml-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about case law, procedure, or drafting…"
            disabled={submitting}
            className="flex-1 min-w-0 py-3 pr-2 bg-transparent text-input-text text-sm outline-none disabled:opacity-60"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!query.trim() || submitting}
            loading={submitting}
            iconRight={FiArrowRight}
            className="shrink-0 m-1.5"
          >
            Ask
          </Button>
        </div>
      </form>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <div className="mt-4 space-y-1.5">
        <p className="text-xs font-medium text-text-muted">Try asking</p>
        <ul className="space-y-1">
          {QUICK_PROMPTS.map((prompt) => (
            <li key={prompt}>
              <button
                type="button"
                onClick={() => startSearch(prompt)}
                disabled={submitting}
                className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors disabled:opacity-60"
              >
                <FiCpu className="w-3.5 h-3.5 shrink-0 text-primary" />
                <span className="flex-1 min-w-0 truncate">{prompt}</span>
                <FiChevronRight className="w-3.5 h-3.5 shrink-0 text-text-muted group-hover:text-primary" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {(loadingSessions || sessions.length > 0) && (
        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-medium text-text-muted">Recent</p>
            <button
              type="button"
              onClick={() => navigate("/lawyer/ai")}
              className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
            >
              View all
              <FiArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loadingSessions ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-surface animate-pulse" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-card-border overflow-hidden">
              {sessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => openSession(s)}
                    className="group flex w-full items-center gap-3 px-3 py-2.5 text-left bg-card hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate group-hover:text-primary">
                        {s.title || "New conversation"}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {timeAgo(s.updatedAt)}
                        {s.messageCount > 0 && ` · ${s.messageCount} messages`}
                      </p>
                    </div>
                    <FiChevronRight className="w-4 h-4 shrink-0 text-text-muted group-hover:text-primary" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
