import { FiCalendar } from "react-icons/fi";
import { CalendarShell } from "../../components/calendar";
import { plannerApi } from "../../services/planner.api";
import { DEFAULT_TIMEZONE } from "../../constants/calendar.constants";

export default function LawyerPlannerPage() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-2 mb-2 sm:mb-3">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
          <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-text-primary leading-tight truncate">
            Smart Planner
          </h1>
          <p className="text-[11px] text-text-muted truncate hidden sm:block">
            Hearings, meetings & deadlines · {DEFAULT_TIMEZONE.replace("_", " ")}
          </p>
        </div>
      </div>

      <CalendarShell
        api={plannerApi}
        timezone={DEFAULT_TIMEZONE}
        allowCreate
        className="flex-1 min-h-0"
      />
    </div>
  );
}
