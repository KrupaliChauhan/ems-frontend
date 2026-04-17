import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DataTable from "../../../components/table/DataTable";
import type { Column } from "../../../components/table/DataTable";

import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Button from "../../../components/ui/Button";

import {
  listProjects,
  softDeleteProject,
  type ProjectStatus,
} from "../services/projectService";

import ProjectFormModal from "../components/ProjectFormModal";

import { formatDate } from "../../../utils/date";
import Loader from "../../../components/ui/Loader";
import { getSession } from "../../auth/services/auth";

type Row = {
  id: number;
  _id: string;
  name: string;
  teamLeader: string;
  createdById: string;
  startDate: string;
  timeLimit: string;
  status: ProjectStatus;
  employeesCount: string;
};

const ProjectsAdmin = () => {
  const navigate = useNavigate();
  const { user } = getSession();

  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [rows, setRows] = useState<Row[]>([]);

  const [total, setTotal] = useState(0);

  const [addOpen, setAddOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const columns: Column<Row>[] = useMemo(
    () => [
      { key: "name", label: "Project" },
      { key: "teamLeader", label: "Project Leader" },
      { key: "startDate", label: "Start Date" },
      { key: "timeLimit", label: "Time Limit" },
      { key: "status", label: "Status" },
      { key: "employeesCount", label: "Members" },
    ],
    [],
  );

  const load = async () => {
    setLoading(true);

    try {
      const res = await listProjects({
        page,
        limit,
        search,
        status: statusFilter,
      });

      const mapped: Row[] = res.items.map((p, idx) => ({
        id: idx + 1 + (page - 1) * limit,
        _id: p._id,
        name: p.name,
        teamLeader: p.projectLeader?.name ?? p.createdBy?.name ?? "-",
        createdById: p.projectLeader?._id ?? p.createdBy?._id ?? "",
        startDate: formatDate(p.startDate),
        timeLimit: p.timeLimit,
        status: p.status,
        employeesCount: String(p.members?.length ?? p.employees?.length ?? 0),
      }));

      setRows(mapped);
      setTotal(res.total);
    } catch (e: unknown) {
      let message = "Failed to fetch projects";

      if (e instanceof Error) message = e.message;
      else if (typeof e === "string") message = e;

      setErrorMsg(message);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, search, statusFilter]);

  const openEdit = (row: Row) => {
    setEditId(row._id);
    setEditOpen(true);
  };

  const openDelete = (row: Row) => {
    setDeleteId(row._id);
    setDeleteOpen(true);
  };

  const openProject = (row: Row) => {
    navigate(`/projects/${row._id}`);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await softDeleteProject(deleteId);

      setDeleteOpen(false);
      setDeleteId(null);

      setSuccessMsg("Project deleted successfully.");
      setSuccessOpen(true);

      load();
    } catch (e: unknown) {
      let message = "Delete Failed";

      if (e instanceof Error) message = e.message;
      else if (typeof e === "string") message = e;

      setErrorMsg(message);
      setErrorOpen(true);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col gap-3 md:flex-row xl:max-w-2xl">
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by project name..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>

        <Button onClick={() => setAddOpen(true)} size="lg">
          Add Project
        </Button>
      </div>

      {/* Table */}

      {loading ? (
        <Loader
          variant="block"
          size="md"
          label="Loading projects..."
          className="mb-3"
        />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          actions={[
            { label: "View", onClick: openProject },
            {
              label: "Edit",
              onClick: openEdit,
              hidden: (row) => user?.role === "teamLeader" && row.createdById !== user.id,
            },
            {
              label: "Delete",
              onClick: openDelete,
              hidden: (row) => user?.role === "teamLeader" && row.createdById !== user.id,
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

      {/* Modals */}

      <ProjectFormModal
        open={addOpen}
        mode="add"
        projectId={null}
        onClose={() => setAddOpen(false)}
        onSuccess={() => {
          setAddOpen(false);
          load();
        }}
      />

      <ProjectFormModal
        open={editOpen}
        mode="edit"
        projectId={editId}
        onClose={() => {
          setEditOpen(false);
          setEditId(null);
        }}
        onSuccess={() => {
          setEditOpen(false);
          setEditId(null);
          load();
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Project"
        message="Are you sure you want to delete this project? (Soft delete)"
        confirmText="Delete"
        cancelText="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteId(null);
        }}
      />

      <ConfirmDialog
        open={successOpen}
        title="Success"
        message={successMsg}
        mode="Success"
        onConfirm={() => setSuccessOpen(false)}
        onCancel={() => setSuccessOpen(false)}
      />

      <ConfirmDialog
        open={errorOpen}
        title="Error"
        message={errorMsg}
        onConfirm={() => setErrorOpen(false)}
        onCancel={() => setErrorOpen(false)}
      />
    </div>
  );
};

export default ProjectsAdmin;
