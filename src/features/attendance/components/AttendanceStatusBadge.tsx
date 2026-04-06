import type { AttendanceStatus } from "../services/attendanceService";

const toneMap: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700",
  HALF_DAY: "bg-amber-50 text-amber-700",
  ABSENT: "bg-rose-50 text-rose-700",
  LEAVE: "bg-sky-50 text-sky-700",
  HOLIDAY: "bg-violet-50 text-violet-700",
  WEEK_OFF: "bg-slate-100 text-slate-700",
  MISSED_PUNCH: "bg-orange-50 text-orange-700",
  HALF_DAY_LEAVE_PRESENT: "bg-teal-50 text-teal-700"
};

const labelMap: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  HALF_DAY: "Half Day",
  ABSENT: "Absent",
  LEAVE: "Leave",
  HOLIDAY: "Holiday",
  WEEK_OFF: "Week Off",
  MISSED_PUNCH: "Missed Punch",
  HALF_DAY_LEAVE_PRESENT: "Half Day Leave + Present"
};

type Props = {
  status: AttendanceStatus;
};

export default function AttendanceStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneMap[status]}`}>
      {labelMap[status]}
    </span>
  );
}
