import { useState, useRef, useEffect } from "react";
import { FiSend } from "react-icons/fi";

const MAX_HEIGHT = 140;

export default function SessionChatComposer({ onSend, disabled = false, placeholder }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [text]);

  function handleSubmit(e) {
    e?.preventDefault();
    const value = text.trim();
    if (!value || disabled) return;
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend(value);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div className="shrink-0 border-t border-card-border bg-card px-4 py-3 sm:px-5">
      <form onSubmit={handleSubmit}>
        <div className="flex items-end gap-2 rounded-2xl border border-input-border bg-input-background shadow-sm transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-light">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Type your message…"}
            disabled={disabled}
            rows={1}
            className="flex-1 min-h-[44px] max-h-[140px] py-3 pl-4 pr-2 bg-transparent text-input-text text-sm outline-none resize-none font-inherit disabled:opacity-60 leading-relaxed"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            className={`shrink-0 m-1.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              canSend
                ? "bg-primary text-primary-text hover:bg-primary-hover cursor-pointer"
                : "bg-surface text-text-muted cursor-not-allowed"
            }`}
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-text-muted m-0">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </form>
    </div>
  );
}
