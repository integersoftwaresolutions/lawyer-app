import { useCallback, useEffect, useState } from "react";
import { aiApi } from "../services/ai.api";
import { getErrorMessage } from "../utils/errorHandler";

export function useAiChat({ mode = "research", autoSelectLatest = true } = {}) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [usageSummary, setUsageSummary] = useState(null);

  const loadUsage = useCallback(async () => {
    try {
      const res = await aiApi.getUsageSummary("month");
      setUsageSummary(res.data);
    } catch {
      // non-blocking
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setError(null);
    try {
      const res = await aiApi.listSessions({ mode, limit: 50 });
      setSessions(res.items || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSessionsLoading(false);
    }
  }, [mode]);

  const loadSession = useCallback(async (sessionId) => {
    if (!sessionId) return;
    setMessagesLoading(true);
    setError(null);
    try {
      const res = await aiApi.getSession(sessionId);
      setMessages(res.data?.messages || []);
      setActiveSessionId(sessionId);
      setActiveSession(res.data?.session || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const createSession = useCallback(
    async (overrides = {}) => {
      setError(null);
      try {
        const res = await aiApi.createSession({ mode, ...overrides });
        const session = res.data;
        setSessions((prev) => [session, ...prev]);
        setActiveSessionId(session.id);
        setActiveSession(session);
        setMessages([]);
        return session;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      }
    },
    [mode]
  );

  const updateSession = useCallback(
    async (sessionId, body) => {
      setError(null);
      try {
        const res = await aiApi.updateSession(sessionId, body);
        const updated = res.data;
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...updated } : s)));
        if (sessionId === activeSessionId) {
          setActiveSession((prev) => ({ ...(prev || {}), ...updated }));
        }
        return updated;
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      }
    },
    [activeSessionId]
  );

  const selectSession = useCallback(
    (sessionId) => {
      if (sessionId === activeSessionId) return;
      loadSession(sessionId);
    },
    [activeSessionId, loadSession]
  );

  const sendMessage = useCallback(
    async (content, options = {}) => {
      const trimmed = String(content || "").trim();
      if (!trimmed) return;

      let sessionId = activeSessionId;
      if (!sessionId) {
        const session = await createSession();
        sessionId = session.id;
      }

      const optimisticId = `pending-user-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
        optimistic: true
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setSending(true);
      setError(null);
      try {
        const body = options && Object.keys(options).length > 0
          ? { content: trimmed, options }
          : { content: trimmed };

        const res = await aiApi.sendMessage(sessionId, body);
        const { userMessage, assistantMessage } = res.data;
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((m) => m.id !== optimisticId);
          return [...withoutOptimistic, userMessage, assistantMessage];
        });
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  title:
                    s.title === "New conversation"
                      ? trimmed.length > 60
                        ? `${trimmed.slice(0, 57)}...`
                        : trimmed
                      : s.title,
                  messageCount: (s.messageCount || 0) + 2,
                  updatedAt: new Date().toISOString()
                }
              : s
          )
        );
        await loadUsage();
        return assistantMessage;
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setSending(false);
      }
    },
    [activeSessionId, createSession, loadUsage]
  );

  const deleteSession = useCallback(
    async (sessionId) => {
      setError(null);
      try {
        await aiApi.deleteSession(sessionId);
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setSessions(remaining);

        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
          setActiveSession(null);
          setMessages([]);
          if (remaining.length > 0) {
            await loadSession(remaining[0].id);
          }
        }
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      }
    },
    [sessions, activeSessionId, loadSession]
  );

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    loadSessions();
    loadUsage();
  }, [loadSessions, loadUsage]);

  useEffect(() => {
    if (!autoSelectLatest || activeSessionId || sessionsLoading || sessions.length === 0) return;
    loadSession(sessions[0].id);
  }, [autoSelectLatest, activeSessionId, sessions, sessionsLoading, loadSession]);

  return {
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
    loadSessions,
    loadSession,
    createSession,
    updateSession,
    selectSession,
    sendMessage,
    deleteSession,
    clearError,
    loadUsage
  };
}
