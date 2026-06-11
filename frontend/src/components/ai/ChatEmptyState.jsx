import { FiSearch, FiBookOpen, FiHelpCircle } from "react-icons/fi";

const SUGGESTIONS = [
  { icon: FiSearch, text: "Find case law on bail under CrPC" },
  { icon: FiBookOpen, text: "Explain Section 302 PPC and defences" },
  { icon: FiHelpCircle, text: "Summarise procedure for family court petitions" }
];

export default function ChatEmptyState({ onSuggestion, onNewChat }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] px-4 py-8 text-center">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <FiSearch className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-1">Legal research assistant</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        Ask about Pakistani case law, court procedure, or legal concepts. Conversations are saved
        and encrypted.
      </p>
      <div className="flex flex-col gap-2 w-full max-w-md">
        {SUGGESTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.text}
              type="button"
              onClick={() => onSuggestion?.(item.text)}
              className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border border-card-border bg-card hover:bg-surface-hover hover:border-primary/30 transition-colors text-sm text-text-secondary hover:text-text-primary"
            >
              <Icon className="w-4 h-4 shrink-0 text-primary" />
              <span>{item.text}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onNewChat}
        className="mt-4 text-xs text-text-muted hover:text-primary transition-colors"
      >
        or start a blank conversation
      </button>
    </div>
  );
}
