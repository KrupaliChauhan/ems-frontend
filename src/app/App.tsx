import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "../components/layout/Layout";
import Loader from "../components/ui/Loader";
import { ToastProvider } from "../components/ui/ToastProvider";
import { DepartmentProvider } from "../features/department/context/department-context";
import { DesignationProvider } from "../features/designation/context/designation-provider";
import {
  ACCESS_RULES,
  getSession,
  hasRequiredRole,
  type UserRole,
} from "../features/auth/services/auth";

const Dashboard = lazy(() => import("../features/auth/pages/Dashboard"));
const ForgotPassword = lazy(() => import("../features/auth/pages/ForgotPassword"));
const Login = lazy(() => import("../features/auth/pages/Login"));
const ResetPassword = lazy(() => import("../features/auth/pages/ResetPassword"));
const DepartmentMaster = lazy(() => import("../features/department/pages/DepartmentMaster"));
const DesignationMaster = lazy(() => import("../features/designation/pages/DesignationMaster"));
const AssetMaster = lazy(() => import("../features/assets/pages/AssetMaster"));
const Attendance = lazy(() => import("../features/attendance/pages/Attendance"));
const EmployeeAttendancePage = lazy(() => import("../features/attendance/pages/EmployeeAttendancePage"));
const AttendanceManagementPage = lazy(() => import("../features/attendance/pages/AttendanceManagementPage"));
const AttendancePolicyPage = lazy(() => import("../features/attendance/pages/AttendancePolicyPage"));
const MyAttendancePage = lazy(() => import("../features/attendance/pages/MyAttendancePage"));
const AnnouncementDetailsPage = lazy(() => import("../features/communications/pages/AnnouncementDetailsPage"));
const AnnouncementsPage = lazy(() => import("../features/communications/pages/AnnouncementsPage"));
const EventDetailsPage = lazy(() => import("../features/communications/pages/EventDetailsPage"));
const EventsPage = lazy(() => import("../features/communications/pages/EventsPage"));
const PoliciesPage = lazy(() => import("../features/communications/pages/PoliciesPage"));
const PolicyDetailsPage = lazy(() => import("../features/communications/pages/PolicyDetailsPage"));
const HolidayMaster = lazy(() => import("../features/leaves/pages/HolidayMaster"));
const LeaveCalendarPage = lazy(() => import("../features/leaves/pages/LeaveCalendarPage"));
const LeaveRequestsPage = lazy(() => import("../features/leaves/pages/LeaveRequestsPage"));
const Leaves = lazy(() => import("../features/leaves/pages/Leaves"));
const LeaveTypesPage = lazy(() => import("../features/leaves/pages/LeaveTypesPage"));
const EmployeeLeaveDashboard = lazy(() => import("../features/leaves/pages/EmployeeLeaveDashboard"));
const AttendanceReportPage = lazy(() => import("../features/reports/pages/AttendanceReportPage"));
const LeaveReportPage = lazy(() => import("../features/reports/pages/LeaveReportPage"));
const ProjectReportPage = lazy(() => import("../features/reports/pages/ProjectReportPage"));
const AssetReportPage = lazy(() => import("../features/reports/pages/AssetReportPage"));
const EmployeeReportPage = lazy(() => import("../features/reports/pages/EmployeeReportPage"));
const ProjectDetails = lazy(() => import("../features/projects/pages/ProjectDetails"));
const Projects = lazy(() => import("../features/projects/pages/Projects"));
const MyTasksPage = lazy(() => import("../features/tasks/pages/MyTasksPage"));
const Users = lazy(() => import("../features/users/pages/Users"));

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: readonly UserRole[];
  redirectTo?: string;
};

function ProtectedRoute({ children, allowedRoles, redirectTo = "/" }: ProtectedRouteProps) {
  const { user, token } = getSession();

  if (!token || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  const role = user.role ?? "employee";
  if (!hasRequiredRole(role, allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout
      user={{
        name: user.name || user.email,
        role,
      }}
    >
      {children}
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <DepartmentProvider>
          <DesignationProvider>
            <Suspense fallback={<Loader variant="fullscreen" label="Loading page..." />}>
              <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communications/announcements"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.communicationsPage}>
                    <AnnouncementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communications/announcements/:announcementId"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.communicationsPage}>
                    <AnnouncementDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communications/policies"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.communicationsPage}>
                    <PoliciesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communications/policies/:policyId"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.communicationsPage}>
                    <PolicyDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communications/events"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.communicationsPage}>
                    <EventsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communications/events/:eventId"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.communicationsPage}>
                    <EventDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.usersPage}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/masters/department"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.departmentMaster}>
                    <DepartmentMaster />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/masters/designation"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.designationMaster}>
                    <DesignationMaster />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/masters/assets"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.assetMaster}>
                    <AssetMaster />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.projectsPage}>
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.projectsPage}>
                    <ProjectDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-tasks"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.myTasksPage}>
                    <MyTasksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaves"
                element={
                  <ProtectedRoute>
                    <Leaves />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaves/types"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.leaveTypes}>
                    <LeaveTypesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaves/requests"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.leaveRequests}>
                    <LeaveRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaves/calendar"
                element={
                  <ProtectedRoute>
                    <LeaveCalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaves/my"
                element={
                  <ProtectedRoute allowedRoles={["employee", "HR", "teamLeader"]}>
                    <EmployeeLeaveDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaves/holidays"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.leaveHolidays}>
                    <HolidayMaster />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance"
                element={
                  <ProtectedRoute>
                    <Attendance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-attendance"
                element={
                  <ProtectedRoute allowedRoles={["employee", "teamLeader", "HR"]}>
                    <MyAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/self"
                element={
                  <ProtectedRoute allowedRoles={["employee", "teamLeader", "HR"]}>
                    <EmployeeAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/manage"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.attendanceManage}>
                    <AttendanceManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/policy"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.attendancePolicy}>
                    <AttendancePolicyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/attendance"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.reportsPage}>
                    <AttendanceReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/leave"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.reportsPage}>
                    <LeaveReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/projects"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.reportsPage}>
                    <ProjectReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/assets"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.reportsPage}>
                    <AssetReportPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports/employees"
                element={
                  <ProtectedRoute allowedRoles={ACCESS_RULES.reportsPage}>
                    <EmployeeReportPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </DesignationProvider>
        </DepartmentProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;



