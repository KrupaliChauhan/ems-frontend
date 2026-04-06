import type { UserRole } from "../../auth/services/auth";
import { getAttendanceDashboard, getMyDailyAttendance } from "../../attendance/services/attendanceService";
import { listAnnouncements } from "../../communications/services/communicationService";
import { getLeaveSummary, listLeaveHolidays, listLeaveRequests } from "../../leaves/services/leaveService";
import { getProjects, myProjects, type ProjectItem, type ProjectStatus } from "../../projects/services/projectService";
import { getTasksByProject, getMyTasks, type MyTaskItem, type TaskItem, type TaskStatus } from "../../tasks/services/taskService";
import { fetchUsers } from "../../users/services/userService";
import { formatDate } from "../../../utils/date";

export type DashboardIconKey =
  | "attendance"
  | "leave"
  | "tasks"
  | "deadline"
  | "team"
  | "approval"
  | "project"
  | "announcement"
  | "users"
  | "activity";

export type DashboardCardItem = {
  id: string;
  title: string;
  value: string | number;
  description: string;
  icon: DashboardIconKey;
  accentClassName?: string;
};

export type DashboardChartItem = {
  id: string;
  label: string;
  value: number;
  color: string;
  hint?: string;
};

export type DashboardListItem = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  href?: string;
  badge?: string;
};

export type DashboardProgressItem = {
  id: string;
  label: string;
  value: number;
  total?: number;
  meta?: string;
  tone?: "yellow" | "amber" | "slate";
};

export type DashboardActionItem = {
  id: string;
  label: string;
  description: string;
  path: string;
};

export type DashboardSectionData =
  | {
      id: string;
      kind: "chart";
      title: string;
      description: string;
      emptyMessage: string;
      items: DashboardChartItem[];
    }
  | {
      id: string;
      kind: "list";
      title: string;
      description: string;
      emptyMessage: string;
      items: DashboardListItem[];
    }
  | {
      id: string;
      kind: "progress";
      title: string;
      description: string;
      emptyMessage: string;
      items: DashboardProgressItem[];
    };

export type DashboardData = {
  badge: string;
  title: string;
  description: string;
  summaryCards: DashboardCardItem[];
  middleSections: DashboardSectionData[];
  activity: DashboardSectionData & { kind: "list"; items: DashboardListItem[] };
  quickActions: DashboardActionItem[];
};

function getLocalDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const TODAY = getLocalDateKey();

async function safeRequest<T>(request: () => Promise<T>, fallback: T) {
  try {
    return await request();
  } catch {
    return fallback;
  }
}

function formatShortDate(value?: string | null) {
  if (!value) return "No date";
  return formatDate(value);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function endOfNextSevenDays() {
  const end = startOfToday();
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return end;
}

function isWithinNextSevenDays(value?: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= startOfToday() && date <= endOfNextSevenDays();
}

function formatTime(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isEmployeeCountRole(role?: string | null) {
  return role === "employee" || role === "teamLeader";
}

function countEmployeeRoles(items: Array<{ role?: string | null }> = []) {
  return items.filter((item) => isEmployeeCountRole(item.role)).length;
}

function formatAttendanceStatus(status?: string | null) {
  if (!status) return "Not Marked";
  return status
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function isTaskOpen(status: TaskStatus) {
  return status !== "Completed";
}

function getTaskStatusCounts(tasks: Array<Pick<TaskItem, "status"> | Pick<MyTaskItem, "status">>) {
  return {
    pending: tasks.filter((item) => item.status === "Pending").length,
    inProgress: tasks.filter((item) => item.status === "In Progress").length,
    inReview: tasks.filter((item) => item.status === "In Review").length,
    completed: tasks.filter((item) => item.status === "Completed").length,
  };
}

function upcomingTaskItems(tasks: MyTaskItem[]) {
  return tasks
    .filter((item) => item.status !== "Completed" && isWithinNextSevenDays(item.dueDate))
    .sort((left, right) => new Date(left.dueDate ?? "").getTime() - new Date(right.dueDate ?? "").getTime())
    .slice(0, 5)
    .map((item) => ({
      id: item._id,
      title: item.title,
      subtitle: item.projectId?.name ? `Project: ${item.projectId.name}` : "Task deadline",
      meta: `Due ${formatShortDate(item.dueDate)}`,
      href: "/my-tasks",
      badge: item.priority,
    }));
}

function announcementItems(
  items: Array<{ id: string; title: string; summary: string; publishDate: string; priority?: string }>,
) {
  return items.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: item.summary || "Company update",
    meta: `Published ${formatShortDate(item.publishDate)}`,
    href: `/communications/announcements/${item.id}`,
    badge: item.priority,
  }));
}

