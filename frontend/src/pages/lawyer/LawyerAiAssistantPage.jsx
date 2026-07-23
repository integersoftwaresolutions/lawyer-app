import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge, PageHeader } from "../../components/ui";
import ChatPanel from "../../components/ai/ChatPanel";
import { FiCpu } from "react-icons/fi";

export default function LawyerAiAssistantPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [routedState, setRoutedState] = useState(() => location.state || null);

  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialSessionId = routedState?.sessionId || null;
  const initialMessage = routedState?.initialMessage || null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <PageHeader
        size="compact"
        icon={FiCpu}
        title="AI Legal Assistant"
        subtitle="Research mode · verify before use"
        actions={
          <Badge variant="primary" size="sm" className="shrink-0 hidden sm:inline-flex">
            Research
          </Badge>
        }
        className="shrink-0 mb-2 sm:mb-3"
      />

      <ChatPanel
        mode="research"
        className="flex-1 min-h-0"
        initialSessionId={initialSessionId}
        initialMessage={initialMessage}
      />
    </div>
  );
}
