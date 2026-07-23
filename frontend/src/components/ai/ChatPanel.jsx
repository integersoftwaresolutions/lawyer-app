import { useEffect, useRef, useCallback, useState } from "react";
import { FiAlertCircle, FiCpu, FiMessageSquare, FiX } from "react-icons/fi";
import { Badge, ConfirmModal } from "../ui";
import { useAiChat } from "../../hooks/useAiChat";
import SessionList from "./SessionList";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatTypingIndicator from "./ChatTypingIndicator";
import ChatEmptyState from "./ChatEmptyState";
import AssistantAvatar from "./AssistantAvatar";
import ResearchFilters from "./ResearchFilters";

const SCROLL_THRESHOLD = 100;

export default function ChatPanel({
  mode = "research",
  initialSessionId = null,
  initialMessage = null,
  compactSessions = false,
  className = "",
  showFilters = mode === "research",
  conversationsLabel = "Conversations",
  headerIcon: HeaderIcon = FiCpu,
  headerIconClassName = "bg-primary-light text-primary",
  headerTitle,
  headerSubtitle,
  headerBadge,
  toolbarContent,
  beforeSendGuard,
  emptyStateRenderer,
  postMessagesContent,
  errorRenderer,
  onNewChat,
  onDeleteSession,
  onContextChange
}) {
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
    clearError,
    loadSession
  } = useAiChat({ mode, autoSelectLatest: !initialSessionId });

  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const initialMessageSent = useRef(false);
  const [conversationsOpen, setConversationsOpen] = useState(false);
  const [filters, setFilters] = useState({});
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState(null);

  function buildSendOptions() {
    const out = {};
    if (showFilters && filters && Object.keys(filters).length > 0) {
      out.filters = filters;
    }
    return out;
  }

  async function handleSend(text) {
    const options = buildSendOptions();
    return sendMessage(text, options);
  }

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
    if (initialSessionId) loadSession(initialSessionId);
  }, [initialSessionId, loadSession]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(messages.length <= 2 ? "auto" : "smooth");
    }
  }, [messages, sending, scrollToBottom]);

  useEffect(() => {
    if (!initialMessage || initialMessageSent.current || messagesLoading || sending) return;
    initialMessageSent.current = true;
    sendMessage(initialMessage, buildSendOptions()).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, messagesLoading, sending, sendMessage]);

  const panelContext = {
    mode,
    sessions,
    activeSessionId,
    activeSession,
    messages,
    sessionsLoading,
    messagesLoading,
    sending,
    error,
    usageSummary,
    filters,
    setFilters,
    createSession,
    updateSession,
    selectSession,
    sendMessage: handleSend,
    deleteSession,
    clearError,
    loadSession
  };

  useEffect(() => {
    onContextChange?.(panelContext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    onContextChange,
    mode,
    activeSessionId,
    sessionsLoading,
    messagesLoading,
    sending,
    error,
    sessions,
    activeSession,
    messages,
    usageSummary,
    filters
  ]);

  const guardResult = beforeSendGuard ? beforeSendGuard(panelContext) : { allowed: true };
  const canSend =
    typeof guardResult === "boolean" ? guardResult : (guardResult?.allowed ?? true);
  const guardReason =
    typeof guardResult === "object" && guardResult?.reason ? guardResult.reason : "";

  const resolvedHeaderTitle =
    typeof headerTitle === "function"
      ? headerTitle(panelContext)
      : (headerTitle || activeSession?.title || "New conversation");
  const resolvedHeaderSubtitle =
    typeof headerSubtitle === "function"
      ? headerSubtitle(panelContext)
      : (headerSubtitle || "Pakistani law · research mode");
  const resolvedHeaderBadge =
    typeof headerBadge === "function" ? headerBadge(panelContext) : headerBadge;
  const resolvedToolbar =
    typeof toolbarContent === "function" ? toolbarContent(panelContext) : toolbarContent;

  async function handleNewChat() {
    clearError();
    try {
      if (onNewChat) {
        await onNewChat(panelContext);
      } else {
        await createSession();
      }
    } catch {
      // error shown in banner
    }
  }

  async function handleDelete(sessionId) {
    if (onDeleteSession) {
      await onDeleteSession(sessionId, panelContext);
      return;
    }
    setPendingDeleteSessionId(sessionId);
  }

  async function confirmDeleteSession() {
    if (!pendingDeleteSessionId) return;
    await deleteSession(pendingDeleteSessionId);
    setPendingDeleteSessionId(null);
  }

  function handleSelectSession(sessionId) {
    selectSession(sessionId);
    setConversationsOpen(false);
  }

  async function handleSuggestion(text) {
    try {
      await handleSend(text);
    } catch {
      // error shown in banner
    }
  }

  const isRateLimited = error?.toLowerCase().includes("daily ai request limit");

  const sessionList = (
    <SessionList
      sessions={sessions}
      activeSessionId={activeSessionId}
      loading={sessionsLoading}
      onSelect={handleSelectSession}
      onNewChat={handleNewChat}
      onDelete={handleDelete}
      compact={compactSessions}
    />
  );

  return (
    <div
      className={`flex flex-col lg:flex-row h-full min-h-0 border border-card-border rounded-xl overflow-hidden bg-card shadow-sm ${className}`}
    >
      {/* Mobile conversations drawer */}
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
            <span className="text-sm font-semibold">{conversationsLabel}</span>
            <button
              type="button"
              onClick={() => setConversationsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"
              aria-label="Close conversations"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0">{sessionList}</div>
        </aside>
      </div>

      {/* Desktop conversations sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col min-h-0 border-r border-card-border bg-surface ${
          compactSessions ? "w-[240px]" : "w-[260px]"
        }`}
      >
        {sessionList}
      </aside>

      {/* Main chat column */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header — fixed */}
        <header className="shrink-0 flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-card-border bg-card">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setConversationsOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-surface-hover text-text-secondary shrink-0"
              aria-label="Open conversations"
            >
              <FiMessageSquare className="w-5 h-5" />
            </button>
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 hidden sm:flex ${headerIconClassName}`}
            >
              <HeaderIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {resolvedHeaderTitle}
              </h3>
              <p className="text-[11px] text-text-muted truncate">
                {resolvedHeaderSubtitle}
              </p>
            </div>
          </div>
          {resolvedToolbar && <div className="flex items-center gap-2 flex-wrap">{resolvedToolbar}</div>}
          {resolvedHeaderBadge || (
            usageSummary && (
              <Badge variant="info" size="sm" className="shrink-0 hidden sm:inline-flex">
                {(usageSummary.totalTokens || 0).toLocaleString()} tokens
              </Badge>
            )
          )}
        </header>

        {/* Error banner — fixed */}
        {errorRenderer
          ? errorRenderer({
              ...panelContext,
              isRateLimited,
              clearError
            })
          : error && (
            <div
              className={`shrink-0 mx-4 mt-3 flex items-start gap-2 rounded-lg p-3 text-sm border ${
                isRateLimited
                  ? "bg-warning-light text-warning border-warning-border"
                  : "bg-danger-light text-danger border-danger-border"
              }`}
            >
              <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="break-words m-0">{error}</p>
                {isRateLimited && (
                  <p className="text-xs mt-1 mb-0">Limit resets tomorrow.</p>
                )}
              </div>
              <button
                type="button"
                onClick={clearError}
                className="text-xs shrink-0 underline"
              >
                Dismiss
              </button>
            </div>
          )}

        {/* Messages — scrollable fixed-height region */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        >
          <div className="max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
            {messagesLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-text-secondary">Loading messages…</p>
              </div>
            ) : (sessionsLoading && messages.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-text-secondary">Loading messages…</p>
              </div>
            ) : messages.length === 0 && !sending ? (
              emptyStateRenderer ? (
                emptyStateRenderer({
                  ...panelContext,
                  onSuggestion: handleSuggestion,
                  onNewChat: handleNewChat
                })
              ) : (
                <ChatEmptyState onSuggestion={handleSuggestion} onNewChat={handleNewChat} />
              )
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    assistantIcon={HeaderIcon}
                    assistantIconClassName={headerIconClassName}
                  />
                ))}
                {sending && (
                  <div className="flex gap-3">
                    <AssistantAvatar icon={HeaderIcon} className={headerIconClassName} />
                    <div className="rounded-2xl rounded-tl-md bg-surface border border-card-border px-4 py-3 shadow-sm">
                      <ChatTypingIndicator />
                    </div>
                  </div>
                )}
                {postMessagesContent &&
                  (typeof postMessagesContent === "function"
                    ? postMessagesContent(panelContext)
                    : postMessagesContent)}
              </div>
            )}
            <div ref={messagesEndRef} className="h-px shrink-0" aria-hidden="true" />
          </div>
        </div>

        {/* Filters row above input */}
        {showFilters && activeSessionId && (
          <div className="shrink-0 px-3 sm:px-4 pt-2 pb-1 border-t border-card-border bg-card">
            <ResearchFilters filters={filters} onChange={setFilters} />
          </div>
        )}

        {/* Input — pinned to bottom */}
        <ChatInput
          onSend={handleSend}
          disabled={sending || messagesLoading || !canSend}
          placeholder={guardReason || undefined}
        />
      </div>
      <ConfirmModal
        isOpen={!!pendingDeleteSessionId}
        onClose={() => setPendingDeleteSessionId(null)}
        onConfirm={confirmDeleteSession}
        title="Delete conversation?"
        confirmLabel="Delete permanently"
        confirmVariant="danger"
      >
        <p className="text-text-secondary mt-0 mb-0">
          This will permanently delete this conversation, including all messages and citations. This
          action cannot be undone.
        </p>
      </ConfirmModal>
    </div>
  );
}