function holidayItems(items: Array<{ id: string; name: string; date: string; description?: string }>) {
  return items
    .filter((item) => item.date >= TODAY)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.name,
      subtitle: item.description || "Holiday schedule",
      meta: formatShortDate(item.date),
      href: "/leaves/holidays",
      badge: "Holiday",
    }));
}

function uniqueProjectMembers(projects: ProjectItem[]) {
  const members = new Map<string, { id: string; name: string; email: string }>();
  for (const project of projects) {
    for (const member of project.employees || []) {
      if (!members.has(member._id)) {
        members.set(member._id, {
          id: member._id,
          name: member.name,
          email: member.email,
        });
      }
    }
  }
  return [...members.values()];
}

function projectStatusChart(projects: ProjectItem[]) {
  const counts: Record<ProjectStatus, number> = {
    active: projects.filter((item) => item.status === "active").length,
    pending: projects.filter((item) => item.status === "pending").length,
    completed: projects.filter((item) => item.status === "completed").length,
  };

  return [
    { id: "project-active", label: "Active", value: counts.active, color: "#0f766e", hint: "Running delivery work" },
    { id: "project-pending", label: "Pending", value: counts.pending, color: "#d97706", hint: "Awaiting movement" },
  ];
}

function attendanceChartFromSummary(summary: Record<string, number>) {
  const presentCount =
    (summary.PRESENT ?? 0) +
    (summary.HALF_DAY ?? 0) +
    (summary.HALF_DAY_LEAVE_PRESENT ?? 0);

  return [
    { id: "attendance-present", label: "Present", value: presentCount, color: "#0f766e", hint: "Checked in today" },
    { id: "attendance-half", label: "Half Day", value: (summary.HALF_DAY ?? 0) + (summary.HALF_DAY_LEAVE_PRESENT ?? 0), color: "#14b8a6", hint: "Partial day" },
    { id: "attendance-leave", label: "Leave", value: summary.LEAVE ?? 0, color: "#d97706", hint: "Approved leave" },
    { id: "attendance-absent", label: "Absent", value: summary.ABSENT ?? 0, color: "#475569", hint: "No attendance" },
    { id: "attendance-missed", label: "Missed Punch", value: summary.MISSED_PUNCH ?? 0, color: "#7c3aed", hint: "Needs follow-up" },
  ];
}

function taskChartFromCounts(counts: ReturnType<typeof getTaskStatusCounts>) {
  return [
    { id: "task-pending", label: "Pending", value: counts.pending, color: "#94a3b8", hint: "Not started yet" },
    { id: "task-progress", label: "In Progress", value: counts.inProgress, color: "#0f766e", hint: "Actively moving" },
    { id: "task-review", label: "In Review", value: counts.inReview, color: "#d97706", hint: "Needs review" },
    { id: "task-completed", label: "Completed", value: counts.completed, color: "#115e59", hint: "Finished work" },
  ];
}

