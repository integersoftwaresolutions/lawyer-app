import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  FiAlertCircle,
  FiCpu,
  FiDownload,
  FiEdit3,
  FiMessageSquare,
  FiTarget,
  FiUserX,
  FiX
} from "react-icons/fi";
import { Badge, Button } from "../../components/ui";
import { useAiChat } from "../../hooks/useAiChat";
import { aiApi } from "../../services/ai.api";
import { getErrorMessage } from "../../utils/errorHandler";
import SessionList from "../../components/ai/SessionList";
import ChatMessage from "../../components/ai/ChatMessage";
import ChatInput from "../../components/ai/ChatInput";
import ChatTypingIndicator from "../../components/ai/ChatTypingIndicator";
import CrossExamBriefModal from "../../components/ai/CrossExamBriefModal";

const SCROLL_THRESHOLD = 100;

const TONE_OPTIONS = [
  { value: "measured", label: "Measured (calm, methodical)" },
  { value: "aggressive", label: "Aggressive (sharp, leading)" }
];

const TYPE_OPTIONS = [
  { value: "criminal", label: "Criminal" },
  { value: "civil", label: "Civil" }
];

export default function LawyerCrossExamPage() {
  const {
    sessions,
    activeSessionId,
    activeSession,
    messages,
    sessionsLoading,
    messagesLoading,
    sending,
    error,
    usageSummary,
    createSession,
    updateSession,
    selectSession,
    sendMessage,
    deleteSession,
    clearError
  } = useAiChat({ mode: "cross_exam", autoSelectLatest: true });

  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const [conversationsOpen, setConversationsOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefBusy, setBriefBusy] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState(null);

  const caseBrief = activeSession?.metadata?.caseBrief || null;
  const tone = activeSession?.metadata?.tone || "measured";
  const examType = activeSession?.metadata?.examType || "civil";
  const sessionEnded = useMemo(
    () => messages.some((m) => m.role === "assistant" && /\[END_OF_CROSS_EXAM\]/i.test(m.content)),
    [messages]
  );

  const hasBrief = !!caseBrief && !!(caseBrief.facts || "").trim();
  const showBriefPrompt = !!activeSession && !hasBrief && messages.length === 0;

  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < SCROLL_THRESHOLD;
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(messages.length <= 2 ? "auto" : "smooth");
    }
  }, [messages, sending, scrollToBottom]);

  async function handleNewSession() {
    clearError();
    setReportError(null);
    try {
      await createSession({
        title: "New cross-examination",
        metadata: { tone: "measured", examType: "civil" }
      });
      setBriefOpen(true);
    } catch {
      // surfaced in error banner
    }
  }

  async function handleDelete(sessionId) {
    if (!window.confirm("Delete this cross-examination session?")) return;
    await deleteSession(sessionId);
  }

  function handleSelectSession(sessionId) {
    selectSession(sessionId);
    setConversationsOpen(false);
    setReportError(null);
  }

  async function handleSubmitBrief(brief) {
    if (!activeSessionId) return;
    setBriefBusy(true);
    try {
      await updateSession(activeSessionId, {
        metadata: {
          caseBrief: brief,
          tone: activeSession?.metadata?.tone || "measured",
          examType: activeSession?.metadata?.examType || "civil"
        }
      });
      setBriefOpen(false);
      // Kick off the cross-examination immediately so the lawyer doesn't have
      // to type a redundant prompt.
      await sendMessage(
        "Please begin cross-examining me based on the case brief I just provided."
      );
    } catch {
      // surfaced in error banner
    } finally {
      setBriefBusy(false);
    }
  }

  async function handleToneChange(value) {
    if (!activeSessionId || value === tone) return;
    try {
      await updateSession(activeSessionId, { metadata: { tone: value } });
    } catch {
      /* error is rendered in banner */
    }
  }

  async function handleTypeChange(value) {
    if (!activeSessionId || value === examType) return;
    try {
      await updateSession(activeSessionId, { metadata: { examType: value } });
    } catch {
      /* error is rendered in banner */
    }
  }

  async function handleEndSession() {
    if (!activeSessionId || sessionEnded) return;
    if (!window.confirm("End the cross-examination and prepare the report?")) return;
    await sendMessage("/end").catch(() => {});
  }

  async function handleDownloadReport() {
    if (!activeSessionId) return;
    setReportBusy(true);
    setReportError(null);
    try {
      const blob = await aiApi.downloadPrepReportPdf(activeSessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (activeSession?.title || "cross-exam")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "cross-exam";
      a.download = `prep-report-${safeTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setReportError(getErrorMessage(err));
    } finally {
      setReportBusy(false);
    }
  }

  const isRateLimited = error?.toLowerCase().includes("daily ai request limit");
  const canSendMessages = !!activeSessionId && hasBrief && !sessionEnded;

  const sessionList = (
    <SessionList
      sessions={sessions}
      activeSessionId={activeSessionId}
      loading={sessionsLoading}
      onSelect={handleSelectSession}
      onNewChat={handleNewSession}
      onDelete={handleDelete}
    />
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-warning/10 text-warning shrink-0">
            <FiTarget className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-text-primary leading-tight truncate">
              Cross-Examination Practice
            </h1>
            <p className="text-[11px] text-text-muted truncate hidden sm:block">
              Rehearse against an AI opposing counsel · download Prep Report when done
            </p>
          </div>
        </div>
        <Badge variant="warning" size="sm" className="shrink-0 hidden sm:inline-flex">
          {examType === "criminal" ? "Criminal" : "Civil"} · {tone}
        </Badge>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row border border-card-border rounded-xl overflow-hidden bg-card shadow-sm">
        {/* Mobile drawer */}
        <div
          className={`fixed inset-0 z-[60] lg:hidden transition-opacity duration-300 ${
            conversationsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConversationsOpen(false)}
            aria-hidden="true"
          />
          <aside
            className={`absolute top-0 left-0 bottom-0 w-[min(300px,88vw)] bg-card border-r border-card-border shadow-xl flex flex-col transition-transform duration-300 ${
              conversationsOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-card-border">
              <span className="text-sm font-semibold">Cross-exam sessions</span>
              <button
                type="button"
                onClick={() => setConversationsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">{sessionList}</div>
          </aside>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex shrink-0 flex-col min-h-0 border-r border-card-border bg-surface/30 w-[260px]">
          {sessionList}
        </aside>

        {/* Main column */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Header */}
          <header className="shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-card-border bg-card flex-wrap">
            <button
              type="button"
              onClick={() => setConversationsOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-hover text-text-secondary shrink-0"
              aria-label="Open sessions"
            >
              <FiMessageSquare className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0 hidden sm:flex">
              <FiTarget className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {activeSession?.title || "Start a new cross-exam"}
              </h3>
              <p className="text-[11px] text-text-muted truncate">
                Opposing-counsel mode · stay in role
              </p>
            </div>

            {activeSessionId && (
              <div className="flex items-center gap-2 flex-wrap">
                <ToolbarSelect
                  value={tone}
                  onChange={handleToneChange}
                  options={TONE_OPTIONS}
                  ariaLabel="Tone"
                />
                <ToolbarSelect
                  value={examType}
                  onChange={handleTypeChange}
                  options={TYPE_OPTIONS}
                  ariaLabel="Case type"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  icon={FiEdit3}
                  onClick={() => setBriefOpen(true)}
                >
                  {hasBrief ? "Edit brief" : "Add brief"}
                </Button>
                {!sessionEnded && messages.length >= 2 && (
                  <Button size="sm" variant="warning" icon={FiUserX} onClick={handleEndSession}>
                    End & report
                  </Button>
                )}
                {(sessionEnded || messages.length >= 2) && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={FiDownload}
                    onClick={handleDownloadReport}
                    loading={reportBusy}
                  >
                    Prep report PDF
                  </Button>
                )}
              </div>
            )}

            {usageSummary && (
              <Badge variant="info" size="sm" className="shrink-0 hidden xl:inline-flex">
                {(usageSummary.totalTokens || 0).toLocaleString()} tokens
              </Badge>
            )}
          </header>

          {/* Errors */}
          {(error || reportError) && (
            <div
              className={`shrink-0 mx-4 mt-3 flex items-start gap-2 rounded-lg p-3 text-sm ${
                isRateLimited
                  ? "bg-warning/15 text-warning border border-warning/30"
                  : "bg-danger/10 text-danger border border-danger/20"
              }`}
            >
              <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="break-words">{error || reportError}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setReportError(null);
                }}
                className="text-xs shrink-0 underline opacity-80 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
          >
            <div className="max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
              {!activeSessionId ? (
                <CrossExamSplash onStart={handleNewSession} />
              ) : messagesLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-text-secondary">Loading transcript…</p>
                </div>
              ) : showBriefPrompt ? (
                <BriefRequiredCard onOpen={() => setBriefOpen(true)} />
              ) : (
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  {sending && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning/15 text-warning flex items-center justify-center shrink-0">
                        <FiCpu className="w-4 h-4" />
                      </div>
                      <div className="rounded-2xl rounded-tl-md bg-surface border border-card-border px-4 py-2">
                        <ChatTypingIndicator />
                      </div>
                    </div>
                  )}
                  {sessionEnded && (
                    <div className="rounded-xl border border-warning/30 bg-warning/5 text-text-secondary text-sm p-4 text-center">
                      Session ended. Click <strong>Prep report PDF</strong> above to download a
                      structured analysis.
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden="true" />
            </div>
          </div>

          {/* Input */}
          {activeSessionId && (
            <ChatInput
              onSend={(text) => sendMessage(text)}
              disabled={!canSendMessages || sending || messagesLoading}
              placeholder={
                sessionEnded
                  ? "Session ended. Start a new cross-exam to continue practising."
                  : !hasBrief
                    ? "Add a case brief first to begin."
                    : "Answer the cross-examination question…"
              }
            />
          )}
        </div>
      </div>

      <CrossExamBriefModal
        isOpen={briefOpen}
        onClose={() => setBriefOpen(false)}
        onSubmit={handleSubmitBrief}
        initialBrief={caseBrief}
        busy={briefBusy}
        submitLabel={hasBrief ? "Save brief" : "Save & start cross-exam"}
      />
    </div>
  );
}

function ToolbarSelect({ value, onChange, options, ariaLabel }) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 px-2.5 rounded-md border border-input-border bg-input-background text-input-text text-xs cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function CrossExamSplash({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mb-4">
        <FiTarget className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">Practise against AI opposing counsel</h3>
      <p className="text-sm text-text-secondary max-w-md mb-6">
        Submit your case facts, witness list, and arguments. The AI will role-play opposing counsel
        — asking pointed cross-examination questions and evaluating your answers. End the session
        any time to download a Preparation Report PDF.
      </p>
      <Button onClick={onStart} icon={FiTarget}>
        Start a cross-examination session
      </Button>
    </div>
  );
}

function BriefRequiredCard({ onOpen }) {
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-6 text-center">
      <div className="w-10 h-10 mx-auto rounded-xl bg-warning/15 text-warning flex items-center justify-center mb-3">
        <FiEdit3 className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-semibold text-text-primary mb-1">Add a case brief to begin</h4>
      <p className="text-xs text-text-secondary mb-4 max-w-md mx-auto">
        The AI uses your brief to generate realistic cross-examination questions. The more facts,
        witness statements, and acknowledged weaknesses you include, the more useful the rehearsal.
      </p>
      <Button onClick={onOpen} icon={FiEdit3}>
        Open brief form
      </Button>
    </div>
  );
}
