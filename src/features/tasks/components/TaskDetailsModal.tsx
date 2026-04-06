import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { InputField } from "../../../components/ui/InputField";
import Loader from "../../../components/ui/Loader";
import Modal from "../../../components/ui/Modal";
import {
  createTaskWorkLog,
  deleteTaskWorkLog,
  getTaskWorkLogs,
  updateTaskWorkLog,
  type TaskPriority,
  type TaskStatus,
  type TaskWorkLogItem
} from "../services/taskService";
import { formatDate, formatDateTime } from "../../../utils/date";

type TaskDetailsValue = {
  taskId: string;
  projectName: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  estimatedHours?: number | null;
  createdAt?: string;
  updatedAt?: string;
  totalTimeDisplay?: string;
};

type Props = {
  open: boolean;
  task: TaskDetailsValue | null;
  onClose: () => void;
  viewMode?: "normal" | "worklog";
  canAddWorkLog: boolean;
  currentUserId?: string | null;
  onWorkLogChanged?: () => void | Promise<void>;
};

type GroupedLogs = {
  description: string;
  totalMinutes: number;
  totalTimeDisplay: string;
  latestActivityAt?: string | null;
  items: TaskWorkLogItem[];
};

function priorityBadge(priority: TaskPriority) {
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

function TaskDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(15,118,110,0.12)] bg-[rgba(248,252,251,0.88)] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function sanitizeNumberInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function isLongComment(value: string) {
  return value.trim().length > 140;
}

function isOwnWorkLog(log: TaskWorkLogItem, currentUserId?: string | null) {
  return !!currentUserId && String(log.user?.id || "") === String(currentUserId);
}

function buildGroupedLogs(logs: TaskWorkLogItem[]): GroupedLogs[] {
  const groups: GroupedLogs[] = [];

  logs.forEach((log) => {
    const description = log.descriptionSnapshot?.trim() || "No description added for this task.";
    const existing = groups.find((item) => item.description === description);

    if (existing) {
      existing.items.push(log);
      existing.totalMinutes += log.totalMinutes;
      existing.totalTimeDisplay = `${Math.floor(existing.totalMinutes / 60)}h ${existing.totalMinutes % 60}m`;
      if (
        log.createdAt &&
        (!existing.latestActivityAt ||
          new Date(log.createdAt).getTime() > new Date(existing.latestActivityAt).getTime())
      ) {
        existing.latestActivityAt = log.createdAt;
      }
      return;
    }

    groups.push({
      description,
      totalMinutes: log.totalMinutes,
      totalTimeDisplay: log.timeDisplay,
      latestActivityAt: log.createdAt ?? null,
      items: [log]
    });
  });

  return groups;
}

