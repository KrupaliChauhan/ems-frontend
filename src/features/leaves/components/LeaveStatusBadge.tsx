import type { LeaveRequestItem } from "../services/leaveService";

type Props = {
  status: LeaveRequestItem["status"];
};

const classes: Record<LeaveRequestItem["status"], string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  "Level 1 Approved": "bg-sky-50 text-sky-700 border-sky-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  Cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function LeaveStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>
      {status}
    </span>
  );
}
