import { useState } from "react";
import { FiCopy, FiCheck, FiUser, FiCpu } from "react-icons/fi";

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end group">
        <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-2xl rounded-br-md bg-primary text-primary-text px-4 py-2.5 shadow-sm">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mb-0.5">
            <FiUser className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5">
        <FiCpu className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 max-w-[85%] sm:max-w-none">
        <div className="rounded-2xl rounded-tl-md bg-surface border border-card-border px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity px-1"
        >
          {copied ? (
            <>
              <FiCheck className="w-3.5 h-3.5" />
              Copied
            </>
          ) : (
            <>
              <FiCopy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
