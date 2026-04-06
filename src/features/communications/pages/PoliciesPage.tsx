import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Column } from "../../../components/table/DataTable";
import DataTable from "../../../components/table/DataTable";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { InputField } from "../../../components/ui/InputField";
import Loader from "../../../components/ui/Loader";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import { formatDate } from "../../../utils/date";
import { getSession, hasAccess } from "../../auth/services/auth";
import PolicyFormModal from "../components/PolicyFormModal";
import {
  getPolicyById,
  listPolicies,
  savePolicy,
  type PolicyDetail,
  type PolicyListItem
} from "../services/communicationService";

type Row = PolicyListItem & { id: string };

export default function PoliciesPage() {
  const navigate = useNavigate();
  const { user } = getSession();
  const canManage = hasAccess(user?.role, "communicationsManage");
  const [items, setItems] = useState<PolicyListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isPublished, setIsPublished] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PolicyDetail | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.category).filter(Boolean))).map((item) => ({
        label: item,
        value: item
      })),
    [items]
  );

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "versionNumber", label: "Version" },
      {
        key: "isPublished",
        label: "Status",
        render: (value) => (value ? "Published" : "Draft")
      },
      {
        key: "acknowledgmentSummary",
        label: "Acknowledgement",
        render: (value) => {
          const summary = value as PolicyListItem["acknowledgmentSummary"];
          return summary ? `${summary.acknowledgedCount}/${summary.totalEmployees}` : "-";
        }
      },
      {
        key: "updatedAt",
        label: "Updated",
        render: (value) => formatDate(String(value))
      }
    ],
    []
  );

  const load = async () => {
    setLoading(true);
    try {
      const listRes = await listPolicies({ page, limit, search, category, isPublished });
      setItems(listRes.items || []);
      setTotal(listRes.total || 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, search, category, isPublished]);

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = async (row: Row) => {
    setLoadingEdit(true);
    try {
      const policy = await getPolicyById(row.id);
      setEditingItem(policy);
      setModalOpen(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load policy");
    } finally {
      setLoadingEdit(false);
    }
  };

  const clearViewerFilters = () => {
    setSearch("");
    setCategory("all");
    setPage(1);
  };

  const clearManagerFilters = () => {
    setSearch("");
    setCategory("all");
    setIsPublished("all");
    setPage(1);
  };

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <InputField label="Search" value={search} onChange={setSearch} placeholder="Search policy..." />
          <SelectDropdown
            label="Category"
            value={category}
            onChange={setCategory}
            options={[{ label: "All Categories", value: "all" }, ...categories]}
          />
          <div className="flex items-end">
            <Button variant="outline" onClick={clearViewerFilters}>
              Clear
            </Button>
          </div>
        </div>

        {loading ? (
          <Loader variant="block" label="Loading policies..." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/communications/policies/${item.id}`)}
                className="rounded-[28px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.92)] p-5 text-left shadow-[0_18px_40px_rgba(33,29,22,0.08)] transition hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.category || "Policy"}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.acknowledgmentStatus === "ACKNOWLEDGED"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {item.acknowledgmentStatus === "ACKNOWLEDGED" ? "Acknowledged" : "Pending"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary || "Open to review the full policy."}</p>
                <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500">
                  <span>Version {item.versionNumber}</span>
                  <span>{item.effectiveDate ? formatDate(item.effectiveDate) : "No effective date"}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex w-full flex-col gap-3 md:flex-row xl:max-w-4xl">
          <InputField label="Search" value={search} onChange={setSearch} placeholder="Search policy..." />
          <SelectDropdown
            label="Category"
            value={category}
            onChange={setCategory}
            options={[{ label: "All Categories", value: "all" }, ...categories]}
          />
          <SelectDropdown
            label="Status"
            value={isPublished}
            onChange={setIsPublished}
            options={[
              { label: "All", value: "all" },
              { label: "Published", value: "true" },
              { label: "Draft", value: "false" }
            ]}
          />
          <div className="flex items-end">
            <Button variant="outline" onClick={clearManagerFilters}>
              Clear
            </Button>
          </div>
        </div>
        <Button onClick={openCreate} size="lg">
          Create Policy
        </Button>
      </div>

      {loading || loadingEdit ? (
        <Loader variant="block" label="Loading policies..." />
      ) : (
        <DataTable
          columns={columns}
          data={items.map((item) => ({ ...item, id: item.id }))}
          actions={[
            { label: "View", onClick: (row) => navigate(`/communications/policies/${row.id}`) },
            { label: "Edit", onClick: openEdit }
          ]}
          serverPagination={{
            enabled: true,
            page,
            limit,
            total,
            onPageChange: setPage,
            onLimitChange: setLimit
          }}
        />
      )}

      <PolicyFormModal
        open={modalOpen}
        initial={editingItem}
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
