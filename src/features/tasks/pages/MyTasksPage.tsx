import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";

import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Button from "../../../components/ui/Button";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import Loader from "../../../components/ui/Loader";
import TaskDetailsModal from "../components/TaskDetailsModal";

import {
  getMyTasks,
  updateTaskStatus,
  type MyTaskItem,
  type TaskStatus,
} from "../services/taskService";
import { getSession } from "../../auth/services/auth";

import { formatDate } from "../../../utils/date";

const columns: Array<{ key: TaskStatus; label: string }> = [
  { key: "Pending", label: "Pending" },
  { key: "In Progress", label: "In Progress" },
  { key: "In Review", label: "In Review" },
  { key: "Completed", label: "Completed" },
];

function isOverdue(t: MyTaskItem) {
  if (!t.dueDate) return false;
  if (t.status === "Completed") return false;

  const d = new Date(t.dueDate);
  const now = new Date();

  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return d < now;
}

function priorityBadge(priority: MyTaskItem["priority"]) {
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

export default function MyTasksPage() {
  const { user } = getSession();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MyTaskItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<MyTaskItem | null>(null);

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { control, setValue } = useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMyTasks();
      setItems(res.items || []);

      res.items?.forEach((t) => {
        setValue(`status_${t._id}`, t.status);
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load tasks";
      setErrorMsg(msg);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, MyTaskItem[]> = {
      Pending: [],
      "In Progress": [],
      "In Review": [],
      Completed: [],
    };

    items.forEach((t) => g[t.status]?.push(t));

    return g;
  }, [items]);

  const changeStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateTaskStatus(taskId, status);
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update status";
      setErrorMsg(msg);
      setErrorOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">My Tasks</h2>
          <p className="text-sm text-slate-500">
            Tasks assigned to you across projects
          </p>
        </div>

        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <Loader
          variant="block"
          size="md"
          label="Loading tasks..."
          className="mb-3"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((col) => (
            <div
              key={col.key}
              className="rounded-2xl border border-slate-200 bg-slate-50"
            >
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">
                    {col.label}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {grouped[col.key].length}
                  </span>
                </div>
              </div>

              <div className="min-h-[120px] space-y-3 p-3">
                {grouped[col.key].length === 0 ? (
                  <div className="text-xs text-slate-500">No tasks</div>
                ) : (
                  grouped[col.key].map((t) => {
                    const overdue = isOverdue(t);

                    return (
                      <div
                        key={t._id}
                        className={`space-y-3 rounded-xl border bg-white p-3 shadow-sm ${
                          overdue ? "border-red-300" : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                              {t.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {t.projectId?.name ?? "Project"}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-medium ${priorityBadge(
                              t.priority,
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                          <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-1 font-medium text-teal-700">
                            Logged: {t.workLogSummary?.totalTimeDisplay ?? "0h 0m"}
                          </span>

                          {t.dueDate ? (
                            <span
                              className={`rounded-full border px-2 py-1 ${
                                overdue
                                  ? "border-red-200 bg-red-50 text-red-700"
                                  : "border-slate-200 bg-slate-50"
                              }`}
                            >
                              Due: {formatDate(t.dueDate)}
                            </span>
                          ) : null}

                          {typeof t.estimatedHours === "number" ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                              Est: {t.estimatedHours}h
                            </span>
                          ) : null}

                          {overdue ? (
                            <span className="rounded-full bg-red-100 px-2 py-1 font-medium text-red-700">
                              Overdue
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTask(t)}
                          >
                            View
                          </Button>
                        </div>

                        <Controller
                          control={control}
                          name={`status_${t._id}`}
                          defaultValue={t.status}
                          render={({ field }) => (
                            <SelectDropdown
                              value={field.value}
                              onChange={(v) => {
                                changeStatus(t._id, v as TaskStatus);
                              }}
                              options={[
                                { label: "Pending", value: "Pending" },
                                {
                                  label: "In Progress",
                                  value: "In Progress",
                                },
                                { label: "In Review", value: "In Review" },
                                {
                                  label: "Completed",
                                  value: "Completed",
                                  disabled: true,
                                },
                              ]}
                            />
                          )}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskDetailsModal
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        viewMode="worklog"
        canAddWorkLog
        currentUserId={user?.id}
        onWorkLogChanged={load}
        task={
          selectedTask
            ? {
                taskId: selectedTask._id,
                projectName: selectedTask.projectId?.name ?? "Project",
                title: selectedTask.title,
                description: selectedTask.description,
                status: selectedTask.status,
                priority: selectedTask.priority,
                dueDate: selectedTask.dueDate,
                estimatedHours: selectedTask.estimatedHours,
                createdAt: selectedTask.createdAt,
                updatedAt: selectedTask.updatedAt,
                totalTimeDisplay: selectedTask.workLogSummary?.totalTimeDisplay,
              }
            : null
        }
      />

      <ConfirmDialog
        open={errorOpen}
        title="Error"
        message={errorMsg}
        onConfirm={() => setErrorOpen(false)}
        onCancel={() => setErrorOpen(false)}
      />
    </div>
  );
}
