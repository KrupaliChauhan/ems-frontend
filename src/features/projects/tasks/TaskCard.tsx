import { useEffect, useRef, useState } from "react";
import type { TaskItem, TaskStatus } from "../../tasks/services/taskService";
import { formatDate } from "../../../utils/date";

type Props = {
  task: TaskItem;
  canManage: boolean;
  isEmployee: boolean;
  currentUserId?: string | null;
  onView: (task: TaskItem) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onChangeStatus: (task: TaskItem, status: TaskStatus) => void;
};

const statusOptions: TaskStatus[] = [
  "Pending",
  "In Progress",
  "In Review",
  "Completed",
];

function isOverdue(task: TaskItem) {
  if (!task.dueDate) return false;
  if (task.status === "Completed") return false;
  const d = new Date(task.dueDate);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return d < now;
}

function priorityBadge(priority: TaskItem["priority"]) {
  switch (priority) {
    case "Low":
      return "bg-slate-100 text-slate-700";
    case "Medium":
      return "bg-blue-100 text-blue-700";
    case "High":
      return "bg-amber-100 text-amber-800";
    case "Critical":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function TaskCard({
  task,
  canManage,
  isEmployee,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  onChangeStatus,
}: Props) {
  const overdue = isOverdue(task);
  const isAssignedToCurrentUser =
    !!currentUserId && String(task.assignedTo?._id ?? "") === String(currentUserId);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  return (
    <div
      className={`rounded-xl border bg-white p-3 shadow-sm space-y-2 ${
        overdue ? "border-red-300" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900 line-clamp-2">
            {task.title}
          </p>
          {task.description ? (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {task.description}
            </p>
          ) : null}
        </div>

        <div className="relative flex items-center gap-2" ref={menuRef}>
          <span
            className={`px-2 py-1 rounded-full text-[11px] font-medium ${priorityBadge(task.priority)}`}
          >
            {task.priority}
          </span>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(123,97,63,0.16)] bg-[rgba(255,253,248,0.92)] text-lg font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
            aria-label="Open task actions"
          >
            &#8942;
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-10 z-20 min-w-[150px] rounded-2xl border border-[rgba(123,97,63,0.14)] bg-white/98 p-2 shadow-[0_20px_36px_rgba(33,29,22,0.18)] backdrop-blur">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onView(task);
                  }}
                  className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                >
                  View
                </button>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(task);
                    }}
                    className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                  >
                    Edit
                  </button>
                ) : null}
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(task);
                    }}
                    className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        {isAssignedToCurrentUser ? (
          <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 font-semibold text-teal-700">
            Assigned to me
          </span>
        ) : null}

        <span className="rounded-full bg-slate-50 border border-slate-200 px-2 py-1">
          {task.assignedTo?.name ?? "-"}
        </span>

        <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 font-medium text-teal-700">
          Logged: {task.workLogSummary?.totalTimeDisplay ?? "0h 0m"}
        </span>

        {task.dueDate ? (
          <span
            className={`rounded-full border px-2 py-1 ${
              overdue
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            Due: {formatDate(task.dueDate)}
          </span>
        ) : null}

        {typeof task.estimatedHours === "number" ? (
          <span className="rounded-full bg-slate-50 border border-slate-200 px-2 py-1">
            Est: {task.estimatedHours}h
          </span>
        ) : null}

        {overdue ? (
          <span className="rounded-full bg-red-100 text-red-700 px-2 py-1 font-medium">
            Overdue
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <select
          value={task.status}
          onChange={(e) => onChangeStatus(task, e.target.value as TaskStatus)}
          className="h-9 min-w-[170px] flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
        >
          {statusOptions.map((s) => (
            <option
              key={s}
              value={s}
              disabled={isEmployee && s === "Completed"}
            >
              {s}
            </option>
          ))}
        </select>
        <div className="w-8" />
      </div>
    </div>
  );
}
