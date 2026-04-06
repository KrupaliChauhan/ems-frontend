import type { UserRole } from "../../features/auth/services/auth";

export type MenuItem = {
  label: string;
  path?: string;
  roles: UserRole[];
  children?: Array<{
    label: string;
    path: string;
    roles: UserRole[];
  }>;
};

export const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    roles: ["superadmin", "admin", "employee", "HR", "teamLeader"],
  },
  {
    label: "Users",
    path: "/user",
    roles: ["superadmin", "admin", "HR"],
  },
  {
    label: "Projects",
    path: "/projects",
    roles: ["superadmin", "admin", "employee", "teamLeader"],
  },
  {
    label: "My Tasks",
    path: "/my-tasks",
    roles: ["employee", "teamLeader"],
  },
  {
    label: "Attendance",
    path: "/attendance",
    roles: ["superadmin", "admin", "employee", "HR", "teamLeader"],
    children: [
      {
        label: "My Attendance",
        path: "/my-attendance",
        roles: ["employee", "HR", "teamLeader"],
      },
      {
        label: "Attendance Management",
        path: "/attendance/manage",
        roles: ["superadmin", "admin", "HR", "teamLeader"],
      },
      {
        label: "Attendance Policy",
        path: "/attendance/policy",
        roles: ["superadmin", "admin", "HR"],
      },
    ],
  },

  {
    label: "Leave",
    path: "/leaves",
    roles: ["superadmin", "admin", "employee", "HR", "teamLeader"],
    children: [
      {
        label: "Leave Types",
        path: "/leaves/types",
        roles: ["superadmin", "admin", "HR"],
      },
      {
        label: "Leave Requests",
        path: "/leaves/requests",
        roles: ["superadmin", "admin", "HR", "teamLeader"],
      },
      {
        label: "Leave Calendar",
        path: "/leaves/calendar",
        roles: ["superadmin", "admin", "employee", "HR", "teamLeader"],
      },
    ],
  },
  {
    label: "Communications",
    roles: ["superadmin", "admin", "employee", "HR", "teamLeader"],
    children: [
      {
        label: "Announcements",
        path: "/communications/announcements",
        roles: ["superadmin", "admin", "employee", "HR", "teamLeader"],
      },
      {
        label: "Events",
        path: "/communications/events",
        roles: ["superadmin", "admin", "employee", "HR", "teamLeader"],
      },
      {
        label: "Policies",
        path: "/communications/policies",
        roles: ["superadmin", "admin", "employee", "HR", "teamLeader"],
      },
    ],
  },

  {
    label: "Master",
    roles: ["superadmin", "admin", "HR"],
    children: [
      {
        label: "Department",
        path: "/masters/department",
        roles: ["superadmin", "admin", "HR"],
      },
      {
        label: "Designation",
        path: "/masters/designation",
        roles: ["superadmin", "admin", "HR"],
      },
      {
        label: "Assets",
        path: "/masters/assets",
        roles: ["superadmin", "admin", "HR"],
      },
      {
        label: "Holiday Master",
        path: "/leaves/holidays",
        roles: ["superadmin", "admin", "HR"],
      },
    ],
  },
  {
    label: "Reports",
    roles: ["superadmin", "admin", "HR"],
    children: [
      {
        label: "Attendance Report",
        path: "/reports/attendance",
        roles: ["superadmin", "admin", "HR"],
      },
      {
        label: "Leave Report",
        path: "/reports/leave",
        roles: ["superadmin", "admin", "HR"],
      },
      {
        label: "Project Report",
        path: "/reports/projects",
        roles: ["superadmin", "admin", "HR"],
      },
      {
        label: "Asset Report",
        path: "/reports/assets",
        roles: ["superadmin", "admin", "HR"],
      },
      {
        label: "Employee Report",
        path: "/reports/employees",
        roles: ["superadmin", "admin", "HR"],
      },
    ],
  },
];
