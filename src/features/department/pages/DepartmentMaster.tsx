import { useEffect, useMemo, useRef, useState } from "react";
import DataTable from "../../../components/table/DataTable";
import type { Column } from "../../../components/table/DataTable";
import MasterFormModal from "../../../components/ui/MasterFormModal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type DepartmentItem,
} from "../services/departmentService";
import Loader from "../../../components/ui/Loader";

type Row = {
  id: number;
  _id: string;
  name: string;
  status: "Active" | "Inactive";
};

const DepartmentMaster = () => {
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0); // ✅ total from backend

  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  const [addOpen, setAddOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<Row | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const hasMountedSearch = useRef(false);

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "name", label: "Department" },
      { key: "status", label: "Status" },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await listDepartments({ page, limit, search });

      const mapped: Row[] = res.items.map((d: DepartmentItem, idx) => ({
        id: idx + 1 + (page - 1) * limit,
        _id: d.id,
        name: d.name,
        status: d.status,
      }));

      setRows(mapped);
      setTotal(res.total ?? 0); // ✅ correct backend total
    } catch (e: unknown) {
      let message = "Failed to fetch departments";
      if (e instanceof Error) message = e.message;
      else if (typeof e === "string") message = e;
      setErrorMessage(message);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    if (!hasMountedSearch.current) {
      hasMountedSearch.current = true;
      return;
    }

    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openView = (row: Row) => {
    setViewRow(row);
    setViewOpen(true);
  };

  const openEdit = (row: Row) => {
    setSelected(row);
    setEditOpen(true);
  };

  const openDelete = (row: Row) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const saveAdd = async (payload: {
    name: string;
    status: "Active" | "Inactive";
  }) => {
    try {
      await createDepartment(payload);
      setAddOpen(false);
      setPage(1);
      load();
    } catch (e: unknown) {
      let message = "Add failed";
      if (e instanceof Error) message = e.message;
      setErrorMessage(message);
      setErrorOpen(true);
    }
  };

  const saveEdit = async (payload: {
    name: string;
    status: "Active" | "Inactive";
  }) => {
    if (!selected) return;
    try {
      await updateDepartment(selected._id, payload);
      setEditOpen(false);
      setSelected(null);
      load();
    } catch (e: unknown) {
      let message = "Update failed";
      if (e instanceof Error) message = e.message;
      setErrorMessage(message);
      setErrorOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDepartment(deleteTarget._id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      setSuccessMessage("Department deleted successfully.");
      setSuccessOpen(true);
      setPage(1);
      load();
    } catch (e: unknown) {
      let message = "Delete failed";
      if (e instanceof Error) message = e.message;
      setErrorMessage(message);
      setErrorOpen(true);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-3 lg:max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>

        <Button onClick={() => setAddOpen(true)} size="lg">
          Add Department
        </Button>
      </div>

      {loading ? (
        <Loader
          variant="block"
          size="md"
          label="Loading departments..."
          className="mb-3"
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          actions={[
            { label: "View", onClick: openView },
            { label: "Edit", onClick: openEdit },
            { label: "Delete", onClick: openDelete },
          ]}
          serverPagination={{
            enabled: true,
            page,
            limit,
            total, // ✅ correct
            onPageChange: setPage,
            onLimitChange: setLimit,
          }}
        />
      )}

      <MasterFormModal
        key={addOpen ? "add-open" : "add-closed"}
        open={addOpen}
        title="Add Department"
        initialName=""
        initialStatus="Active"
        onClose={() => setAddOpen(false)}
        onSave={saveAdd}
      />

      <MasterFormModal
        key={selected?._id ?? "edit-none"}
        open={editOpen}
        title="Edit Department"
        initialName={selected?.name ?? ""}
        initialStatus={selected?.status ?? "Active"}
        onClose={() => setEditOpen(false)}
        onSave={saveEdit}
      />

      <Modal
        open={viewOpen}
        title="View Department"
        onClose={() => setViewOpen(false)}
      >
        <div className="space-y-2 text-slate-700">
          <div>
            <b>Name:</b> {viewRow?.name ?? "-"}
          </div>
          <div>
            <b>Status:</b> {viewRow?.status ?? "-"}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Department"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"?`
            : "Are you sure?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={successOpen}
        title="Success"
        message={successMessage}
        mode="Success"
        onConfirm={() => setSuccessOpen(false)}
        onCancel={() => setSuccessOpen(false)}
      />

      <ConfirmDialog
        open={errorOpen}
        title="Error"
        message={errorMessage}
        mode="Confirm"
        onConfirm={() => setErrorOpen(false)}
        onCancel={() => setErrorOpen(false)}
      />
    </div>
  );
};

export default DepartmentMaster;
