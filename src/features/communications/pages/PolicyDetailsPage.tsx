import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Column } from "../../../components/table/DataTable";
import DataTable from "../../../components/table/DataTable";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Loader from "../../../components/ui/Loader";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import { formatDate } from "../../../utils/date";
import { getSession, hasAccess } from "../../auth/services/auth";
import PolicyFormModal from "../components/PolicyFormModal";
import {
  acknowledgePolicy,
  getCommunicationMeta,
  getPolicyAcknowledgmentReport,
  getPolicyById,
  savePolicy,
  type CommunicationMeta,
  type PolicyDetail,
  type PolicyReportItem
} from "../services/communicationService";

type ReportRow = PolicyReportItem & { id: string };

export default function PolicyDetailsPage() {
  const { policyId } = useParams();
  const navigate = useNavigate();
  const { user } = getSession();
  const canManage = hasAccess(user?.role, "communicationsManage");
  const [item, setItem] = useState<PolicyDetail | null>(null);
  const [meta, setMeta] = useState<CommunicationMeta | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState<"all" | "ACKNOWLEDGED" | "PENDING">("all");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const columns: Column<ReportRow>[] = useMemo(
    () => [
      { key: "employeeName", label: "Employee" },
      { key: "departmentName", label: "Department" },
      { key: "status", label: "Status" },
      {
        key: "acknowledgedAt",
        label: "Acknowledged At",
        render: (value) => (value ? formatDate(String(value)) : "-")
      }
    ],
    []
  );

  const load = async () => {
    if (!policyId) return;
    setLoading(true);
    try {
      const [policy, metaRes, report] = await Promise.all([
        getPolicyById(policyId),
        canManage ? getCommunicationMeta() : Promise.resolve(null),
        canManage
          ? getPolicyAcknowledgmentReport(policyId, {
              departmentId,
              employeeId,
              status
            })
          : Promise.resolve(null)
      ]);

      setMeta(metaRes);
      setItem(
        report
          ? {
              ...policy,
              report: {
                totalEmployees: report.totalEmployees,
                acknowledgedCount: report.acknowledgedCount,
                pendingCount: report.pendingCount,
                items: report.items
              },
              acknowledgmentSummary: {
                totalEmployees: report.totalEmployees,
                acknowledgedCount: report.acknowledgedCount,
                pendingCount: report.pendingCount
              }
            }
          : policy
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load policy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [policyId, canManage, departmentId, employeeId, status]);

  const clearFilters = () => {
    setDepartmentId("");
    setEmployeeId("");
    setStatus("all");
  };

  if (loading || !item) {
    return <Loader variant="block" label="Loading policy..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => navigate("/communications/policies")}>
          Back
        </Button>
        {canManage ? (
          <Button onClick={() => setModalOpen(true)}>
            Edit Policy
          </Button>
        ) : null}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.category || "Policy"}</p>
          <h2 className="text-3xl font-semibold text-slate-900">{item.title}</h2>
        </div>
      </div>

      <div className="rounded-[32px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.92)] p-6 shadow-[0_18px_40px_rgba(33,29,22,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${item.isPublished ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-700"}`}>
            {item.isPublished ? "Published" : "Draft"}
          </span>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            Version {item.versionNumber}
          </span>
          {item.effectiveDate ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Effective {formatDate(item.effectiveDate)}
            </span>
          ) : null}
        </div>
        <p className="mt-4 text-base leading-7 text-slate-600">{item.summary || "Review the full policy content below."}</p>
        <div className="prose prose-slate mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: item.content || "" }} />
        {!canManage ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                item.acknowledgmentStatus === "ACKNOWLEDGED"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {item.acknowledgmentStatus === "ACKNOWLEDGED" ? "Acknowledged" : "Pending"}
            </span>
            {item.acknowledgmentStatus !== "ACKNOWLEDGED" ? (
              <Button
                onClick={async () => {
                  if (!policyId) return;
                  await acknowledgePolicy(policyId);
                  await load();
                }}
              >
                Acknowledge Policy
              </Button>
            ) : (
              <p className="text-sm text-slate-500">
                Acknowledged on {item.acknowledgedAt ? formatDate(item.acknowledgedAt) : "-"}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {canManage && item.acknowledgmentSummary ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Total Employees", value: item.acknowledgmentSummary.totalEmployees, tone: "bg-slate-900 text-white" },
              { label: "Acknowledged", value: item.acknowledgmentSummary.acknowledgedCount, tone: "bg-emerald-50 text-emerald-700" },
              { label: "Pending", value: item.acknowledgmentSummary.pendingCount, tone: "bg-amber-50 text-amber-700" }
            ].map((card) => (
              <div key={card.label} className={`rounded-[28px] px-5 py-5 shadow-sm ${card.tone}`}>
                <p className="text-xs uppercase tracking-[0.18em] opacity-80">{card.label}</p>
                <p className="mt-3 text-3xl font-semibold">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <SelectDropdown
              label="Department"
              value={departmentId}
              onChange={setDepartmentId}
              options={[{ label: "All Departments", value: "" }, ...((meta?.departments || []).map((dep) => ({ label: dep.name, value: dep.id })))]}
            />
            <SelectDropdown
              label="Employee"
              value={employeeId}
              onChange={setEmployeeId}
              options={[{ label: "All Employees", value: "" }, ...((meta?.users || []).map((employee) => ({ label: employee.name, value: employee.id })))]}
            />
            <SelectDropdown
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as "all" | "ACKNOWLEDGED" | "PENDING")}
              options={[
                { label: "All", value: "all" },
                { label: "Acknowledged", value: "ACKNOWLEDGED" },
                { label: "Pending", value: "PENDING" }
              ]}
            />
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={(item.report?.items || []).map((reportItem) => ({ ...reportItem, id: reportItem.employeeId }))}
          />

          {item.history.length > 0 ? (
            <div className="rounded-[28px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.92)] p-5 shadow-[0_18px_40px_rgba(33,29,22,0.08)]">
              <h3 className="text-lg font-semibold text-slate-900">Version History</h3>
              <div className="mt-4 space-y-4">
                {item.history.map((historyItem) => (
                  <div key={historyItem.id} className="rounded-2xl border border-[rgba(123,97,63,0.12)] bg-white/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">Version {historyItem.versionNumber}</p>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{formatDate(historyItem.changedAt)}</p>
                    </div>
                    {historyItem.changeSummary ? <p className="mt-2 text-sm text-slate-600">{historyItem.changeSummary}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <PolicyFormModal
        open={modalOpen}
        initial={item}
        onClose={() => setModalOpen(false)}
        onSave={async (payload, id) => {
          await savePolicy(payload, id);
          await load();
        }}
      />

      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
    </div>
  );
}
