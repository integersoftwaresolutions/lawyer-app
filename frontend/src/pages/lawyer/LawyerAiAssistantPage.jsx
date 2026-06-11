import { Badge } from "../../components/ui";
import ChatPanel from "../../components/ai/ChatPanel";
import { FiCpu } from "react-icons/fi";

export default function LawyerAiAssistantPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <FiCpu className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-text-primary leading-tight truncate">
              AI Legal Assistant
            </h1>
            <p className="text-[11px] text-text-muted truncate hidden sm:block">
              Research mode · verify before use
            </p>
          </div>
        </div>
        <Badge variant="primary" size="sm" className="shrink-0 hidden sm:inline-flex">
          Research
        </Badge>
      </div>

      <ChatPanel mode="research" className="flex-1 min-h-0" />
    </div>
  );
}
