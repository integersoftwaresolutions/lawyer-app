import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createSocket } from "../../services/socket";
import { useAuth } from "../../hooks/useAuth";
import { bookingApi } from "../../services/booking.api";
import { Button, Input } from "../../components/ui";

export default function SessionChat() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-text-secondary">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[800px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">
              Session Chat
            </h1>
            <p className="text-text-secondary text-sm">
              {booking?.consultationType || "CHAT"} session • {booking?.durationMinutes || 30} minutes
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        </div>

        <div className="border border-border rounded-lg bg-card h-[500px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-10 text-text-secondary">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              items.map((m) => (
                <div
                  key={m._id}
                  className={`mb-3 flex ${m.senderId === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] py-3 px-4 rounded-xl ${
                      m.senderId === user?.id 
                        ? "bg-primary text-primary-text" 
                        : "bg-surface text-text-primary"
                    }`}
                  >
                    <p className="m-0 text-sm">{m.text}</p>
                    <p className="mt-1 mb-0 text-[11px] opacity-70">
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-3 p-4 border-t border-border items-center">
            <Input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              containerClassName="flex-1 mb-0"
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