function quickActionsForRole(role: UserRole): DashboardActionItem[] {
  if (role === "employee") {
    return [
      { id: "action-my-tasks", label: "My Tasks", description: "Review assigned work and deadlines.", path: "/my-tasks" },
      { id: "action-my-attendance", label: "Attendance", description: "Review your daily punch and records.", path: "/my-attendance" },
      { id: "action-my-leaves", label: "My Leaves", description: "Track leave balance and requests.", path: "/leaves/my" },
      { id: "action-announcements", label: "Announcements", description: "Catch up on company updates.", path: "/communications/announcements" },
    ];
  }

  if (role === "teamLeader") {
    return [
      { id: "action-projects", label: "Projects", description: "Review team assignments and delivery state.", path: "/projects" },
      { id: "action-approvals", label: "Approvals", description: "Check leave requests awaiting action.", path: "/leaves/requests" },
      { id: "action-my-tasks", label: "My Tasks", description: "Follow up on your own assigned items.", path: "/my-tasks" },
      { id: "action-calendar", label: "Calendar", description: "See team availability at a glance.", path: "/leaves/calendar" },
    ];
  }

  if (role === "HR") {
    return [
      { id: "action-users", label: "Users", description: "Review employee records and status.", path: "/user" },
      { id: "action-attendance", label: "Attendance", description: "Open attendance management tools.", path: "/attendance/manage" },
      { id: "action-leaves", label: "Leave Requests", description: "Handle pending leave operations.", path: "/leaves/requests" },
      { id: "action-holidays", label: "Holidays", description: "Maintain holiday schedules.", path: "/leaves/holidays" },
    ];
  }

  return [
    { id: "action-users", label: "Users", description: "Manage people, roles, and status.", path: "/user" },
    { id: "action-projects", label: "Projects", description: "Review project pipelines and ownership.", path: "/projects" },
    { id: "action-attendance", label: "Attendance", description: "Open attendance oversight tools.", path: "/attendance/manage" },
    { id: "action-leaves", label: "Leave Types", description: "Adjust leave operations and setup.", path: "/leaves/types" },
  ];
}

async function getEmployeeDashboard(): Promise<DashboardData> {
  const [attendance, leaveSummary, myTasks, communications, holidays] = await Promise.all([
    safeRequest(() => getMyDailyAttendance(), { summary: null, punches: [], status: "PRESENT" }),
    safeRequest(() => getLeaveSummary("self"), { summary: {}, balances: [], recentRequests: [] }),
    safeRequest(() => getMyTasks(), { items: [] }),
    safeRequest(() => listAnnouncements({ page: 1, limit: 5, status: "published" }), { items: [], total: 0, page: 1, limit: 5, totalPages: 0 }),
    safeRequest(() => listLeaveHolidays({ isActive: "true" }), { items: [] }),
  ]);

  const openTasks = myTasks.items.filter((item) => isTaskOpen(item.status)).length;
  const deadlineCount = myTasks.items.filter((item) => isTaskOpen(item.status) && isWithinNextSevenDays(item.dueDate)).length;
  const totalBalance = (leaveSummary.balances || []).reduce((sum, item) => sum + item.remaining, 0);
  const taskCounts = getTaskStatusCounts(myTasks.items);

  return {
    badge: "Employee Workspace",
    title: "A clear view of your day, workload, and upcoming updates.",
    description: "Track attendance, leave balance, assigned work, and company communication from one focused dashboard.",
    summaryCards: [
      {
        id: "employee-attendance",
        title: "My Attendance Today",
        value: formatAttendanceStatus(attendance.summary?.status),
        description: attendance.summary
          ? `Punch In: ${formatTime(attendance.summary.firstIn)}\nPunch Out: ${formatTime(attendance.summary.lastOut)}`
          : "No attendance marked today",
        icon: "attendance",
      },
      {
        id: "employee-leave-balance",
        title: "My Leave Balance",
        value: totalBalance,
        description: `${leaveSummary.summary.pending ?? 0} request(s) still pending approval.`,
        icon: "leave",
        accentClassName: "from-amber-500 via-orange-400 to-teal-500",
      },
      {
        id: "employee-open-tasks",
        title: "My Tasks Summary",
        value: openTasks,
        description: `${taskCounts.completed} task(s) completed so far.`,
        icon: "tasks",
      },
      {
        id: "employee-deadlines",
        title: "Upcoming Deadlines",
        value: deadlineCount,
        description: "Tasks with due dates still in progress.",
        icon: "deadline",
      },
    ],
    middleSections: [
      {
        id: "employee-task-status",
        kind: "chart",
        title: "Task Status Overview",
        description: "Current distribution of your assigned work.",
        emptyMessage: "No task data available yet.",
        items: taskChartFromCounts(taskCounts),
      },
      {
        id: "employee-deadline-list",
        kind: "list",
        title: "Upcoming Deadlines",
        description: "Closest deadlines from your active tasks.",
        emptyMessage: "No upcoming task deadlines.",
        items: upcomingTaskItems(myTasks.items),
      },
      {
        id: "employee-holidays",
        kind: "list",
        title: "Upcoming Holidays",
        description: "Holiday calendar entries scheduled next.",
        emptyMessage: "No upcoming holidays scheduled.",
        items: holidayItems(holidays.items),
      },
    ],
    activity: {
      id: "employee-announcements",
      kind: "list",
      title: "Recent Announcements",
      description: "Important company updates for you.",
      emptyMessage: "No recent announcements available.",
      items: announcementItems(communications.items || []),
    },
    quickActions: quickActionsForRole("employee"),
  };
}

