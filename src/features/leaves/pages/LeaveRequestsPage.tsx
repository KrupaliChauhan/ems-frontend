import { useEffect, useMemo, useState } from "react";
import DataTable from "../../../components/table/DataTable";
import type { Column } from "../../../components/table/DataTable";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Loader from "../../../components/ui/Loader";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import DatePicker from "../../../components/ui/DatePicker";
import { formatDate } from "../../../utils/date";
import ApprovalActionModal from "../components/ApprovalActionModal";
import LeaveRequestDetailsModal from "../components/LeaveRequestDetailsModal";
import LeaveStatusBadge from "../components/LeaveStatusBadge";
import {
  getLeaveEmployees,
  listActiveLeaveTypes,
  listLeaveRequests,
  takeLeaveAction,
  type LeaveEmployeeOption,
  type LeaveRequestItem,
  type LeaveTypeItem,
} from "../services/leaveService";

type Row = LeaveRequestItem & { id: string };

export default function LeaveRequestsPage() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LeaveRequestItem[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeItem[]>([]);
  const [employees, setEmployees] = useState<LeaveEmployeeOption[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [details, setDetails] = useState<LeaveRequestItem | null>(null);
  const [actionTarget, setActionTarget] = useState<LeaveRequestItem | null>(null);
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "employee", label: "Employee", render: (_, row) => row.employee?.name ?? "-" },
      { key: "leaveType", label: "Leave Type", render: (_, row) => row.leaveType.name },
      { key: "fromDate", label: "Date Range", render: (_, row) => `${formatDate(row.fromDate)} - ${formatDate(row.toDate)}` },
      { key: "totalDays", label: "Days" },
      { key: "createdAt", label: "Applied On", render: (value) => formatDate(String(value ?? "")) },
      { key: "status", label: "Status", render: (value) => <LeaveStatusBadge status={value as LeaveRequestItem["status"]} /> },
      {
        key: "currentApproverLabel",
        label: "Approval",
        render: (value, row) =>
          row.status === "Approved" || row.status === "Rejected" || row.status === "Cancelled"
            ? "Finalized"
            : String(value || "Waiting")
      },
      { key: "attachment", label: "Attachment", render: (value) => (value ? "Yes" : "No") },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [requestRes, typeRes, employeeRes] = await Promise.all([
        listLeaveRequests({ page, limit, search, status, leaveTypeId, employeeId, fromDate, toDate }),
        listActiveLeaveTypes(),
        getLeaveEmployees(),
      ]);

      setItems(requestRes.items || []);
      setTotal(requestRes.total || 0);
      setLeaveTypes(typeRes.items || []);
      setEmployees(employeeRes.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, search, status, leaveTypeId, employeeId, fromDate, toDate]);

  const performAction = async (remarks: string) => {
    if (!actionTarget) return;
    try {
      await takeLeaveAction(actionTarget.id, { action, remarks });
      setActionTarget(null);
      setSuccess(`Leave request ${action === "approve" ? "approved" : "rejected"} successfully.`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update leave request");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setLeaveTypeId("");
    setEmployeeId("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold text-slate-900">Leave Requests</h2>
        <p className="mt-1 text-sm text-slate-500">Review requests with filters, approval controls, and full audit history.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="xl:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-slate-900">Search</label>
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search employee, reason, type..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <SelectDropdown
            label="Status"
            value={status}
            onChange={(value) => {
              setPage(1);
              setStatus(value);
            }}
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
            onChange={(value) => {
              setPage(1);
              setLeaveTypeId(value);
            }}
            options={[{ label: "All", value: "" }, ...leaveTypes.map((item) => ({ label: item.name, value: item.id }))]}
          />
          <SelectDropdown
            label="Employee"
            value={employeeId}
            onChange={(value) => {
              setPage(1);
              setEmployeeId(value);
            }}
            options={[{ label: "All", value: "" }, ...employees.map((item) => ({ label: item.name, value: item.id }))]}
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePicker label="From" value={fromDate} onChange={setFromDate} />
            <DatePicker label="To" value={toDate} onChange={setToDate} />
          </div>
          <div className="flex items-end xl:col-span-5">
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loader variant="block" label="Loading leave requests..." />
      ) : (
        <DataTable
          columns={columns}
          data={items.map((item) => ({ ...item, id: item.id }))}
          actions={[
            {
              label: "View",
              onClick: (row) => setDetails(row),
            },
            {
              label: "Approve",
              onClick: (row) => {
                if (row.allowedActions.includes("approve")) {
                  setAction("approve");
                  setActionTarget(row);
                }
              },
              hidden: (row) => !row.allowedActions.includes("approve"),
            },
            {
              label: "Reject",
              onClick: (row) => {
                if (row.allowedActions.includes("reject")) {
                  setAction("reject");
                  setActionTarget(row);
                }
              },
              hidden: (row) => !row.allowedActions.includes("reject"),
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

      <LeaveRequestDetailsModal open={!!details} request={details} onClose={() => setDetails(null)} />
      <ApprovalActionModal open={!!actionTarget} action={action} onClose={() => setActionTarget(null)} onSubmit={performAction} />

      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
      <ConfirmDialog open={!!success} title="Success" message={success} mode="Success" onConfirm={() => setSuccess("")} onCancel={() => setSuccess("")} />
    </div>
  );
}
