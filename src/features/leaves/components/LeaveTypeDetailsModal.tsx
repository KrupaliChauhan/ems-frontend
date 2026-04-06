import Modal from "../../../components/ui/Modal";
import type { LeaveTypeItem } from "../services/leaveService";

type Props = {
  open: boolean;
  leaveType: LeaveTypeItem | null;
  onClose: () => void;
};

function workflowLabel(leaveType: LeaveTypeItem) {
  if (leaveType.approvalWorkflowType === "single_level") {
    return `Single Level (${leaveType.approvalFlowSteps[0]?.role || "admin"})`;
  }

  return `Multi Level (${leaveType.approvalFlowSteps.length} steps)`;
}

function formatWorkflowRole(role?: string | null) {
  if (!role) return "Not assigned";
  if (role === "teamLeader") return "Team Leader";
  if (role === "superadmin") return "Super Admin";
  return role;
}

export default function LeaveTypeDetailsModal({ open, leaveType, onClose }: Props) {
  return (
    <Modal open={open} title="Leave Type Details" onClose={onClose} size="md">
      {!leaveType ? null : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{leaveType.name}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Code</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{leaveType.code}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">Allocation</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{leaveType.allocationPeriod}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">Allocation Qty</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{leaveType.totalAllocation}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">Workflow</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{workflowLabel(leaveType)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="text-xs uppercase text-slate-500">Status</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{leaveType.status}</p>
            </div>
          </div>

          {leaveType.description ? (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Description</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{leaveType.description}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approval Workflow Steps</p>
            <div className="mt-4 space-y-3">
              {(leaveType.approvalFlowSteps || [])
                .slice()
                .sort((left, right) => left.level - right.level)
                .map((step, index, steps) => (
                  <div key={`${step.level}-${step.role}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                        {step.level}
                      </span>
                      {index < steps.length - 1 ? <span className="mt-2 h-8 w-px bg-slate-200" /> : null}
                    </div>
                    <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">Level {step.level}</p>
                      <p className="mt-1 text-sm text-slate-600">{formatWorkflowRole(step.role)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