export default function TaskDetailsModal({
  open,
  task,
  onClose,
  viewMode = "normal",
  canAddWorkLog,
  currentUserId,
  onWorkLogChanged
}: Props) {
  const showWorkLog = viewMode === "worklog";
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<TaskWorkLogItem[]>([]);
  const [totalTimeDisplay, setTotalTimeDisplay] = useState(task?.totalTimeDisplay || "0h 0m");
  const [comment, setComment] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskWorkLogItem | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    if (!showWorkLog || !task?.taskId || !open) return;

    setLoadingLogs(true);
    try {
      const response = await getTaskWorkLogs(task.taskId);
      setLogs(response.items || []);
      setTotalTimeDisplay(response.totalTimeDisplay || "0h 0m");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load work logs");
    } finally {
      setLoadingLogs(false);
    }
  }, [open, showWorkLog, task?.taskId]);

  useEffect(() => {
    if (open && showWorkLog && task?.taskId) {
      loadLogs();
      setTotalTimeDisplay(task.totalTimeDisplay || "0h 0m");
    } else {
      setLogs([]);
      setTotalTimeDisplay("0h 0m");
      setComment("");
      setHours("");
      setMinutes("");
      setEditingLogId(null);
      setDeleteTarget(null);
      setExpandedLogs({});
      setError("");
    }
  }, [open, showWorkLog, task?.taskId, task?.totalTimeDisplay, loadLogs]);

  const workLogCountLabel = useMemo(
    () => `${logs.length} entr${logs.length === 1 ? "y" : "ies"}`,
    [logs.length]
  );
  const groupedLogs = useMemo(() => buildGroupedLogs(logs), [logs]);
  const canModifyWorkLogs = canAddWorkLog && task?.status !== "Completed";

  const resetForm = () => {
    setComment("");
    setHours("");
    setMinutes("");
    setEditingLogId(null);
  };

  const toggleExpandedLog = (logId: string) => {
    setExpandedLogs((prev) => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };

  const handleSubmitWorkLog = async () => {
    if (!task?.taskId) return;

    const normalizedComment = comment.trim();
    const normalizedHours = Number(hours || "");
    const normalizedMinutes = Number(minutes || "0");

    if (!normalizedComment) {
      setError("Comment is required");
      return;
    }

    if (!hours.trim() || normalizedHours <= 0) {
      setError("Hours is required and must be greater than 0");
      return;
    }

    if (normalizedMinutes < 0 || normalizedMinutes > 59) {
      setError("Minutes must be between 0 and 59");
      return;
    }

    setSaving(true);
    try {
      const response = editingLogId
        ? await updateTaskWorkLog(task.taskId, editingLogId, {
            comment: normalizedComment,
            hours: normalizedHours,
            minutes: normalizedMinutes
          })
        : await createTaskWorkLog(task.taskId, {
            comment: normalizedComment,
            hours: normalizedHours,
            minutes: normalizedMinutes
          });

      setLogs(response.items || []);
      setTotalTimeDisplay(response.totalTimeDisplay || "0h 0m");
      resetForm();
      setError("");
      await onWorkLogChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save work log");
    } finally {
      setSaving(false);
    }
  };

  const startEditLog = (log: TaskWorkLogItem) => {
    setEditingLogId(log.id);
    setComment(log.comment);
    setHours(String(log.hours));
    setMinutes(String(log.minutes));
    setError("");
  };

  const confirmDeleteLog = async () => {
    if (!task?.taskId || !deleteTarget) return;

    setSaving(true);
    try {
      const response = await deleteTaskWorkLog(task.taskId, deleteTarget.id);
      setLogs(response.items || []);
      setTotalTimeDisplay(response.totalTimeDisplay || "0h 0m");
      if (editingLogId === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
      setError("");
      await onWorkLogChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete work log");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Task Details"
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {task ? (
        <div className="space-y-5">
          <div className="rounded-[24px] border border-[rgba(15,118,110,0.12)] bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(245,158,11,0.05))] px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-700">
                  {task.projectName || "Project"}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {task.title}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge(task.priority)}`}>
                  {task.priority}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                  {task.status}
                </span>
                {showWorkLog ? (
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                    Logged: {totalTimeDisplay}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Description
            </p>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
              {task.description?.trim() || "No description added for this task."}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <TaskDetailRow label="Due Date" value={task.dueDate ? formatDate(task.dueDate) : "-"} />
            <TaskDetailRow
              label="Estimated Hours"
              value={typeof task.estimatedHours === "number" ? `${task.estimatedHours} hours` : "-"}
            />
            <TaskDetailRow label="Created At" value={formatDateTime(task.createdAt)} />
            <TaskDetailRow label="Updated At" value={formatDateTime(task.updatedAt)} />
          </div>

          {showWorkLog ? (
            <section className="rounded-[24px] border border-[rgba(15,118,110,0.12)] bg-[rgba(248,252,251,0.92)] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Work Log
                  </p>
                  <h4 className="mt-2 text-lg font-semibold text-slate-900">
                    Total Time Spent: {totalTimeDisplay}
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">{workLogCountLabel}</p>
                </div>
              </div>

              {canModifyWorkLogs ? (
                <div className="mt-5 rounded-2xl border border-[rgba(15,118,110,0.12)] bg-white px-4 py-4">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-900">
                        Comment <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="w-full rounded-2xl border border-[rgba(123,97,63,0.15)] bg-[rgba(255,253,248,0.92)] px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                        placeholder="What work did you complete?"
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-[120px,120px,auto] md:items-end">
                      <InputField
                        label="Hours *"
                        value={hours}
                        onChange={(value) => setHours(sanitizeNumberInput(value))}
                        inputMode="numeric"
                        placeholder="0"
                        maxLength={3}
                      />

                      <InputField
                        label="Minutes"
                        value={minutes}
                        onChange={(value) => setMinutes(sanitizeNumberInput(value))}
                        inputMode="numeric"
                        placeholder="0"
                        maxLength={2}
                      />

                      <div className="flex flex-col gap-2 md:min-w-[140px]">
                        <Button
                          onClick={handleSubmitWorkLog}
                          disabled={saving || !hours.trim() || Number(hours) <= 0}
                        >
                          {saving ? "Saving..." : editingLogId ? "Update Entry" : "Add Entry"}
                        </Button>
                        {editingLogId ? (
                          <Button variant="outline" onClick={resetForm} disabled={saving}>
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
                </div>
              ) : null}

              <div className="mt-5">
                {loadingLogs ? (
                  <Loader variant="inline" label="Loading work logs..." />
                ) : logs.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                    No work logs added yet.
                  </div>
                ) : (
                  <div className="max-h-[360px] space-y-5 overflow-y-auto pr-1">
                    {groupedLogs.map((group) => (
                      <div key={group.description} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-6 text-slate-900">{group.description}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Last updated {formatDateTime(group.latestActivityAt)}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-teal-700">{group.totalTimeDisplay}</p>
                        </div>

                        <div className="mt-3 space-y-2">
                          {group.items.map((log) => (
                            <div
                              key={log.id}
                              className="rounded-xl border border-[rgba(15,118,110,0.08)] bg-[rgba(248,252,251,0.62)] px-3 py-2.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`text-sm leading-6 text-slate-700 ${
                                      expandedLogs[log.id] ? "" : "line-clamp-3"
                                    }`}
                                    title={log.comment}
                                  >
                                    {log.comment}
                                  </p>
                                  {isLongComment(log.comment) ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandedLog(log.id)}
                                      className="mt-1 text-xs font-medium text-teal-700 transition hover:text-teal-800"
                                    >
                                      {expandedLogs[log.id] ? "Show less" : "View more"}
                                    </button>
                                  ) : null}
                                </div>

                                {canModifyWorkLogs && isOwnWorkLog(log, currentUserId) ? (
                                  <div className="flex shrink-0 items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => startEditLog(log)}>
                                      Edit
                                    </Button>
                                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(log)}>
                                      Delete
                                    </Button>
                                  </div>
                                ) : null}
                              </div>

                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                <span className="font-semibold text-teal-700">{log.timeDisplay}</span>
                                <span>{formatDateTime(log.createdAt)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {canAddWorkLog && task?.status === "Completed" ? (
                <p className="mt-3 text-sm text-slate-500">
                  Work logs are visible, but completed tasks cannot be edited or deleted.
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Work Log"
        message="Are you sure you want to delete this work log entry?"
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDeleteLog}
        onCancel={() => setDeleteTarget(null)}
      />
    </Modal>
  );
}