async function getTeamLeaderDashboard(): Promise<DashboardData> {
  const [projectsResponse, leaveRequests, announcements, attendanceSummary] = await Promise.all([
    safeRequest(() => myProjects(), { items: [] }),
    safeRequest(() => listLeaveRequests({ page: 1, limit: 5, status: "Pending" }), { items: [], total: 0, page: 1, limit: 5, totalPages: 0 }),
    safeRequest(() => listAnnouncements({ page: 1, limit: 5, status: "published" }), { items: [], total: 0, page: 1, limit: 5, totalPages: 0 }),
    safeRequest(() => getAttendanceDashboard({ fromDate: TODAY, toDate: TODAY }), { totalRecords: 0, summary: {} }),
  ]);

  const projects = projectsResponse.items || [];
  const members = uniqueProjectMembers(projects);
  const dashboardProjects = projects.slice(0, 6);
  const taskResults = await Promise.allSettled(dashboardProjects.map((project) => getTasksByProject(project._id)));
  const tasks = taskResults.flatMap((result) => (result.status === "fulfilled" ? result.value.items : []));
  const taskCounts = getTaskStatusCounts(tasks);
  const overdueTasks = tasks.filter(
    (item) => item.dueDate && item.status !== "Completed" && item.dueDate < TODAY,
  );
  const highPriorityTasks = tasks.filter(
    (item) =>
      item.status !== "Completed" &&
      (item.priority === "High" || item.priority === "Critical"),
  );

  const hasTeamAttendanceAccess = attendanceSummary.totalRecords > 0 || Object.keys(attendanceSummary.summary || {}).length > 0;
  const attendanceCounts = {
    present:
      (attendanceSummary.summary.PRESENT ?? 0) +
      (attendanceSummary.summary.HALF_DAY ?? 0) +
      (attendanceSummary.summary.HALF_DAY_LEAVE_PRESENT ?? 0),
    leave: attendanceSummary.summary.LEAVE ?? 0,
    absent: attendanceSummary.summary.ABSENT ?? 0,
    missed: attendanceSummary.summary.MISSED_PUNCH ?? 0,
  };

  return {
    badge: "Team Leader Console",
    title: "Stay ahead of delivery, attendance, and approvals across your team.",
    description: "Monitor team members, track task movement, review leave requests, and follow project progress from one dashboard.",
    summaryCards: [
      {
        id: "leader-team-size",
        title: "Team Members",
        value: members.length,
        description: `${projects.length} project(s) under your view.`,
        icon: "team",
      },
      {
        id: "leader-present",
        title: "Team Attendance Today",
        value: hasTeamAttendanceAccess ? attendanceCounts.present : "N/A",
        description: hasTeamAttendanceAccess
          ? `${attendanceCounts.leave} on leave, ${attendanceCounts.absent} absent today.`
          : members.length > 0
            ? "No attendance marked for team members today."
            : "No team members available yet.",
        icon: "attendance",
      },
      {
        id: "leader-approvals",
        title: "Pending Leave Approvals",
        value: leaveRequests.total ?? leaveRequests.items.length,
        description: "Requests currently waiting for action.",
        icon: "approval",
      },
      {
        id: "leader-overdue",
        title: "Overdue Or High Priority",
        value: overdueTasks.length + highPriorityTasks.length,
        description: `${overdueTasks.length} overdue and ${highPriorityTasks.length} high priority task(s).`,
        icon: "deadline",
      },
    ],
    middleSections: [
      {
        id: "leader-task-status",
        kind: "chart",
        title: "Team Task Status",
        description: "Snapshot of task movement across visible projects.",
        emptyMessage: "No team task data available yet.",
        items: taskChartFromCounts(taskCounts),
      },
      {
        id: "leader-project-progress",
        kind: "progress",
        title: "Project Progress Snapshot",
        description: "Task completion progress for your current projects.",
        emptyMessage: "No projects available yet.",
        items: dashboardProjects.map((project, index) => {
          const summary =
            taskResults[index]?.status === "fulfilled"
              ? taskResults[index].value.summary
              : { progress: 0, completedTasks: 0, totalTasks: 0 };
          return {
            id: project._id,
            label: project.name,
            value: summary.progress ?? 0,
            total: 100,
            meta: `${summary.completedTasks ?? 0}/${summary.totalTasks ?? 0} tasks completed`,
            tone: "yellow" as const,
          };
        }),
      },
      {
        id: "leader-attendance",
        kind: "chart",
        title: "Team Attendance Overview",
        description: "Attendance summary for members inside your visible projects.",
        emptyMessage: hasTeamAttendanceAccess
          ? "No attendance records found for today."
          : "Team attendance is not available with current role access.",
        items: hasTeamAttendanceAccess
          ? [
              { id: "leader-attendance-present", label: "Present", value: attendanceCounts.present, color: "#0f766e", hint: "Working today" },
              { id: "leader-attendance-leave", label: "Leave", value: attendanceCounts.leave, color: "#d97706", hint: "Approved leave" },
              { id: "leader-attendance-absent", label: "Absent", value: attendanceCounts.absent, color: "#475569", hint: "No attendance" },
              { id: "leader-attendance-missed", label: "Missed Punch", value: attendanceCounts.missed, color: "#7c3aed", hint: "Needs follow-up" },
            ]
          : [],
      },
    ],
    activity: {
      id: "leader-activity",
      kind: "list",
      title: "Pending Approvals And Updates",
      description: "Leave requests and announcements that may need attention.",
      emptyMessage: "Nothing urgent at the moment.",
      items: [
        ...leaveRequests.items.slice(0, 3).map((item) => ({
          id: `leave-${item.id}`,
          title: item.employee?.name ? `${item.employee.name} requested ${item.leaveType.name}` : item.leaveType.name,
          subtitle: `${formatShortDate(item.fromDate)} to ${formatShortDate(item.toDate)}`,
          meta: item.status,
          href: "/leaves/requests",
          badge: "Approval",
        })),
        ...announcementItems(announcements.items || []).slice(0, 2),
      ].slice(0, 5),
    },
    quickActions: quickActionsForRole("teamLeader"),
  };
}

