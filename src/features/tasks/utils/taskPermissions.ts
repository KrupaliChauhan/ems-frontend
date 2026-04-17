import type { TaskStatus } from "../services/taskService";

export type TaskActor = "member" | "teamLeader" | "viewer";

const MEMBER_VISIBLE_STATUSES: TaskStatus[] = ["Pending", "In Progress", "In Review"];
const TEAM_LEADER_VISIBLE_STATUSES: TaskStatus[] = ["In Review", "Completed"];

const MEMBER_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  Pending: ["In Progress"],
  "In Progress": ["In Review"],
  "In Review": ["In Progress"],
  Completed: []
};

const TEAM_LEADER_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  Pending: [],
  "In Progress": [],
  "In Review": ["Completed"],
  Completed: ["In Review"]
};

function getVisibleStatuses(actor: TaskActor) {
  if (actor === "teamLeader") return TEAM_LEADER_VISIBLE_STATUSES;
  if (actor === "member") return MEMBER_VISIBLE_STATUSES;
  return [] as TaskStatus[];
}

export function getAllowedTaskTransitions(actor: TaskActor, currentStatus: TaskStatus) {
  if (actor === "teamLeader") return TEAM_LEADER_TRANSITIONS[currentStatus];
  if (actor === "member") return MEMBER_TRANSITIONS[currentStatus];
  return [];
}

export function getTaskStatusOptions(actor: TaskActor, currentStatus: TaskStatus) {
  const visibleStatuses = getVisibleStatuses(actor);
  const allowedTransitions = getAllowedTaskTransitions(actor, currentStatus);
  const optionStatuses = visibleStatuses.includes(currentStatus)
    ? visibleStatuses
    : [currentStatus, ...visibleStatuses];

  return optionStatuses.map((status) => ({
    label: status,
    value: status,
    disabled: status !== currentStatus && !allowedTransitions.includes(status)
  }));
}
