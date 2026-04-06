import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import { formatDate } from "../../../utils/date";
import type { AssetAllocationItem, AssetItem } from "../services/assetService";

type Props = {
  open: boolean;
  asset: AssetItem | null;
  items: AssetAllocationItem[];
  onClose: () => void;
};

export default function AssetHistoryModal({
  open,
  asset,
  items,
  onClose,
}: Props) {
  return (
    <Modal
      open={open}
      title={`Asset History${asset?.assetCode ? ` • ${asset.assetCode}` : ""}`}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        {items?.length ? (
          items.map((h: AssetAllocationItem) => {
            const allocatedTo = h?.employeeId?.name || "-";
            const allocatedOn = h?.allocatedOn
              ? formatDate(h.allocatedOn)
              : "-";
            const returnedOn = h?.returnedOn
              ? formatDate(h.returnedOn)
              : "Not returned";

            return (
              <div
                key={h._id}
                className="rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">
                    {allocatedTo}
                  </div>
                  <div className="text-xs text-slate-600">
                    {allocatedOn} → {returnedOn}
                  </div>
                </div>
                {h.returnCondition || h.notes ? (
                  <div className="mt-1 text-xs text-slate-600">
                    {h.returnCondition ? `Condition: ${h.returnCondition}` : ""}
                    {h.returnCondition && h.notes ? " • " : ""}
                    {h.notes ? `Notes: ${h.notes}` : ""}
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="text-sm text-slate-600">No history found.</div>
        )}
      </div>
    </Modal>
  );
}
