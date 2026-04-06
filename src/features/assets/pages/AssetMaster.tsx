import { useEffect, useMemo, useState } from "react";
import DataTable from "../../../components/table/DataTable";
import type { Column, Action } from "../../../components/table/DataTable";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

import type {
  AssetAllocationItem,
  AssetItem,
  AssetStatus,
} from "../services/assetService";
import {
  deleteAsset,
  getAssets,
  createAsset,
  updateAsset,
  getAssetHistory,
} from "../services/assetService";

import AssetFormModal from "../components/AssetFormModal";
import AssetAllocateModal from "../components/AssetAllocateModal";
import AssetReturnModal from "../components/AssetReturnModal";
import AssetHistoryModal from "../components/AssetHistoryModal";
import AssetViewModal from "../components/AssetViewModal";
import Loader from "../../../components/ui/Loader";

type Row = {
  id: string;
  _id: string;
  assetCode: string;
  name: string;
  category: string;
  status: AssetStatus;
  allocatedTo: string;
};

function useDebouncedValue<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export default function AssetMaster() {
  const [items, setItems] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | AssetStatus>("");

  const debouncedQ = useDebouncedValue(q, 400);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<AssetItem | null>(null);
  const [viewing, setViewing] = useState<AssetItem | null>(null);

  const [openAllocate, setOpenAllocate] = useState(false);
  const [allocateItem, setAllocateItem] = useState<AssetItem | null>(null);

  const [openReturn, setOpenReturn] = useState(false);
  const [returnItem, setReturnItem] = useState<AssetItem | null>(null);

  const [openHistory, setOpenHistory] = useState(false);
  const [historyItem, setHistoryItem] = useState<AssetItem | null>(null);
  const [history, setHistory] = useState<AssetAllocationItem[]>([]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssetItem | null>(null);

  const assetStatuses: AssetStatus[] = [
    "IN_STOCK",
    "ALLOCATED",
    "REPAIR",
    "RETIRED",
    "LOST",
  ];

  const isAssetStatus = (v: string): v is AssetStatus =>
    (assetStatuses as readonly string[]).includes(v);

  const load = async (
    p = page,
    l = limit,
    query: string = debouncedQ,
    st: "" | AssetStatus = status,
  ) => {
    setLoading(true);
    setError("");
    try {
      const res = await getAssets({
        page: p,
        limit: l,
        q: query || undefined,
        status: st || undefined,
      });

      setItems(res.items || []);
      setTotal(res.total || 0);
      setPage(res.page || p);
      setLimit(res.limit || l);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update status";
      setError(msg || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, limit, debouncedQ, status);
  }, [page, limit, debouncedQ, status]);

  const rows: Row[] = useMemo(() => {
    return (items || []).map((a) => {
      const ca = a.currentAllocation;
      const allocatedTo = ca?.employeeId?.name || "-";
      return {
        id: a._id,
        _id: a._id,
        assetCode: a.assetCode,
        name: a.name,
        category: a.category || "-",
        status: a.status,
        allocatedTo,
      };
    });
  }, [items]);

  const columns: Column<Row>[] = [
    { key: "assetCode", label: "Asset Code" },
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "allocatedTo", label: "Allocated To" },
    { key: "status", label: "Status" },
  ];

  const actions: Action<Row>[] = [
    {
      label: "View",
      onClick: (r) => {
        const found = items.find((x) => x._id === r._id) || null;
        setViewing(found);
      },
    },
    {
      label: "Edit",
      onClick: (r) => {
        const found = items.find((x) => x._id === r._id) || null;
        setEditing(found);
        setOpenForm(true);
      },
    },
    {
      label: "Allocate",
      hidden: (r) => {
        const found = items.find((x) => x._id === r._id) || null;
        return !!found?.currentAllocation && !found.currentAllocation.returnedOn;
      },
      onClick: (r) => {
        const found = items.find((x) => x._id === r._id) || null;
        if (found?.currentAllocation && !found.currentAllocation.returnedOn) {
          setError("Asset is currently allocated. Return it first before reallocating.");
          setReturnItem(found);
          setOpenReturn(true);
          return;
        }
        setAllocateItem(found);
        setOpenAllocate(true);
      },
    },
    {
      label: "Return",
      hidden: (r) => {
        const found = items.find((x) => x._id === r._id) || null;
        return !found?.currentAllocation || !!found.currentAllocation.returnedOn;
      },
      onClick: (r) => {
        const found = items.find((x) => x._id === r._id) || null;
        setReturnItem(found);
        setOpenReturn(true);
      },
    },
    {
      label: "History",
      onClick: async (r) => {
        const found = items.find((x) => x._id === r._id) || null;
        setHistoryItem(found);
        setOpenHistory(true);

        try {
          const res = await getAssetHistory(r._id);
          setHistory(res.items || []);
        } catch {
          setHistory([]);
        }
      },
    },
    {
      label: "Delete",
      onClick: (r) => {
        const found = items.find((x) => x._id === r._id) || null;
        setDeleteTarget(found);
        setConfirmOpen(true);
      },
    },
  ];

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteAsset(deleteTarget._id);
      setConfirmOpen(false);
      setDeleteTarget(null);
      await load(page, limit, debouncedQ, status);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      setConfirmOpen(false);
      setDeleteTarget(null);
      setError(msg || "Delete failed");
    }
  };

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setPage(1);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Asset Master</h1>
          <p className="text-sm text-slate-500">
            Assets list, allocation, return & history
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex w-full flex-col gap-3 md:flex-row xl:max-w-4xl">
          <div className="md:min-w-[320px] md:flex-1 xl:max-w-[360px]">
            <label className="text-sm font-medium text-slate-700">Search</label>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by code, name, category..."
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="md:w-56">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => {
                const v = e.target.value;
                setStatus(v === "" ? "" : isAssetStatus(v) ? v : "");
                setPage(1);
              }}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Status</option>
              <option value="IN_STOCK">IN_STOCK</option>
              <option value="ALLOCATED">ALLOCATED</option>
              <option value="REPAIR">REPAIR</option>
              <option value="RETIRED">RETIRED</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          + Add Asset
        </Button>
      </div>
      <div className="relative">
        {loading ? (
          <Loader
            variant="overlay"
            size="md"
            label="Loading assets..."
            className="mb-3"
          />
        ) : null}
        {error ? (
          <div className="text-sm text-red-600 mb-3">{error}</div>
        ) : null}

        <DataTable
          columns={columns}
          data={rows}
          actions={actions}
          compact
          serverPagination={{
            enabled: true,
            page,
            limit,
            total,
            onPageChange: setPage,
            onLimitChange: setLimit,
          }}
        />
      </div>
      <AssetFormModal
        open={openForm}
        title={editing ? "Edit Asset" : "Add Asset"}
        initial={editing}
        onClose={() => setOpenForm(false)}
        onSave={async (payload) => {
          if (editing?._id) await updateAsset(editing._id, payload);
          else await createAsset(payload);
          await load(page, limit, debouncedQ, status);
        }}
      />

      <AssetViewModal
        open={!!viewing}
        asset={viewing}
        onClose={() => setViewing(null)}
      />

      <AssetAllocateModal
        open={openAllocate}
        asset={allocateItem}
        onClose={() => setOpenAllocate(false)}
        onSaved={async () => load(page, limit, debouncedQ, status)}
      />

      <AssetReturnModal
        open={openReturn}
        asset={returnItem}
        onClose={() => setOpenReturn(false)}
        onSaved={async () => load(page, limit, debouncedQ, status)}
      />

      <AssetHistoryModal
        open={openHistory}
        asset={historyItem}
        items={history}
        onClose={() => setOpenHistory(false)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Asset"
        message="Are you sure you want to delete this asset?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
