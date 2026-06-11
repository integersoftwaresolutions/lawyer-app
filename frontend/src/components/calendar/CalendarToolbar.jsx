import { FiChevronLeft, FiChevronRight, FiPlus } from "react-icons/fi";
import { Button, FilterTabs, IconButton } from "../ui";
import { CALENDAR_VIEWS } from "../../constants/calendar.constants";
import {
  formatMonthYear,
  formatWeekRange,
  formatDayTitle
} from "../../utils/calendar/dateUtils";

const VIEW_TABS = [
  { value: CALENDAR_VIEWS.DAY, label: "Day" },
  { value: CALENDAR_VIEWS.WEEK, label: "Week" },
  { value: CALENDAR_VIEWS.MONTH, label: "Month" }
];

export default function CalendarToolbar({
  view,
  onViewChange,
  anchorDate,
  onPrev,
  onNext,
  onToday,
  onCreate,
  allowCreate = true,
  timezone
}) {
  const title =
    view === CALENDAR_VIEWS.DAY
      ? formatDayTitle(anchorDate, timezone)
      : view === CALENDAR_VIEWS.WEEK
        ? formatWeekRange(anchorDate, timezone)
        : formatMonthYear(anchorDate, timezone);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-0.5 shrink-0">
          <IconButton
            icon={FiChevronLeft}
            label="Previous"
            variant="ghost"
            size="sm"
            onClick={onPrev}
          />
          <IconButton
            icon={FiChevronRight}
            label="Next"
            variant="ghost"
            size="sm"
            onClick={onNext}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={onToday} className="shrink-0">
          Today
        </Button>
        <h2 className="text-sm sm:text-base font-semibold text-text-primary truncate ml-1">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <FilterTabs options={VIEW_TABS} value={view} onChange={onViewChange} />
        {allowCreate && (
          <Button icon={FiPlus} size="sm" onClick={onCreate}>
            New event
          </Button>
        )}
      </div>
    </div>
  );
}
