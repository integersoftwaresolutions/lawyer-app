import { useMemo, useState } from "react";
import { FiAlertCircle, FiDownload, FiEdit3, FiTarget, FiUserX } from "react-icons/fi";
import { Badge, Button, ConfirmModal, PageHeader } from "../../components/ui";
import { aiApi } from "../../services/ai.api";
import { getErrorMessage } from "../../utils/errorHandler";
import ChatPanel from "../../components/ai/ChatPanel";
import CrossExamBriefModal from "../../components/ai/CrossExamBriefModal";

const TONE_OPTIONS = [
  { value: "measured", label: "Measured (calm, methodical)" },
  { value: "aggressive", label: "Aggressive (sharp, leading)" }
];

const TYPE_OPTIONS = [
  { value: "criminal", label: "Criminal" },
  { value: "civil", label: "Civil" }
];

export default function LawyerCrossExamPage() {
  const [panelContext, setPanelContext] = useState(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefBusy, setBriefBusy] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState(null);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);

  const activeSessionId = panelContext?.activeSessionId || null;
  const activeSession = panelContext?.activeSession || null;
  const messages = panelContext?.messages || [];
  const usageSummary = panelContext?.usageSummary || null;
  const error = panelContext?.error || null;
  const clearError = panelContext?.clearError || (() => {});

  const caseBrief = activeSession?.metadata?.caseBrief || null;
  const tone = activeSession?.metadata?.tone || "measured";
  const examType = activeSession?.metadata?.examType || "civil";
  const sessionEnded = useMemo(
    () => messages.some((m) => m.role === "assistant" && /\[END_OF_CROSS_EXAM\]/i.test(m.content)),
    [messages]
  );

  const hasBrief = !!caseBrief && !!(caseBrief.facts || "").trim();
  const isRateLimited = error?.toLowerCase().includes("daily ai request limit");
  const canDownloadReport = !!activeSessionId && (sessionEnded || messages.length >= 2);

  async function handleNewSession(ctx) {
    ctx.clearError();
    setReportError(null);
    try {
      await ctx.createSession({
        title: "New cross-examination",
        metadata: { tone: "measured", examType: "civil" }
      });
      setBriefOpen(true);
    } catch {
      // surfaced in error banner
    }
  }

  async function handleDelete(sessionId, ctx) {
    setPendingDeleteSessionId(sessionId);
  }

  async function confirmDeleteSession(ctx) {
    if (!pendingDeleteSessionId || !ctx) return;
    await ctx.deleteSession(pendingDeleteSessionId);
    setPendingDeleteSessionId(null);
    setReportError(null);
  }

  async function handleSubmitBrief(brief) {
    if (!activeSessionId || !panelContext) return;
    setBriefBusy(true);
    try {
      await panelContext.updateSession(activeSessionId, {
        metadata: {
          caseBrief: brief,
          tone: activeSession?.metadata?.tone || "measured",
          examType: activeSession?.metadata?.examType || "civil"
        }
      });
      setBriefOpen(false);
      if ((panelContext.messages || []).length === 0) {
        await panelContext.sendMessage(
          "Please begin cross-examining me based on the case brief I just provided."
        );
      }
    } catch {
      // surfaced in error banner
    } finally {
      setBriefBusy(false);
    }
  }

  async function handleToneChange(value) {
    if (!activeSessionId || !panelContext || value === tone) return;
    try {
      await panelContext.updateSession(activeSessionId, { metadata: { tone: value } });
    } catch {
      /* error is rendered in banner */
    }
  }

  async function handleTypeChange(value) {
    if (!activeSessionId || !panelContext || value === examType) return;
    try {
      await panelContext.updateSession(activeSessionId, { metadata: { examType: value } });
    } catch {
      /* error is rendered in banner */
    }
  }

  async function handleEndSession() {
    if (!activeSessionId || !panelContext || sessionEnded) return;
    setConfirmEndOpen(true);
  }

  async function confirmEndSession() {
    if (!activeSessionId || !panelContext || sessionEnded) return;
    await panelContext.sendMessage("/end").catch(() => {});
    setConfirmEndOpen(false);
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

  const beforeSendGuard = () => {
    if (!activeSessionId) return { allowed: false, reason: "Start a cross-exam session first." };
    if (!hasBrief) return { allowed: false, reason: "Add a case brief first to begin." };
    if (sessionEnded) return { allowed: false, reason: "Session ended. Start a new cross-exam to continue." };
    return { allowed: true };
  };

  const headerBadge = useMemo(
    () =>
      activeSessionId ? (
        <Badge variant="warning" size="sm" className="shrink-0 hidden xl:inline-flex">
          {examType === "criminal" ? "Criminal" : "Civil"} · {tone}
        </Badge>
      ) : null,
    [activeSessionId, examType, tone]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <PageHeader
        size="compact"
        icon={FiTarget}
        iconClassName="bg-warning-light text-warning"
        title="Cross-Examination Practice"
        subtitle="Rehearse against an AI opposing counsel · download Prep Report when done"
        actions={
          usageSummary ? (
            <Badge variant="info" size="sm" className="shrink-0 hidden sm:inline-flex">
              {(usageSummary.totalTokens || 0).toLocaleString()} tokens
            </Badge>
          ) : null
        }
        className="shrink-0 mb-2 sm:mb-3"
      />

      <ChatPanel
        mode="cross_exam"
        className="flex-1 min-h-0"
        showFilters={false}
        conversationsLabel="Cross-exam sessions"
        headerIcon={FiTarget}
        headerIconClassName="bg-warning-light text-warning"
        headerTitle={(ctx) => ctx.activeSession?.title || "Start a new cross-exam"}
        headerSubtitle="Opposing-counsel mode · stay in role"
        headerBadge={headerBadge}
        toolbarContent={() =>
          activeSessionId ? (
            <>
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
              {canDownloadReport && (
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
            </>
          ) : null
        }
        onNewChat={handleNewSession}
        onDeleteSession={handleDelete}
        beforeSendGuard={beforeSendGuard}
        emptyStateRenderer={(ctx) => {
          if (!ctx.activeSessionId) return <CrossExamSplash onStart={() => handleNewSession(ctx)} />;
          if (!hasBrief) {
            return (
              <div className="min-h-[22rem] flex items-center justify-center">
                <BriefRequiredCard onOpen={() => setBriefOpen(true)} />
              </div>
            );
          }
          return (
            <div className="min-h-[22rem] flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm text-text-secondary m-0">
                Send your first answer to begin the cross-examination.
              </p>
            </div>
          );
        }}
        postMessagesContent={() =>
          sessionEnded ? (
            <div className="rounded-xl border border-warning-border bg-warning-light text-text-secondary text-sm p-4 text-center">
              Session ended. Click <strong>Prep report PDF</strong> above to download a
              structured analysis.
            </div>
          ) : null
        }
        errorRenderer={() => {
          if (!error && !reportError) return null;
          return (
            <div
              className={`shrink-0 mx-4 mt-3 flex items-start gap-2 rounded-lg p-3 text-sm border ${
                isRateLimited
                  ? "bg-warning-light text-warning border-warning-border"
                  : "bg-danger-light text-danger border-danger-border"
              }`}
            >
              <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="break-words m-0">{error || reportError}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setReportError(null);
                }}
                className="text-xs shrink-0 underline"
              >
                Dismiss
              </button>
            </div>
          );
        }}
        onContextChange={setPanelContext}
      />

      <CrossExamBriefModal
        isOpen={briefOpen}
        onClose={() => setBriefOpen(false)}
        onSubmit={handleSubmitBrief}
        initialBrief={caseBrief}
        busy={briefBusy}
        submitLabel={hasBrief ? "Save brief" : "Save & start cross-exam"}
      />

      <ConfirmModal
        isOpen={!!pendingDeleteSessionId}
        onClose={() => setPendingDeleteSessionId(null)}
        onConfirm={() => confirmDeleteSession(panelContext)}
        title="Delete cross-exam session?"
        confirmLabel="Delete permanently"
        confirmVariant="danger"
      >
        <p className="text-text-secondary mt-0 mb-0">
          This will permanently delete this cross-examination session, including the case brief,
          messages, and generated report history. This cannot be undone.
        </p>
      </ConfirmModal>

      <ConfirmModal
        isOpen={confirmEndOpen}
        onClose={() => setConfirmEndOpen(false)}
        onConfirm={confirmEndSession}
        title="End session and prepare report?"
        confirmLabel="End and prepare report"
        confirmVariant="warning"
      >
        <p className="text-text-secondary mt-0 mb-0">
          This will end the live cross-examination and trigger report preparation based on this
          session. You can still download the prep report afterward.
        </p>
      </ConfirmModal>
    </div>
  );
}

function ToolbarSelect({ value, onChange, options, ariaLabel }) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 px-2.5 rounded-md border border-input-border bg-input-background text-input-text text-xs cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
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
      <div className="w-14 h-14 rounded-2xl bg-warning-light text-warning flex items-center justify-center mb-4">
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
    <div className="w-full max-w-2xl rounded-xl border border-card-border bg-surface p-6 text-center">
      <div className="w-10 h-10 mx-auto rounded-xl bg-surface border border-card-border text-text-secondary flex items-center justify-center mb-3">
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
