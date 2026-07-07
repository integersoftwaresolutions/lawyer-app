import { useState } from "react";
import { FiCopy, FiCheck, FiUser, FiCpu, FiBookOpen, FiFileText, FiExternalLink, FiChevronDown, FiChevronUp } from "react-icons/fi";

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const [showCitations, setShowCitations] = useState(true);
  const isUser = message.role === "user";
  const citations = Array.isArray(message.citations) ? message.citations : [];

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
          <AssistantText content={message.content} citationCount={citations.length} />
        </div>

        {citations.length > 0 && (
          <CitationList
            citations={citations}
            expanded={showCitations}
            onToggle={() => setShowCitations((v) => !v)}
          />
        )}

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

function AssistantText({ content, citationCount }) {
  if (!citationCount) {
    return (
      <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
        {content}
      </p>
    );
  }

  // Highlight inline [N] citation markers so the user can visually pair them
  // with the source list below the bubble.
  const parts = content.split(/(\[\d+\])/g);
  return (
    <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        const m = /^\[(\d+)\]$/.exec(part);
        if (m) {
          const idx = Number(m[1]);
          return (
            <a
              key={i}
              href={`#citation-${idx}`}
              className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 mx-0.5 align-baseline text-[10px] font-semibold rounded bg-primary/15 text-primary hover:bg-primary/25 no-underline"
              title={`Source ${idx}`}
            >
              {idx}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

function CitationList({ citations, expanded, onToggle }) {
  return (
    <div className="mt-2 rounded-lg border border-card-border bg-card/60 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors"
      >
        <span className="inline-flex items-center gap-1.5">
          <FiBookOpen className="w-3.5 h-3.5" />
          {citations.length} source{citations.length === 1 ? "" : "s"}
        </span>
        {expanded ? (
          <FiChevronUp className="w-4 h-4" />
        ) : (
          <FiChevronDown className="w-4 h-4" />
        )}
      </button>

      {expanded && (
        <ol className="px-3 pb-3 pt-1 space-y-2">
          {citations.map((c) => (
            <li
              key={`${c.index}-${c.chunkId || c.sourceId}`}
              id={`citation-${c.index}`}
              className="text-xs text-text-secondary border-l-2 border-primary/40 pl-3 py-1"
            >
              <CitationHeader citation={c} />
              {c.excerpt && (
                <p className="mt-1 text-text-muted leading-relaxed line-clamp-3">{c.excerpt}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CitationHeader({ citation }) {
  const isCaseLaw = citation.sourceType === "CASE_LAW";
  const headingParts = isCaseLaw
    ? [citation.court, citation.year, citation.caseReference].filter(Boolean)
    : [citation.title, citation.caseRef ? `(${citation.caseRef})` : ""].filter(Boolean);

  const heading = headingParts.join(" · ") || (isCaseLaw ? "Case law" : "Document");
  const Icon = isCaseLaw ? FiBookOpen : FiFileText;

  return (
    <div className="flex items-start gap-1.5 flex-wrap">
      <span className="inline-flex items-center justify-center min-w-[20px] h-[18px] text-[10px] font-semibold rounded bg-primary/15 text-primary">
        {citation.index}
      </span>
      <Icon className="w-3.5 h-3.5 mt-0.5 text-text-muted shrink-0" />
      <span className="font-medium text-text-primary break-words">{heading}</span>
      {isCaseLaw && citation.title && (
        <span className="text-text-muted break-words">— {citation.title}</span>
      )}
      {isCaseLaw && citation.sourceUrl && (
        <a
          href={citation.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-primary hover:underline"
        >
          source <FiExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
