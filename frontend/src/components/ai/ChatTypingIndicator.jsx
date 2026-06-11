export default function ChatTypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-2" aria-label="Assistant is typing">
      <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]" />
      <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]" />
      <span className="w-2 h-2 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]" />
    </div>
  );
}
