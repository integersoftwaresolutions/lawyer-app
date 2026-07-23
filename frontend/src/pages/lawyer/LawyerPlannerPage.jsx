import { FiCalendar } from "react-icons/fi";
import { CalendarShell } from "../../components/calendar";
import { PageHeader } from "../../components/ui";
import { plannerApi } from "../../services/planner.api";
import { DEFAULT_TIMEZONE } from "../../constants/calendar.constants";

export default function LawyerPlannerPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <PageHeader
        size="compact"
        icon={FiCalendar}
        title="Smart Planner"
        subtitle={`Hearings, meetings & deadlines · ${DEFAULT_TIMEZONE.replace("_", " ")}`}
        className="shrink-0 mb-2 sm:mb-3"
      />

      <CalendarShell
        api={plannerApi}
        timezone={DEFAULT_TIMEZONE}
        allowCreate
        className="flex-1 min-h-0"
      />
    </div>
  );
}
