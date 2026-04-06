import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../../components/table/DataTable";
import type { Column } from "../../../components/table/DataTable";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Loader from "../../../components/ui/Loader";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import { InputField } from "../../../components/ui/InputField";
import { formatDate } from "../../../utils/date";
import { getSession, hasAccess } from "../../auth/services/auth";
import AnnouncementFormModal from "../components/AnnouncementFormModal";
import {
  archiveAnnouncement,
  deleteAnnouncement,
  getCommunicationMeta,
  listAnnouncements,
  publishAnnouncement,
  restoreAnnouncement,
  saveAnnouncement,
  type AnnouncementItem,
  type CommunicationMeta
} from "../services/communicationService";

type Row = AnnouncementItem & { id: string };

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const { user } = getSession();
  const canManage = hasAccess(user?.role, "communicationsManage");
  const [meta, setMeta] = useState<CommunicationMeta | null>(null);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [announcementType, setAnnouncementType] = useState("all");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [departmentId, setDepartmentId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AnnouncementItem | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasAnnouncements = items.length > 0;

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "title", label: "Title" },
      { key: "announcementType", label: "Type" },
      { key: "priority", label: "Priority" },
      { key: "lifecycleStatus", label: "Status" },
      { key: "publishDate", label: "Publish Date", render: (value) => formatDate(String(value)) }
    ],
    []
  );

  const load = async () => {
    setLoading(true);
    try {
      const [metaRes, listRes] = await Promise.all([
        canManage ? getCommunicationMeta() : Promise.resolve(null),
        listAnnouncements({ page, limit, search, announcementType, priority, status, departmentId })
      ]);
      setMeta(metaRes);
      setItems(listRes.items || []);
      setTotal(listRes.total || 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, search, announcementType, priority, status, departmentId]);

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = (row: Row) => {
    setEditingItem(row);
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    await confirmAction();
    setConfirmAction(null);
    setConfirmMessage("");
  };

  const handleManageAction = (message: string, action: () => Promise<void>) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
  };

  const clearFilters = () => {
    setSearch("");
    setAnnouncementType("all");
    setPriority("all");
    setStatus("all");
    setDepartmentId("");
    setPage(1);
  };

  if (!canManage) {
    return (
      <div className="space-y-6">
        {hasAnnouncements ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/communications/announcements/${item.id}`)}
                className="rounded-[28px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.92)] p-5 text-left shadow-[0_18px_40px_rgba(33,29,22,0.08)] transition hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.announcementType}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.title}</h3>
                  </div>
                  {item.isPinned ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Pinned</span> : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
                <p className="mt-4 text-xs uppercase tracking-[0.16em] text-slate-500">{formatDate(item.publishDate)}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[28px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.92)] px-6 py-10 text-center text-slate-500 shadow-[0_18px_40px_rgba(33,29,22,0.08)]">
            No Announcements Available
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex w-full flex-col gap-3 md:flex-row xl:max-w-4xl">
          <InputField label="Search" value={search} onChange={setSearch} placeholder="Search title..." />
          <SelectDropdown label="Type" value={announcementType} onChange={setAnnouncementType} options={[
            { label: "All", value: "all" },
            { label: "General", value: "general" },
            { label: "Policy", value: "policy" },
            { label: "Celebration", value: "celebration" },
            { label: "Alert", value: "alert" },
            { label: "Update", value: "update" },
            { label: "Other", value: "other" }
          ]} />
          <SelectDropdown label="Priority" value={priority} onChange={setPriority} options={[
            { label: "All", value: "all" },
            { label: "Low", value: "low" },
            { label: "Normal", value: "normal" },
            { label: "High", value: "high" },
            { label: "Urgent", value: "urgent" }
          ]} />
          <SelectDropdown label="Status" value={status} onChange={setStatus} options={[
            { label: "All", value: "all" },
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
            { label: "Expired", value: "expired" },
            { label: "Archived", value: "archived" }
          ]} />
          <SelectDropdown
            label="Department"
            value={departmentId}
            onChange={setDepartmentId}
            options={[{ label: "All Departments", value: "" }, ...(meta?.departments || []).map((item) => ({ label: item.name, value: item.id }))]}
          />
          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
        <Button onClick={openCreate} size="lg">Create Announcement</Button>
      </div>

      {loading ? (
        <Loader variant="block" label="Loading announcements..." />
      ) : !hasAnnouncements ? (
        <div className="rounded-[28px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.92)] px-6 py-10 text-center text-slate-500 shadow-[0_18px_40px_rgba(33,29,22,0.08)]">
          No Announcements Available
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items.map((item) => ({ ...item, id: item.id }))}
          actions={[
            { label: "View", onClick: (row) => navigate(`/communications/announcements/${row.id}`) },
            { label: "Edit", onClick: openEdit },
            {
              label: "Publish",
              hidden: (row) => row.status !== "draft",
              onClick: (row) =>
                handleManageAction("Publish this announcement?", async () => {
                  await publishAnnouncement(row.id);
                  setSuccess("Announcement published successfully.");
                  await load();
                })
            },
            {
              label: "Archive",
              hidden: (row) => row.status === "archived",
              onClick: (row) =>
                handleManageAction("Archive this announcement?", async () => {
                  await archiveAnnouncement(row.id);
                  setSuccess("Announcement archived successfully.");
                  await load();
                })
            },
            {
              label: "Restore",
              hidden: (row) => row.status !== "archived",
              onClick: (row) =>
                handleManageAction("Restore this announcement to draft?", async () => {
                  await restoreAnnouncement(row.id);
                  setSuccess("Announcement restored successfully.");
                  await load();
                })
            },
            { label: "Delete", onClick: (row) => handleManageAction("Delete this announcement?", async () => { await deleteAnnouncement(row.id); setSuccess("Announcement deleted successfully."); await load(); }) }
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

      <AnnouncementFormModal
        open={modalOpen}
        meta={meta}
        initial={editingItem}
        onClose={() => setModalOpen(false)}
        onSave={async (payload, id) => {
          await saveAnnouncement(payload, id);
          await load();
        }}
      />

      <ConfirmDialog open={!!confirmAction} title="Confirm" message={confirmMessage} onConfirm={handleConfirm} onCancel={() => { setConfirmAction(null); setConfirmMessage(""); }} />
      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
      <ConfirmDialog open={!!success} title="Success" message={success} mode="Success" onConfirm={() => setSuccess("")} onCancel={() => setSuccess("")} />
    </div>
  );
}
