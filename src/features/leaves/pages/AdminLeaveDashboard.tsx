import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Loader from "../../../components/ui/Loader";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import { formatDate } from "../../../utils/date";
import {
  getLeaveSummary,
  listLeaveRequests,
  runLeaveAutomation,
  type LeaveRequestItem,
} from "../services/leaveService";
import { getSession, hasAccess } from "../../auth/services/auth";

export default function AdminLeaveDashboard() {
  const navigate = useNavigate();
  const { user } = getSession();
  const canRunAccrual = user?.role === "superadmin" || user?.role === "admin";
  const canManageLeaveTypes = hasAccess(user?.role, "leaveTypes");
  const canRequestOwnLeave =
    user?.role === "employee" || user?.role === "HR" || user?.role === "teamLeader";

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [topLeaveTypes, setTopLeaveTypes] = useState<Array<{ leaveTypeName: string; count: number }>>([]);
  const [recentRequests, setRecentRequests] = useState<LeaveRequestItem[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, requestRes] = await Promise.all([
        getLeaveSummary("company"),
        listLeaveRequests({ page: 1, limit: 5, status: "all" }),
      ]);

      setSummary(summaryRes.summary || {});
      setTopLeaveTypes(summaryRes.topLeaveTypes || []);
      setRecentRequests(requestRes.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leave dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cards = [
    { label: "Total Requests", value: summary.totalRequests ?? 0, tone: "bg-slate-900 text-white" },
    { label: "Pending", value: summary.pending ?? 0, tone: "bg-amber-50 text-amber-700" },
    { label: "Approved", value: summary.approved ?? 0, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Rejected", value: summary.rejected ?? 0, tone: "bg-rose-50 text-rose-700" },
    { label: "On Leave Today", value: summary.employeesOnLeaveToday ?? 0, tone: "bg-sky-50 text-sky-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Leave Operations</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor requests, review approvals, and keep balances current across the company.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canRequestOwnLeave ? (
            <Button variant="outline" onClick={() => navigate("/leaves/my")}>Request Leave</Button>
          ) : null}
          <Button variant="outline" onClick={() => navigate("/leaves/requests")}>Open Requests</Button>
          {canManageLeaveTypes ? (
            <Button variant="outline" onClick={() => navigate("/leaves/types")}>Manage Leave Types</Button>
          ) : null}
          <Button variant="outline" onClick={() => navigate("/leaves/calendar")}>Open Calendar</Button>
          {canRunAccrual ? (
            <Button onClick={async () => {
              try {
                await runLeaveAutomation();
                setSuccess("Leave automation processed successfully.");
                load();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to run automation");
              }
            }}>
              Run Accrual
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <Loader variant="block" label="Loading leave operations..." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-5">
            {cards.map((card) => (
              <div key={card.label} className={`rounded-3xl px-4 py-4 shadow-sm md:px-5 md:py-5 ${card.tone}`}>
                <p className="text-[10px] uppercase tracking-[0.16em] opacity-80 md:text-xs md:tracking-[0.2em]">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold md:mt-3 md:text-3xl">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Recent Leave Requests</h3>
                  <p className="text-sm text-slate-500">Latest requests needing visibility.</p>
                </div>
                <Button variant="outline" onClick={() => navigate("/leaves/requests")}>View All</Button>
              </div>

              <div className="mt-5 space-y-3">
                {recentRequests.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{item.employee?.name} · {item.leaveType.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(item.fromDate)} - {formatDate(item.toDate)} · {item.totalDays} day(s)
                        </p>
                      </div>
                      <LeaveStatusBadge status={item.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Top Leave Types</h3>
              <p className="text-sm text-slate-500">Most requested leave categories.</p>
              <div className="mt-5 space-y-3">
                {topLeaveTypes.length === 0 ? (
                  <p className="text-sm text-slate-500">No leave data available yet.</p>
                ) : (
                  topLeaveTypes.map((item) => (
                    <div key={item.leaveTypeName} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                      <span className="text-sm font-medium text-slate-800">{item.leaveTypeName}</span>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
      <ConfirmDialog open={!!success} title="Success" message={success} mode="Success" onConfirm={() => setSuccess("")} onCancel={() => setSuccess("")} />
    </div>
  );
}