async function getHrDashboard(): Promise<DashboardData> {
  const [users, activeUsers, inactiveUsers, attendance, leaveSummary, holidays, announcements] = await Promise.all([
    safeRequest(() => fetchUsers({ page: 1, limit: 1000 }), { items: [], total: 0, page: 1, limit: 1000, totalPages: 0 }),
    safeRequest(() => fetchUsers({ page: 1, limit: 1000, status: "Active" }), { items: [], total: 0, page: 1, limit: 1000, totalPages: 0 }),
    safeRequest(() => fetchUsers({ page: 1, limit: 1000, status: "Inactive" }), { items: [], total: 0, page: 1, limit: 1000, totalPages: 0 }),
    safeRequest(() => getAttendanceDashboard({ fromDate: TODAY, toDate: TODAY }), { totalRecords: 0, summary: {} }),
    safeRequest(() => getLeaveSummary("company"), { summary: {}, topLeaveTypes: [], recentRequests: [] }),
    safeRequest(() => listLeaveHolidays({ isActive: "true" }), { items: [] }),
    safeRequest(() => listAnnouncements({ page: 1, limit: 5, status: "published" }), { items: [], total: 0, page: 1, limit: 5, totalPages: 0 }),
  ]);

  const totalEmployees = countEmployeeRoles(users.items);
  const activeEmployees = countEmployeeRoles(activeUsers.items);
  const inactiveEmployees = countEmployeeRoles(inactiveUsers.items);
  const presentToday =
    (attendance.summary.PRESENT ?? 0) +
    (attendance.summary.HALF_DAY ?? 0) +
    (attendance.summary.HALF_DAY_LEAVE_PRESENT ?? 0);

  return {
    badge: "HR Operations",
    title: "Keep the workforce organized, visible, and ready for the week ahead.",
    description: "Track people counts, attendance, leave flow, holidays, and announcements without leaving the dashboard.",
    summaryCards: [
      {
        id: "hr-total-employees",
        title: "Total Employees",
        value: totalEmployees,
        description: `${activeEmployees} currently active employees.`,
        icon: "users",
      },
      {
        id: "hr-attendance-summary",
        title: "Today Attendance Summary",
        value: presentToday,
        description: `${attendance.summary.ABSENT ?? 0} absent and ${attendance.summary.LEAVE ?? 0} on leave today.`,
        icon: "attendance",
      },
      {
        id: "hr-pending-leave",
        title: "Pending Leave Requests",
        value: leaveSummary.summary.pending ?? 0,
        description: `${leaveSummary.summary.totalRequests ?? 0} total leave requests recorded.`,
        icon: "leave",
      },
      {
        id: "hr-inactive",
        title: "Inactive Employees",
        value: inactiveEmployees,
        description: "Employees currently marked inactive.",
        icon: "activity",
      },
    ],
    middleSections: [
      {
        id: "hr-attendance-overview",
        kind: "chart",
        title: "Attendance Overview",
        description: "Today's attendance distribution across employees.",
        emptyMessage: "Attendance overview is not available yet.",
        items: attendanceChartFromSummary(attendance.summary),
      },
      {
        id: "hr-leave-overview",
        kind: "chart",
        title: "Leave Request Overview",
        description: "Current company leave pipeline.",
        emptyMessage: "Leave summary is not available yet.",
        items: [
          { id: "hr-leave-pending", label: "Pending", value: leaveSummary.summary.pending ?? 0, color: "#d97706", hint: "Waiting for review" },
          { id: "hr-leave-approved", label: "Approved", value: leaveSummary.summary.approved ?? 0, color: "#0f766e", hint: "Approved requests" },
          { id: "hr-leave-rejected", label: "Rejected", value: leaveSummary.summary.rejected ?? 0, color: "#475569", hint: "Rejected requests" },
          { id: "hr-leave-today", label: "On Leave Today", value: leaveSummary.summary.employeesOnLeaveToday ?? 0, color: "#7c3aed", hint: "Away today" },
        ],
      },
      {
        id: "hr-holidays",
        kind: "list",
        title: "Upcoming Holidays",
        description: "Holiday calendar entries coming up next.",
        emptyMessage: "No upcoming holidays scheduled.",
        items: holidayItems(holidays.items),
      },
    ],
    activity: {
      id: "hr-announcements",
      kind: "list",
      title: "Company Announcements",
      description: "Recent published communication visible from HR operations.",
      emptyMessage: "No announcements available right now.",
      items: announcementItems(announcements.items),
    },
    quickActions: quickActionsForRole("HR"),
  };
}

