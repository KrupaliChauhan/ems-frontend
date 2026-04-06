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
import EventCalendarPanel from "../components/EventCalendarPanel";
import EventFormModal from "../components/EventFormModal";
import {
  archiveEvent,
  restoreEvent,
  cancelEvent,
  deleteEvent,
  getCommunicationMeta,
  listEvents,
  publishEvent,
  saveEvent,
  type CommunicationMeta,
  type EventItem
} from "../services/communicationService";

type Row = EventItem & { id: string };

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = getSession();
  const canManage = hasAccess(user?.role, "communicationsManage");
  const [meta, setMeta] = useState<CommunicationMeta | null>(null);
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [departmentId, setDepartmentId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventItem | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "lifecycleStatus", label: "Status" },
      { key: "startDate", label: "Start", render: (value) => formatDate(String(value)) },
      { key: "mode", label: "Mode" }
    ],
    []
  );

  const load = async () => {
    setLoading(true);
    try {
      const [metaRes, listRes] = await Promise.all([
        canManage ? getCommunicationMeta() : Promise.resolve(null),
        listEvents({ page, limit, search, category, status, departmentId })
      ]);
      setMeta(metaRes);
      setItems(listRes.items || []);
      setTotal(listRes.total || 0);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, search, category, status, departmentId]);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    await confirmAction();
    setConfirmAction(null);
    setConfirmMessage("");
  };

  const queueAction = (message: string, action: () => Promise<void>) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setDepartmentId("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex w-full flex-col gap-3 md:flex-row xl:max-w-4xl">
          <InputField label="Search" value={search} onChange={setSearch} placeholder="Search events..." />
          <SelectDropdown label="Category" value={category} onChange={setCategory} options={[
            { label: "All", value: "all" },
            { label: "Meeting", value: "meeting" },
            { label: "Training", value: "training" },
            { label: "Celebration", value: "celebration" },
            { label: "Townhall", value: "townhall" },
            { label: "Engagement", value: "engagement" },
            { label: "Other", value: "other" }
          ]} />
          <SelectDropdown label="Status" value={status} onChange={setStatus} options={[
            { label: "All", value: "all" },
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
            { label: "Cancelled", value: "cancelled" },
            { label: "Completed", value: "completed" },
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
        {canManage ? <Button onClick={() => { setEditingItem(null); setModalOpen(true); }} size="lg">Create Event</Button> : null}
      </div>

      <EventCalendarPanel events={items} onOpen={(eventId) => navigate(`/communications/events/${eventId}`)} />

      {loading ? (
        <Loader variant="block" label="Loading events..." />
      ) : (
        <DataTable
          columns={columns}
          data={items.map((item) => ({ ...item, id: item.id }))}
          actions={canManage ? [
            { label: "View", onClick: (row) => navigate(`/communications/events/${row.id}`) },
            { label: "Edit", onClick: (row) => { setEditingItem(row); setModalOpen(true); } },
            {
              label: "Publish",
              hidden: (row) => row.status !== "draft",
              onClick: (row) => queueAction("Publish this event?", async () => { await publishEvent(row.id); setSuccess("Event published successfully."); await load(); })
            },
            {
              label: "Cancel",
              hidden: (row) => row.status !== "published",
              onClick: (row) => queueAction("Cancel this event?", async () => { await cancelEvent(row.id); setSuccess("Event cancelled successfully."); await load(); })
            },
            {
              label: "Archive",
              hidden: (row) => row.status === "draft" || row.status === "archived",
              onClick: (row) => queueAction("Archive this event?", async () => { await archiveEvent(row.id); setSuccess("Event archived successfully."); await load(); })
            },
            {
              label: "Unarchive",
              hidden: (row) => row.status !== "archived",
              onClick: (row) => queueAction("Unarchive this event?", async () => { await restoreEvent(row.id); setSuccess("Event unarchived successfully."); await load(); })
            },
            { label: "Delete", onClick: (row) => queueAction("Delete this event?", async () => { await deleteEvent(row.id); setSuccess("Event deleted successfully."); await load(); }) }
          ] : [
            { label: "View", onClick: (row) => navigate(`/communications/events/${row.id}`) }
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

      <EventFormModal
        open={modalOpen}
        meta={meta}
        initial={editingItem}
        onClose={() => setModalOpen(false)}
        onSave={async (payload, id) => {
          await saveEvent(payload, id);
          setSuccess(id ? "Event updated successfully." : "Event created successfully.");
          await load();
        }}
      />

      <ConfirmDialog open={!!confirmAction} title="Confirm" message={confirmMessage} onConfirm={handleConfirm} onCancel={() => { setConfirmAction(null); setConfirmMessage(""); }} />
      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
      <ConfirmDialog open={!!success} title="Success" message={success} mode="Success" onConfirm={() => setSuccess("")} onCancel={() => setSuccess("")} />
    </div>
  );
}
