import { useEffect, useMemo, useState } from "react";
import DataTable from "../../../components/table/DataTable";
import type { Column } from "../../../components/table/DataTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Loader from "../../../components/ui/Loader";
import Button from "../../../components/ui/Button";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import DatePicker from "../../../components/ui/DatePicker";
import { formatDate } from "../../../utils/date";
import {
  applyLeave,
  cancelLeaveRequest,
  getLeaveSummary,
  getMyLeaveBalances,
  listLeaveHolidays,
  listActiveLeaveTypes,
  listMyLeaveRequests,
  type LeaveBalanceItem,
  type LeaveHolidayItem,
  type LeaveRequestItem,
  type LeaveTypeItem,
} from "../services/leaveService";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import LeaveRequestFormModal from "../components/LeaveRequestFormModal";
import LeaveRequestDetailsModal from "../components/LeaveRequestDetailsModal";

type Row = LeaveRequestItem & { id: string };

export default function EmployeeLeaveDashboard() {
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
  const [holidays, setHolidays] = useState<LeaveHolidayItem[]>([]);
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("all");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [applyOpen, setApplyOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<LeaveRequestItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequestItem | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "leaveType", label: "Leave Type", render: (_, row) => row.leaveType.name },
      { key: "fromDate", label: "Date Range", render: (_, row) => `${formatDate(row.fromDate)} - ${formatDate(row.toDate)}` },
      { key: "totalDays", label: "Days" },
      { key: "createdAt", label: "Applied On", render: (value) => formatDate(String(value ?? "")) },
      { key: "status", label: "Status", render: (value) => <LeaveStatusBadge status={value as LeaveRequestItem["status"]} /> },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, balanceRes, typeRes, holidayRes, requestRes] = await Promise.allSettled([
        getLeaveSummary("self"),
        getMyLeaveBalances(),
        listActiveLeaveTypes(),
        listLeaveHolidays(),
        listMyLeaveRequests({ page, limit, status, leaveTypeId, fromDate, toDate }),
      ]);

      setSummary(summaryRes.status === "fulfilled" ? summaryRes.value.summary || {} : {});
      setBalances(balanceRes.status === "fulfilled" ? balanceRes.value.items || [] : []);
      setLeaveTypes(typeRes.status === "fulfilled" ? typeRes.value.items || [] : []);
      setHolidays(holidayRes.status === "fulfilled" ? holidayRes.value.items || [] : []);
      setRequests(requestRes.status === "fulfilled" ? requestRes.value.items || [] : []);
      setTotal(requestRes.status === "fulfilled" ? requestRes.value.total || 0 : 0);

      const failures: string[] = [];
      if (summaryRes.status === "rejected") failures.push("summary");
      if (balanceRes.status === "rejected") failures.push("balances");
      if (typeRes.status === "rejected") failures.push("leave types");
      if (holidayRes.status === "rejected") failures.push("holidays");
      if (requestRes.status === "rejected") failures.push("leave requests");

      if (failures.length > 0) {
        setError(`Failed to load ${failures.join(", ")}.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch leave data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, status, leaveTypeId, fromDate, toDate]);

  const quickCards = [
    { label: "Total Requests", value: summary.totalRequests ?? 0, tone: "bg-slate-900 text-white" },
    { label: "Pending", value: summary.pending ?? 0, tone: "bg-amber-50 text-amber-700" },
    { label: "Approved", value: summary.approved ?? 0, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Rejected", value: summary.rejected ?? 0, tone: "bg-rose-50 text-rose-700" },
  ];

  const cancelRequest = async () => {
    if (!cancelTarget) return;
    try {
      await cancelLeaveRequest(cancelTarget.id);
      setSuccess("Leave request cancelled successfully.");
      setCancelTarget(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to cancel leave request");
    }
  };

  const clearFilters = () => {
    setStatus("all");
    setLeaveTypeId("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">My Leaves</h2>
          <p className="mt-1 text-sm text-slate-500">Apply leave, track approvals, and monitor live balance in one place.</p>
        </div>
        <Button onClick={() => setApplyOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          Apply Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {quickCards.map((card) => (
          <div key={card.label} className={`rounded-3xl px-5 py-5 shadow-sm ${card.tone}`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-80">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {balances.map((balance) => (
          <div key={balance.leaveType.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: balance.leaveType.color }} />
                  <h3 className="text-lg font-semibold text-slate-900">{balance.leaveType.name}</h3>
                </div>
                <p className="mt-1 text-sm text-slate-500">{balance.leaveType.code} · Cycle {balance.cycleKey}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-white">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Remaining</p>
                <p className="text-2xl font-semibold">{balance.remaining}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-slate-500">Allocated</p><p className="mt-1 font-semibold text-slate-900">{balance.totalAllocated}</p></div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-slate-500">Accrued</p><p className="mt-1 font-semibold text-slate-900">{balance.accrued}</p></div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-slate-500">Carry Forward</p><p className="mt-1 font-semibold text-slate-900">{balance.carriedForward}</p></div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-slate-500">Pending</p><p className="mt-1 font-semibold text-slate-900">{balance.pending}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SelectDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { label: "All", value: "all" },
              { label: "Pending", value: "Pending" },
              { label: "Level 1 Approved", value: "Level 1 Approved" },
              { label: "Approved", value: "Approved" },
              { label: "Rejected", value: "Rejected" },
              { label: "Cancelled", value: "Cancelled" },
            ]}
          />
          <SelectDropdown
            label="Leave Type"
            value={leaveTypeId}
            onChange={setLeaveTypeId}
            options={[{ label: "All", value: "" }, ...leaveTypes.map((item) => ({ label: item.name, value: item.id }))]}
          />
          <DatePicker label="From Date" value={fromDate} onChange={setFromDate} />
          <DatePicker label="To Date" value={toDate} onChange={setToDate} />
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader variant="block" label="Loading leave dashboard..." />
      ) : (
        <DataTable
          columns={columns}
          data={requests.map((item) => ({ ...item, id: item.id }))}
          actions={[
            {
              label: "View",
              onClick: (row) => {
                setSelected(row);
                setDetailsOpen(true);
              },
            },
            {
              label: "Cancel",
              onClick: (row) => {
                if (row.canCancel) {
                  setCancelTarget(row);
                }
              },
              hidden: (row) => !row.canCancel,
            },
          ]}
          serverPagination={{
            enabled: true,
            page,
            limit,
            total,
            onPageChange: setPage,
            onLimitChange: setLimit,
          }}
        />
      )}

      <LeaveRequestFormModal
        open={applyOpen}
        leaveTypes={leaveTypes}
        balances={balances}
        holidays={holidays}
        onClose={() => setApplyOpen(false)}
        onSubmit={async (payload) => {
          await applyLeave(payload);
          setSuccess("Leave request submitted successfully.");
          await load();
        }}
      />

      <LeaveRequestDetailsModal open={detailsOpen} request={selected} onClose={() => setDetailsOpen(false)} />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Leave Request"
        message={cancelTarget ? `Cancel leave request for ${cancelTarget.leaveType.name}?` : "Cancel this request?"}
        confirmText="Cancel Request"
        danger
        onConfirm={cancelRequest}
        onCancel={() => setCancelTarget(null)}
      />

      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
      <ConfirmDialog open={!!success} title="Success" message={success} mode="Success" onConfirm={() => setSuccess("")} onCancel={() => setSuccess("")} />
    </div>
  );
}
