import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Loader from "../../../components/ui/Loader";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { getAttendanceDashboard } from "../services/attendanceService";
import { getSession, hasAccess } from "../../auth/services/auth";

export default function AdminAttendanceOverview() {
  const navigate = useNavigate();
  const { user } = getSession();
  const canSelfAttend = user?.role === "employee" || user?.role === "teamLeader" || user?.role === "HR";
  const canManageAttendanceRecords = hasAccess(user?.role, "attendanceManage");
  const canManageAttendancePolicy = hasAccess(user?.role, "attendancePolicy");
  const now = new Date();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [totalRecords, setTotalRecords] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAttendanceDashboard({
          month: now.getMonth() + 1,
          year: now.getFullYear()
        });
        setSummary(data.summary || {});
        setTotalRecords(data.totalRecords || 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load attendance overview");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const cards = [
    { label: "Present", value: summary.PRESENT ?? 0, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Absent", value: summary.ABSENT ?? 0, tone: "bg-rose-50 text-rose-700" },
    { label: "Leave", value: summary.LEAVE ?? 0, tone: "bg-sky-50 text-sky-700" },
    { label: "Holiday", value: summary.HOLIDAY ?? 0, tone: "bg-violet-50 text-violet-700" },
    { label: "Weekly Off", value: summary.WEEK_OFF ?? 0, tone: "bg-slate-100 text-slate-700" },
    { label: "Missed Punch", value: summary.MISSED_PUNCH ?? 0, tone: "bg-orange-50 text-orange-700" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Attendance Operations</h2>
          <p className="mt-1 text-sm text-slate-500">Track attendance outcomes and move quickly to management or policy actions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canSelfAttend ? (
            <>
              <Button variant="outline" onClick={() => navigate("/my-attendance")}>My Attendance</Button>
              <Button variant="outline" onClick={() => navigate("/attendance/self")}>Punch In / Out</Button>
            </>
          ) : null}
          {canManageAttendanceRecords ? (
            <Button variant="outline" onClick={() => navigate("/attendance/manage")}>Attendance Management</Button>
          ) : null}
          {canManageAttendancePolicy ? (
            <Button onClick={() => navigate("/attendance/policy")}>Attendance Policy</Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <Loader variant="block" label="Loading attendance overview..." />
      ) : (
        <>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">This Month</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-900">{totalRecords} attendance day records</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {cards.map((card) => (
              <div key={card.label} className={`rounded-3xl px-4 py-4 shadow-sm md:px-5 md:py-5 ${card.tone}`}>
                <p className="text-[10px] uppercase tracking-[0.16em] opacity-80 md:text-xs md:tracking-[0.2em]">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold md:mt-3 md:text-3xl">{card.value}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
    </div>
  );
}
