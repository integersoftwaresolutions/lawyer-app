import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiMessageCircle, FiVideo } from "react-icons/fi";
import { createSocket } from "../../services/socket";
import { useAuth } from "../../hooks/useAuth";
import { bookingApi } from "../../services/booking.api";
import { Button } from "../../components/ui";
import VideoCall from "../../components/video/VideoCall";
import SessionChatMessage from "../../components/chat/SessionChatMessage";
import SessionChatComposer from "../../components/chat/SessionChatComposer";

function sameUserId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

function participantFromBooking(booking, role) {
  if (!booking) return null;
  if (role === "CLIENT") {
    return booking.lawyerUserId || null;
  }
  return booking.clientId || null;
}

function participantLabel(role) {
  return role === "CLIENT" ? "Lawyer" : "Client";
}

export default function SessionChat() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const bootedRef = useRef(false);

  const socket = useMemo(() => createSocket(), []);
  const [sessionId, setSessionId] = useState(null);
  const [session, setSession] = useState(null);
  const [booking, setBooking] = useState(null);
  const [items, setItems] = useState([]);
  const [showVideoPanel, setShowVideoPanel] = useState(true);
  const [loading, setLoading] = useState(true);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [items, scrollToBottom]);

  useEffect(() => {
    async function boot() {
      if (bootedRef.current) return;
      bootedRef.current = true;

      try {
        const [sessionRes, bookingRes] = await Promise.all([
          bookingApi.session(bookingId),
          bookingApi.get(bookingId),
        ]);
        const sid = sessionRes.data._id;
        setSessionId(sid);
        setSession(sessionRes.data);
        setBooking(bookingRes.data);

        socket.auth = { token: localStorage.getItem("accessToken") };
        if (!socket.connected) socket.connect();

        const onHistory = (payload) => {
          if (payload.sessionId !== sid) return;
          setItems(payload.items || []);
        };

        const onNew = (msg) => {
          if (!msg || msg.sessionId !== sid) return;
          setItems((prev) => {
            if (prev.some((x) => x._id === msg._id)) return prev;
            return [...prev, msg];
          });
        };

        socket.off("chat:history");
        socket.off("chat:new");
        socket.on("chat:history", onHistory);
        socket.on("chat:new", onNew);

        socket.emit("session:join", { bookingId });
      } catch (error) {
        console.error("Failed to load session:", error);
      } finally {
        setLoading(false);
      }
    }

    boot();

    return () => {
      bootedRef.current = false;
      socket.off("chat:history");
      socket.off("chat:new");
      socket.disconnect();
    };
  }, [bookingId, socket]);

  const send = useCallback(
    (text) => {
      if (!text.trim() || !sessionId) return;
      socket.emit("chat:send", { sessionId, text });
    },
    [sessionId, socket]
  );

  const otherParticipant = useMemo(
    () => participantFromBooking(booking, user?.role),
    [booking, user?.role]
  );

  const otherName =
    otherParticipant?.fullName ||
    otherParticipant?.email?.split("@")[0] ||
    participantLabel(user?.role);

  const sessionTypeLabel = booking?.consultationType?.replace(/_/g, " ") || "Chat";
  const durationLabel = booking?.durationMinutes || 30;

  if (loading) {
    return (
      <div className="h-dvh overflow-hidden bg-background flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-text-secondary">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading session…
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-background text-text-primary flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0 px-4 sm:px-6 py-4 sm:py-5">
        <Button
          variant="ghost"
          size="sm"
          icon={FiArrowLeft}
          onClick={() => navigate(-1)}
          className="mb-3 -ml-2 self-start shrink-0"
        >
          Back
        </Button>

        <div className="shrink-0 flex items-start gap-3 mb-3 sm:mb-4">
          <div className="p-2 rounded-xl bg-primary-light text-primary shrink-0">
            <FiMessageCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-text-primary leading-tight m-0">
              Session chat
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 mb-0">
              Chatting with {otherName} · {durationLabel} min {sessionTypeLabel.toLowerCase()} session
            </p>
          </div>
        </div>

        {session?.allowVideo && (
          <div className="shrink-0 mb-3 sm:mb-4">
            {showVideoPanel ? (
              <VideoCall
                sessionId={sessionId}
                socket={socket}
                durationMinutes={durationLabel}
                otherUserName={participantLabel(user?.role)}
                onEnd={() => setShowVideoPanel(false)}
              />
            ) : (
              <Button variant="secondary" outline icon={FiVideo} onClick={() => setShowVideoPanel(true)}>
                Open video call
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col flex-1 min-h-0 border border-card-border rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[12rem] text-center px-4">
                <div className="p-3 rounded-2xl bg-primary-light text-primary mb-4">
                  <FiMessageCircle className="w-8 h-8" />
                </div>
                <p className="text-base font-medium text-text-primary m-0">No messages yet</p>
                <p className="text-sm text-text-muted mt-2 m-0 max-w-xs">
                  Say hello to start your consultation conversation.
                </p>
              </div>
            ) : (
              items.map((m) => {
                const isOwn = sameUserId(m.senderId, user?.id);
                return (
                  <SessionChatMessage
                    key={m._id}
                    message={m}
                    isOwn={isOwn}
                    senderUser={isOwn ? user : otherParticipant}
                    senderLabel={isOwn ? "You" : participantLabel(user?.role)}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <SessionChatComposer onSend={send} placeholder="Message your consultant…" />
        </div>
      </div>
    </div>
  );
}
