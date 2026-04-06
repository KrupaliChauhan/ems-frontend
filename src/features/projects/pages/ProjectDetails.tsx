import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { getProjectById, type ProjectItem } from "../services/projectService";
import {
  createTask,
  deleteTask,
  getTasksByProject,
  updateTask,
  updateTaskStatus,
  type TaskItem,
  type TaskStatus,
  type TaskPriority,
} from "../../tasks/services/taskService";
import { formatDate } from "../../../utils/date";
import TaskBoard from "../tasks/TaskBoard";
import TaskFormModal from "../tasks/TaskFormModal";
import Loader from "../../../components/ui/Loader";
import { getSession, hasAccess } from "../../auth/services/auth";
import TaskDetailsModal from "../../tasks/components/TaskDetailsModal";

type TabKey = "overview" | "tasks" | "team";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = getSession();

  const role = user?.role ?? "employee";
  const isEmployee = role === "employee";

  const [tab, setTab] = useState<TabKey>("tasks");

  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<ProjectItem | null>(null);

  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [summary, setSummary] = useState({
    totalTasks: 0,
    completedTasks: 0,
    progress: 0,
  });

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<"add" | "edit">("add");
  const [taskEditing, setTaskEditing] = useState<TaskItem | null>(null);
  const [taskViewing, setTaskViewing] = useState<TaskItem | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TaskItem | null>(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const members = useMemo(() => project?.employees ?? [], [project]);
  const canManage = useMemo(() => {
    if (!hasAccess(role, "projectManage")) {
      return false;
    }

    if (role === "teamLeader") {
      return String(project?.createdBy?._id ?? "") === String(user?.id ?? "");
    }

    return true;
  }, [project?.createdBy?._id, role, user?.id]);

  const loadProject = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const p = await getProjectById(projectId);
      setProject(p);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load project";
      setErrorMsg(msg);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!projectId) return;
    setTasksLoading(true);
    try {
      const res = await getTasksByProject(projectId);
      setTasks(res.items || []);
      setSummary(
        res.summary || { totalTasks: 0, completedTasks: 0, progress: 0 },
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load tasks";
      setErrorMsg(msg);
      setErrorOpen(true);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const openNewTask = () => {
    setTaskModalMode("add");
    setTaskEditing(null);
    setTaskModalOpen(true);
  };

  const openEditTask = (t: TaskItem) => {
    setTaskModalMode("edit");
    setTaskEditing(t);
    setTaskModalOpen(true);
  };

  const openViewTask = (t: TaskItem) => {
    setTaskViewing(t);
  };

  const requestDelete = (t: TaskItem) => {
    setToDelete(t);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteTask(toDelete._id);
      setDeleteOpen(false);
      setToDelete(null);
      setSuccessMsg("Task deleted successfully.");
      setSuccessOpen(true);
      loadTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete task";
      setErrorMsg(msg);
      setErrorOpen(true);
    }
  };

  const handleSaveTask = async (payload: {
    title: string;
    description: string;
    assignedTo: string;
    priority: TaskPriority;
    dueDate: string | null;
    estimatedHours: number | null;
  }) => {
    if (!projectId) return;

    if (taskModalMode === "add") {
      await createTask({
        projectId,
        title: payload.title,
        description: payload.description,
        assignedTo: payload.assignedTo,
        priority: payload.priority,
        ...(payload.dueDate ? { dueDate: payload.dueDate } : {}),
        ...(payload.estimatedHours !== null &&
        payload.estimatedHours !== undefined
          ? { estimatedHours: payload.estimatedHours }
          : {}),
      });
      await loadTasks();
      return;
    }

    if (!taskEditing) return;
    await updateTask(taskEditing._id, {
      title: payload.title,
      description: payload.description,
      assignedTo: payload.assignedTo,
      priority: payload.priority,
      dueDate: payload.dueDate,
      estimatedHours: payload.estimatedHours,
    });
    await loadTasks();
  };

  const handleChangeStatus = async (t: TaskItem, status: TaskStatus) => {
    try {
      await updateTaskStatus(t._id, status);
      await loadTasks();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update status";
      setErrorMsg(msg);
      setErrorOpen(true);
    }
  };

  if (!projectId) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-600">
        Invalid project.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/projects")}
            >
              Back
            </Button>
            <h2 className="text-2xl font-semibold text-slate-800">
              Project Details
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage tasks inside this project
          </p>
        </div>

        {tab === "tasks" && canManage ? (
          <Button variant="primary" onClick={openNewTask}>
            + New Task
          </Button>
        ) : null}
      </div>

      {/* Project Card */}
      {loading ? (
        <Loader
          variant="block"
          size="md"
          label="Loading projects..."
          className="mb-3"
        />
      ) : !project ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-600">
          Project not found.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {project.name}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {project.description}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                <span
                  className={`px-3 py-1 rounded-full font-medium capitalize ${
                    project.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {project.status}
                </span>
                <span className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  Start: {formatDate(project.startDate)}
                </span>
                <span className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  Time limit: {project.timeLimit}
                </span>
                <span className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  Team Leader: {project.createdBy?.name ?? "-"}
                </span>
                <span className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  Members: {project.employees?.length ?? 0}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="min-w-[260px]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700">Progress</p>
                <p className="text-sm font-semibold text-slate-900">
                  {summary.progress}%
                </p>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-slate-900"
                  style={{
                    width: `${Math.min(100, Math.max(0, summary.progress))}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {summary.completedTasks}/{summary.totalTasks} tasks completed
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => setTab("overview")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                tab === "overview"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setTab("tasks")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                tab === "tasks"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setTab("team")}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
                tab === "team"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Team
            </button>
          </div>
        </div>
      )}

      {/* Tab Contents */}
      {project ? (
        <>
          {tab === "overview" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
              <h4 className="text-lg font-semibold text-slate-900">Overview</h4>
              <p className="text-sm text-slate-500 mt-1">
                Quick summary of this project and its members.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Description</p>
                  <p className="text-sm text-slate-800 mt-1">
                    {project.description || "-"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Task Summary</p>
                  <p className="text-sm text-slate-800 mt-1">
                    Total: {summary.totalTasks} | Completed:{" "}
                    {summary.completedTasks}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Team Leader</p>
                  <p className="text-sm text-slate-800 mt-1">
                    {project.createdBy?.name ?? "-"}
                    {project.createdBy?.email ? ` (${project.createdBy.email})` : ""}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "tasks" ? (
            tasksLoading ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-600">
                Loading tasks...
              </div>
            ) : (
              <TaskBoard
                tasks={tasks}
                canManage={canManage}
                isEmployee={isEmployee}
                currentUserId={user?.id}
                onView={openViewTask}
                onEdit={openEditTask}
                onDelete={requestDelete}
                onChangeStatus={handleChangeStatus}
              />
            )
          ) : null}

          {tab === "team" ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h4 className="text-lg font-semibold text-slate-900">Team</h4>
              <p className="text-sm text-slate-500 mt-1">
                Project members list
              </p>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                {project.employees?.length ? (
                  <ul className="space-y-2 text-sm">
                    {project.employees.map((m) => (
                      <li
                        key={m._id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
                      >
                        <span className="font-medium text-slate-800">
                          {m.name}
                        </span>
                        <span className="text-slate-500">{m.email}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No members</p>
                )}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {/* Task Modal */}
      {project ? (
        <TaskDetailsModal
          open={Boolean(taskViewing)}
          onClose={() => setTaskViewing(null)}
          viewMode="normal"
          canAddWorkLog={false}
          currentUserId={user?.id}
          onWorkLogChanged={loadTasks}
          task={
            taskViewing
              ? {
                  taskId: taskViewing._id,
                  projectName: project.name,
                  title: taskViewing.title,
                  description: taskViewing.description,
                  status: taskViewing.status,
                  priority: taskViewing.priority,
                  dueDate: taskViewing.dueDate,
                  estimatedHours: taskViewing.estimatedHours,
                  createdAt: taskViewing.createdAt,
                  updatedAt: taskViewing.updatedAt,
                  totalTimeDisplay: taskViewing.workLogSummary?.totalTimeDisplay,
                }
              : null
          }
        />
      ) : null}

      {project ? (
        <TaskFormModal
          open={taskModalOpen}
          mode={taskModalMode}
          members={members}
          initial={taskEditing}
          onClose={() => setTaskModalOpen(false)}
          onSubmit={handleSaveTask}
        />
      ) : null}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task? (Soft delete)"
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setToDelete(null);
        }}
      />

      {/* Success */}
      <ConfirmDialog
        open={successOpen}
        title="Success"
        message={successMsg}
        mode="Success"
        onConfirm={() => setSuccessOpen(false)}
        onCancel={() => setSuccessOpen(false)}
      />

      {/* Error */}
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
