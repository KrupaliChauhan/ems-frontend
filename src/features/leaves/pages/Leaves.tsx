import { getSession, hasAccess } from "../../auth/services/auth";
import AdminLeaveDashboard from "./AdminLeaveDashboard";
import EmployeeLeaveDashboard from "./EmployeeLeaveDashboard";

export default function Leaves() {
  const { user } = getSession();

  if (!user) return null;
  if (!hasAccess(user.role, "leaveRequests")) return <EmployeeLeaveDashboard />;

  return <AdminLeaveDashboard />;
}
