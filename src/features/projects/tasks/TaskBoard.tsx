import type { TaskItem, TaskStatus } from "../../tasks/services/taskService";
import TaskCard from "./TaskCard";

type Props = {
  tasks: TaskItem[];
  canManage: boolean;
  isEmployee: boolean;
  currentUserId?: string | null;
  onView: (task: TaskItem) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onChangeStatus: (task: TaskItem, status: TaskStatus) => void;
};

const columns: Array<{ key: TaskStatus; label: string }> = [
  { key: "Pending", label: "Pending" },
  { key: "In Progress", label: "In Progress" },
  { key: "In Review", label: "In Review" },
  { key: "Completed", label: "Completed" },
];

export default function TaskBoard({
  tasks,
  canManage,
  isEmployee,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  onChangeStatus,
}: Props) {
  const grouped: Record<TaskStatus, TaskItem[]> = {
    Pending: [],
    "In Progress": [],
    "In Review": [],
    Completed: [],
  };

  (tasks || []).forEach((t) => {
    grouped[t.status]?.push(t);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col) => (
        <div
          key={col.key}
          className="rounded-2xl border border-slate-200 bg-slate-50"
        >
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-800">
                {col.label}
              </h4>
              <span className="text-xs text-slate-500">
                {grouped[col.key].length}
              </span>
            </div>
          </div>
          <div className="p-3 space-y-3 min-h-[120px]">
            {grouped[col.key].length === 0 ? (
              <div className="text-xs text-slate-500">No tasks</div>
            ) : (
              grouped[col.key].map((t) => (
                <TaskCard
                  key={t._id}
                  task={t}
                  canManage={canManage}
                  isEmployee={isEmployee}
                  currentUserId={currentUserId}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onChangeStatus={onChangeStatus}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
