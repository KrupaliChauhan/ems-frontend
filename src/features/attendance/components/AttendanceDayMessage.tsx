import type { AttendanceDayUiStatus } from "../services/attendanceService";

type VisibleAttendanceDayUiStatus = Exclude<
  AttendanceDayUiStatus,
  "PRESENT" | "IN_PROGRESS" | "NOT_STARTED"
>;

const toneMap: Record<VisibleAttendanceDayUiStatus, string> = {
  HOLIDAY: "border-violet-200 bg-violet-50 text-violet-700",
  LEAVE: "border-teal-200 bg-teal-50 text-teal-700",
  WEEK_OFF: "border-slate-200 bg-slate-100 text-slate-700",
  MISSED_PUNCH: "border-orange-200 bg-orange-50 text-orange-700",
  LATE: "border-amber-200 bg-amber-50 text-amber-700",
  HALF_DAY: "border-sky-200 bg-sky-50 text-sky-700",
  ABSENT: "border-rose-200 bg-rose-50 text-rose-700"
};

const labelMap: Record<VisibleAttendanceDayUiStatus, string> = {
  HOLIDAY: "Holiday",
  LEAVE: "Approved Leave",
  WEEK_OFF: "Weekly Off",
  MISSED_PUNCH: "Missed Punch",
  LATE: "You are late",
  HALF_DAY: "Half Day",
  ABSENT: "Marked as Absent"
};

type Props = {
  status?: AttendanceDayUiStatus | null;
  compact?: boolean;
};

export default function AttendanceDayMessage({ status = "PRESENT", compact = false }: Props) {
  if (!status || status === "PRESENT" || status === "IN_PROGRESS" || status === "NOT_STARTED") {
    return null;
  }

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneMap[status]} ${
        compact ? "" : "shadow-sm"
      }`}
    >
      {labelMap[status]}
    </span>
  );
}
