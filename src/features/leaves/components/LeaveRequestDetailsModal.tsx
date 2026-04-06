import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils/date";
import type { LeaveRequestItem } from "../services/leaveService";
import LeaveStatusBadge from "./LeaveStatusBadge";

type Props = {
  open: boolean;
  request: LeaveRequestItem | null;
  onClose: () => void;
};

function getStepStatus(request: LeaveRequestItem, level: number) {
  const step = request.approvalFlow.find((item) => item.level === level);
  switch (step?.status) {
    case "REJECTED":
      return { label: "Rejected", tone: "bg-rose-50 text-rose-700" };
    case "APPROVED":
      return { label: "Approved", tone: "bg-emerald-50 text-emerald-700" };
    case "PENDING":
      return { label: "Pending", tone: "bg-amber-50 text-amber-700" };
    case "CANCELLED":
      return { label: "Stopped", tone: "bg-slate-100 text-slate-600" };
    default:
      return { label: "Waiting", tone: "bg-slate-100 text-slate-600" };
  }
}

export default function LeaveRequestDetailsModal({ open, request, onClose }: Props) {
  return (
    <Modal open={open} title="Leave Request Details" onClose={onClose} size="lg">
      {!request ? null : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Employee</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{request.employee?.name ?? "-"}</p>
              <p className="text-sm text-slate-500">{request.employee?.email ?? "-"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Leave Type</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: request.leaveType.color }} />
                <p className="text-lg font-semibold text-slate-900">{request.leaveType.name}</p>
              </div>
              <p className="text-sm text-slate-500">{request.leaveType.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">From</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(request.fromDate)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">To</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(request.toDate)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">Days</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{request.totalDays}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">Status</p>
              <div className="mt-2">
                <LeaveStatusBadge status={request.status} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approval Flow</p>
              {request.currentApproverRole ? (
                <p className="text-sm font-medium text-slate-600">{request.currentApproverLabel}</p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
                Employee
              </span>
              {request.approvalFlowSteps.map((step) => (
                <div key={`${step.level}-${step.role}`} className="flex items-center gap-2">
                  <span className="text-slate-400">-&gt;</span>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-sm font-medium text-slate-800">Step {step.level}: {step.role}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStepStatus(request, step.level).tone}`}>
                      {getStepStatus(request, step.level).label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reason</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{request.reason}</p>
          </div>

          {request.attachment ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Attachment</p>
              <a
                href={`${import.meta.env.VITE_API_URL}${request.attachment.url}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-sm font-medium text-indigo-600 underline underline-offset-4"
              >
                {request.attachment.originalName}
              </a>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approval Timeline</p>
            <div className="mt-4 space-y-3">
              {request.approvalHistory.length === 0 ? (
                <p className="text-sm text-slate-500">No actions recorded yet.</p>
              ) : (
                request.approvalHistory.map((item, index) => (
                  <div key={`${item.actedAt}-${index}`} className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {item.action} | Level {item.level}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(item.actedAt)}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.by?.name ?? "System"} ({item.role})
                    </p>
                    {item.remarks ? <p className="mt-2 text-sm text-slate-700">{item.remarks}</p> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
