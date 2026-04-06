import { useEffect, useMemo, useRef, useState } from "react";
import DataTable from "../../../components/table/DataTable";
import type { Column } from "../../../components/table/DataTable";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

import {
  listDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
  type DesignationItem,
} from "../services/designationService";

import { listDepartments } from "../../department/services/departmentService";
import Loader from "../../../components/ui/Loader";

type Row = {
  id: number;
  _id: string;
  name: string;
  department: string;
  departmentId: string | null;
  status: "Active" | "Inactive";
};

const DesignationMaster = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0); // ✅ total items
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [deptOptions, setDeptOptions] = useState<
    { id: string; name: string }[]
  >([]);

  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [viewRow, setViewRow] = useState<Row | null>(null);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ Add/Edit form
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const hasMountedSearch = useRef(false);
  const [form, setForm] = useState<{
    name: string;
    departmentId: string;
    status: "Active" | "Inactive";
  }>({
    name: "",
    departmentId: "",
    status: "Active",
  });

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "name", label: "Designation" },
      { key: "department", label: "Department" },
      { key: "status", label: "Status" },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await listDesignations({ page, limit, search });

      const mapped: Row[] = res.items.map((d: DesignationItem, idx) => ({
        id: idx + 1 + (page - 1) * limit,
        _id: d.id,
        name: d.name,
        department: d.department ?? "",
        departmentId: d.departmentId ?? null,
        status: d.status,
      }));

      setRows(mapped);
      setTotal(res.total ?? 0); // ✅ correct
    } catch (e: unknown) {
      setErrorMsg(
        e instanceof Error ? e.message : "Failed to load designation",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    const res = await listDepartments({ page: 1, limit: 1000 });

    setDeptOptions(
      res.items.map((d) => ({
        id: d.id, // ✅ strict typed
        name: d.name,
      })),
    );
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

  useEffect(() => {
    loadDepartments();
  }, []);

  const openAdd = () => {
    setFormError("");
    setForm({ name: "", departmentId: "", status: "Active" });
    setAddOpen(true);
  };

  const openEdit = (r: Row) => {
    setFormError("");
    setForm({
      name: r.name,
      departmentId: r.departmentId ?? "",
      status: r.status,
    });
    setEditRow(r);
  };

  const validate = () => {
    const name = form.name.trim();
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters";
    if (!form.departmentId) return "Department is required"; // ✅ important
    return "";
  };

  const saveAdd = async () => {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setSaving(true);
    try {
      await createDesignation({
        name: form.name.trim(),
        departmentId: form.departmentId, // ✅ selected department
        status: form.status,
      });

      setAddOpen(false);
      setPage(1);
      load();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Add failed");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editRow) return;

    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    setSaving(true);
    try {
      await updateDesignation(editRow._id, {
        name: form.name.trim(),
        departmentId: form.departmentId, // ✅ selected department
        status: form.status,
      });
      setEditRow(null);
      load();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    try {
      await deleteDesignation(deleteRow._id);
      setDeleteRow(null);
      setSuccessMsg("Designation deleted successfully.");
      setPage(1);
      load();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Delete failed");
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
            placeholder="Search designation..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>

        <Button onClick={openAdd} size="lg">
          Add Designation
        </Button>
      </div>

      {loading ? (
        <Loader variant="block" label="Loading designation..." />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          actions={[
            { label: "View", onClick: (r) => setViewRow(r) },
            { label: "Edit", onClick: openEdit },
            { label: "Delete", onClick: (r) => setDeleteRow(r) },
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

      {/* ✅ ADD MODAL (with Department dropdown) */}
      <Modal
        open={addOpen}
        title="Add Designation"
        onClose={() => (saving ? null : setAddOpen(false))}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={() => setAddOpen(false)}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </Button>
            <Button
              onClick={saveAdd}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError ? (
            <p className="text-sm text-red-600">{formError}</p>
          ) : null}

          <div>
            <label className="text-sm font-medium text-slate-700">
              Designation Name
            </label>
            <input
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setFormError("");
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Enter designation"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Department
            </label>
            <select
              value={form.departmentId}
              onChange={(e) => {
                setForm((p) => ({ ...p, departmentId: e.target.value }));
                setFormError("");
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Select department</option>
              {deptOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as "Active" | "Inactive",
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* ✅ EDIT MODAL (same fields) */}
      <Modal
        open={!!editRow}
        title="Edit Designation"
        onClose={() => (saving ? null : setEditRow(null))}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={() => setEditRow(null)}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={saving}
            >
              {saving ? "Updating..." : "Update"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError ? (
            <p className="text-sm text-red-600">{formError}</p>
          ) : null}

          <div>
            <label className="text-sm font-medium text-slate-700">
              Designation Name
            </label>
            <input
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setFormError("");
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Enter designation"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Department
            </label>
            <select
              value={form.departmentId}
              onChange={(e) => {
                setForm((p) => ({ ...p, departmentId: e.target.value }));
                setFormError("");
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Select department</option>
              {deptOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  status: e.target.value as "Active" | "Inactive",
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* View */}
      <Modal
        open={!!viewRow}
        title="View Designation"
        onClose={() => setViewRow(null)}
      >
        <div className="space-y-2">
          <div>
            <b>Name:</b> {viewRow?.name}
          </div>
          <div>
            <b>Department:</b> {viewRow?.department}
          </div>
          <div>
            <b>Status:</b> {viewRow?.status}
          </div>
        </div>
      </Modal>

      {/* Delete */}
      <ConfirmDialog
        open={!!deleteRow}
        title="Delete Designation"
        message={
          deleteRow
            ? `Are you sure you want to delete "${deleteRow.name}"?`
            : "Are you sure?"
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteRow(null)}
      />

      {/* Success */}
      <ConfirmDialog
        open={!!successMsg}
        title="Success"
        message={successMsg}
        mode="Success"
        onConfirm={() => setSuccessMsg("")}
        onCancel={() => setSuccessMsg("")}
      />

      {/* Error */}
      <ConfirmDialog
        open={!!errorMsg}
        title="Error"
        message={errorMsg}
        mode="Confirm"
        onConfirm={() => setErrorMsg("")}
        onCancel={() => setErrorMsg("")}
      />
    </div>
  );
};

export default DesignationMaster;
