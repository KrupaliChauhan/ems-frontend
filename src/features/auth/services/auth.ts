export type UserRole =
  | "superadmin"
  | "admin"
  | "employee"
  | "HR"
  | "teamLeader";

export const ACCESS_RULES = {
  communicationsPage: ["superadmin", "admin", "employee", "HR", "teamLeader"],
  communicationsManage: ["superadmin", "admin", "HR"],
  usersPage: ["superadmin", "admin", "HR"],
  usersManage: ["superadmin", "admin", "HR"],
  projectsPage: ["superadmin", "admin", "employee", "teamLeader"],
  projectManage: ["superadmin", "admin", "teamLeader"],
  myTasksPage: ["employee", "teamLeader"],
  attendancePage: ["superadmin", "admin", "employee", "HR", "teamLeader"],
  attendanceManage: ["superadmin", "admin", "HR", "teamLeader"],
  attendancePolicy: ["superadmin", "admin", "HR"],
  leavesPage: ["superadmin", "admin", "employee", "HR", "teamLeader"],
  leaveTypes: ["superadmin", "admin", "HR"],
  leaveRequests: ["superadmin", "admin", "HR", "teamLeader"],
  leaveCalendar: ["superadmin", "admin", "employee", "HR", "teamLeader"],
  leaveHolidays: ["superadmin", "admin", "HR"],
  departmentMaster: ["superadmin", "admin", "HR"],
  designationMaster: ["superadmin", "admin", "HR"],
  assetMaster: ["superadmin", "admin", "HR"],
  reportsPage: ["superadmin", "admin", "HR"],
} as const satisfies Record<string, UserRole[]>;

export type SessionUser = {
  id?: string;
  name?: string;
  email: string;
  role?: UserRole;
  joiningDate?: string | null;
  teamLeaderId?: string | null;
};

export function saveSession(payload: { token: string; user: SessionUser }) {
  localStorage.setItem("token", payload.token);
  localStorage.setItem("user", JSON.stringify(payload.user));
}

export function getSession() {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  let user: SessionUser | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as SessionUser;
    } catch {
      localStorage.removeItem("user");
    }
  }

  return { token, user };
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function hasRequiredRole(
  role: UserRole | undefined,
  allowedRoles?: readonly UserRole[],
) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!role) return false;
  return allowedRoles.includes(role);
}

export function hasAccess(
  role: UserRole | undefined,
  accessKey: keyof typeof ACCESS_RULES,
) {
  return hasRequiredRole(role, ACCESS_RULES[accessKey]);
}

