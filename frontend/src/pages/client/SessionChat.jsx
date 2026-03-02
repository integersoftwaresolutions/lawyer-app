import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createSocket } from "../../services/socket";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import { bookingApi } from "../../services/booking.api";
import { Button } from "../../components/ui";

export default function SessionChat() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const messagesEndRef = useRef(null);
  const bootedRef = useRef(false);

  const socket = useMemo(() => createSocket(), []);
  const [sessionId, setSessionId] = useState(null);
  const [booking, setBooking] = useState(null);
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [items]);

  useEffect(() => {
    async function boot() {
      if (bootedRef.current) return;
      bootedRef.current = true;

      try {
        const [sessionRes, bookingRes] = await Promise.all([
          bookingApi.session(bookingId),
          bookingApi.get(bookingId)
        ]);
        const sid = sessionRes.data._id;
        setSessionId(sid);
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
  }, [bookingId]);

  function send() {
    if (!text.trim() || !sessionId) return;
    socket.emit("chat:send", { sessionId, text });
    setText("");
  }

  function handleKeyPress(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const containerStyles = {
    minHeight: "100vh",
    backgroundColor: colors.background,
    padding: "24px",
  };

  const headerStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  };

  const chatContainerStyles = {
    border: `1px solid ${colors.border}`,
    borderRadius: "8px",
    backgroundColor: colors.card,
    height: "500px",
    display: "flex",
    flexDirection: "column",
  };

  const messagesStyles = {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
  };

  const inputContainerStyles = {
    display: "flex",
    gap: "12px",
    padding: "16px",
    borderTop: `1px solid ${colors.border}`,
  };

  const inputStyles = {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "6px",
    border: `1px solid ${colors.input.border}`,
    backgroundColor: colors.input.background,
    color: colors.input.text,
    fontSize: "14px",
    outline: "none",
  };

  if (loading) {
    return (
      <div style={{ ...containerStyles, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: colors.text.secondary }}>Loading chat...</p>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={headerStyles}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: colors.text.primary, marginBottom: "4px" }}>
              Session Chat
            </h1>
            <p style={{ color: colors.text.secondary, fontSize: "14px" }}>
              {booking?.consultationType || "CHAT"} session • {booking?.durationMinutes || 30} minutes
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        </div>

        <div style={chatContainerStyles}>
          <div style={messagesStyles}>
            {items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: colors.text.secondary }}>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              items.map((m) => (
                <div
                  key={m._id}
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: m.senderId === user?.id ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      backgroundColor: m.senderId === user?.id ? colors.button.primary : colors.surface,
                      color: m.senderId === user?.id ? colors.button.primaryText : colors.text.primary,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "14px" }}>{m.text}</p>
                    <p style={{ 
                      margin: "4px 0 0 0", 
                      fontSize: "11px", 
                      opacity: 0.7 
                    }}>
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={inputContainerStyles}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={inputStyles}
            />
            <Button onClick={send} disabled={!text.trim()}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
