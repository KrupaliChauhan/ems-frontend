import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils/date";
import type { AssetItem } from "../services/assetService";

type Props = {
  open: boolean;
  asset: AssetItem | null;
  onClose: () => void;
};

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-slate-800">{value || "-"}</p>
    </div>
  );
}

export default function AssetViewModal({ open, asset, onClose }: Props) {
  const allocatedTo = asset?.currentAllocation?.employeeId?.name || "-";
  const cost =
    typeof asset?.cost === "number"
      ? asset.cost.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        })
      : "-";

  return (
    <Modal open={open} title="Asset Details" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="Asset Code" value={asset?.assetCode || "-"} />
          <DetailRow label="Asset Name" value={asset?.name || "-"} />
          <DetailRow label="Category" value={asset?.category || "-"} />
          <DetailRow label="Status" value={asset?.status || "-"} />
          <DetailRow label="Allocated To" value={allocatedTo} />
          <DetailRow label="Serial Number" value={asset?.serialNo || "-"} />
          <DetailRow label="Brand" value={asset?.brand || "-"} />
          <DetailRow label="Model" value={asset?.model || "-"} />
          <DetailRow
            label="Purchase Date"
            value={formatDate(asset?.purchaseDate)}
          />
          <DetailRow
            label="Warranty End Date"
            value={formatDate(asset?.warrantyEndDate)}
          />
          <DetailRow label="Cost" value={cost} />
        </div>
      </div>
    </Modal>
  );
}
