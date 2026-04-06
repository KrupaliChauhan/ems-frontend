import { getSession, hasAccess } from "../../auth/services/auth";
import AdminAttendanceOverview from "./AdminAttendanceOverview";
import EmployeeAttendancePage from "./EmployeeAttendancePage";

export default function Attendance() {
  const { user } = getSession();

  if (!user) return null;
  if (!hasAccess(user.role, "attendanceManage")) return <EmployeeAttendancePage />;

  return <AdminAttendanceOverview />;
}
