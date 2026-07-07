import { Avatar } from "../ui";
import { timeAgo } from "../../utils/timeAgo";

function displayName(user, fallback = "User") {
  if (!user) return fallback;
  if (typeof user === "string") return user.split("@")[0] || fallback;
  return user.fullName || user.email?.split("@")[0] || fallback;
}

export default function SessionChatMessage({ message, isOwn, senderUser, senderLabel }) {
  const name = displayName(senderUser, senderLabel);

  if (isOwn) {
    return (
      <div className="flex justify-end gap-2.5 group">
        <div className="flex flex-col items-end max-w-[min(85%,28rem)] min-w-0">
          <div className="rounded-2xl rounded-br-md bg-primary text-primary-text px-4 py-2.5 shadow-sm">
            <p className="m-0 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.text}
            </p>
          </div>
          <span className="mt-1 px-1 text-[11px] text-text-muted tabular-nums">
            {timeAgo(message.createdAt)}
          </span>
        </div>
        <Avatar user={senderUser} name={name} size="sm" showBorder className="shrink-0 mt-0.5" />
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 group">
      <Avatar user={senderUser} name={name} size="sm" showBorder className="shrink-0 mt-0.5" />
      <div className="flex flex-col items-start max-w-[min(85%,28rem)] min-w-0">
        <div className="rounded-2xl rounded-tl-md border border-card-border bg-background px-4 py-2.5 shadow-sm">
          <p className="m-0 text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words">
            {message.text}
          </p>
        </div>
        <span className="mt-1 px-1 text-[11px] text-text-muted tabular-nums">
          {timeAgo(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