async function getAdminDashboard(role: UserRole): Promise<DashboardData> {
  const [users, activeUsers, projects, attendance, leaveSummary, recentLeaveRequests, announcements] = await Promise.all([
    safeRequest(() => fetchUsers({ page: 1, limit: 1000 }), { items: [], total: 0, page: 1, limit: 1000, totalPages: 0 }),
    safeRequest(() => fetchUsers({ page: 1, limit: 1, status: "Active" }), { items: [], total: 0, page: 1, limit: 1, totalPages: 0 }),
    safeRequest(() => getProjects(1, 8), { items: [], total: 0, page: 1, limit: 8, totalPages: 0 }),
    safeRequest(() => getAttendanceDashboard({ fromDate: TODAY, toDate: TODAY }), { totalRecords: 0, summary: {} }),
    safeRequest(() => getLeaveSummary("company"), { summary: {}, topLeaveTypes: [], recentRequests: [] }),
    safeRequest(() => listLeaveRequests({ page: 1, limit: 5, status: "all" }), { items: [], total: 0, page: 1, limit: 5, totalPages: 0 }),
    safeRequest(() => listAnnouncements({ page: 1, limit: 4, status: "all" }), { items: [], total: 0, page: 1, limit: 4, totalPages: 0 }),
  ]);

  const projectTaskResults = await Promise.allSettled(
    projects.items.slice(0, 8).map((project) => getTasksByProject(project._id)),
  );
  const allTasks = projectTaskResults.flatMap((result) => (result.status === "fulfilled" ? result.value.items : []));
  const taskCounts = getTaskStatusCounts(allTasks);
  const openTasks = allTasks.filter((item) => item.status !== "Completed").length;

  return {
    badge: role === "superadmin" ? "Superadmin Overview" : "Admin Overview",
    title: "Monitor workforce, projects, attendance, and operational activity in one place.",
    description: "This dashboard gives leadership a fast operational read on people, project movement, attendance, leave, and recent activity.",
    summaryCards: [
      {
        id: "admin-total-employees",
        title: "Total Employees",
        value: countEmployeeRoles(users.items),
        description: "All employee records currently available.",
        icon: "users",
      },
      {
        id: "admin-active-users",
        title: "Active Users",
        value: activeUsers.total || activeUsers.items.length,
        description: "Users currently marked active in the system.",
        icon: "activity",
      },
      {
        id: "admin-projects",
        title: "Projects Overview",
        value: projects.total || projects.items.length,
        description: `${projects.items.filter((item) => item.status === "active").length} active project(s) running.`,
        icon: "project",
      },
      {
        id: "admin-open-tasks",
        title: "Task Performance",
        value: openTasks,
        description: `${taskCounts.completed} task(s) already completed across sampled projects.`,
        icon: "tasks",
      },
    ],
    middleSections: [
      {
        id: "admin-project-status",
        kind: "chart",
        title: "Projects Overview",
        description: "Status distribution across current projects.",
        emptyMessage: "No project data available yet.",
        items: projectStatusChart(projects.items),
      },
      {
        id: "admin-attendance",
        kind: "chart",
        title: "Attendance Overview",
        description: "Today's attendance summary from existing attendance APIs.",
        emptyMessage: "Attendance overview is not available yet.",
        items: attendanceChartFromSummary(attendance.summary),
      },
      {
        id: "admin-performance",
        kind: "progress",
        title: "Task And Project Performance",
        description: "Completion progress across recent projects.",
        emptyMessage: "Task performance data is not available yet.",
        items: projects.items.slice(0, 6).map((project, index) => {
          const summary =
            projectTaskResults[index]?.status === "fulfilled"
              ? projectTaskResults[index].value.summary
              : { progress: 0, completedTasks: 0, totalTasks: 0 };
          return {
            id: project._id,
            label: project.name,
            value: summary.progress ?? 0,
            total: 100,
            meta: `${summary.completedTasks ?? 0}/${summary.totalTasks ?? 0} tasks completed`,
            tone: "amber" as const,
          };
        }),
      },
      {
        id: "admin-leaves",
        kind: "chart",
        title: "Leave Overview",
        description: "Snapshot of company leave requests and today's absence load.",
        emptyMessage: "Leave overview is not available yet.",
        items: [
          { id: "admin-leave-pending", label: "Pending", value: leaveSummary.summary.pending ?? 0, color: "#d97706", hint: "Waiting review" },
          { id: "admin-leave-approved", label: "Approved", value: leaveSummary.summary.approved ?? 0, color: "#0f766e", hint: "Approved requests" },
          { id: "admin-leave-rejected", label: "Rejected", value: leaveSummary.summary.rejected ?? 0, color: "#475569", hint: "Rejected requests" },
          { id: "admin-leave-today", label: "On Leave Today", value: leaveSummary.summary.employeesOnLeaveToday ?? 0, color: "#7c3aed", hint: "Away today" },
        ],
      },
    ],
    activity: {
      id: "admin-activity",
      kind: "list",
      title: "Recent System Activity",
      description: "A blend of recent leave flow and company communication.",
      emptyMessage: "No recent activity available.",
      items: [
        ...recentLeaveRequests.items.slice(0, 3).map((item) => ({
          id: `leave-${item.id}`,
          title: item.employee?.name ? `${item.employee.name} submitted ${item.leaveType.name}` : item.leaveType.name,
          subtitle: `${formatShortDate(item.fromDate)} to ${formatShortDate(item.toDate)}`,
          meta: item.status,
          href: "/leaves/requests",
          badge: "Leave",
        })),
        ...announcementItems(announcements.items).slice(0, 2),
      ].slice(0, 5),
    },
    quickActions: quickActionsForRole(role),
  };
}

export async function getDashboardData(role: UserRole): Promise<DashboardData> {
  if (role === "employee") {
    return getEmployeeDashboard();
  }

  if (role === "teamLeader") {
    return getTeamLeaderDashboard();
  }

  if (role === "HR") {
    return getHrDashboard();
  }

  return getAdminDashboard(role);
}
