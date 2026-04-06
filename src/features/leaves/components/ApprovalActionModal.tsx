import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";

type Props = {
  open: boolean;
  action: "approve" | "reject";
  onClose: () => void;
  onSubmit: (remarks: string) => Promise<void> | void;
};

export default function ApprovalActionModal({ open, action, onClose, onSubmit }: Props) {
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await onSubmit(remarks.trim());
      setRemarks("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={action === "approve" ? "Approve Leave Request" : "Reject Leave Request"}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={action === "approve" ? "primary" : "danger"} onClick={submit} isLoading={loading}>
            {action === "approve" ? "Approve" : "Reject"}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          {action === "approve"
            ? "Add approval remarks if needed."
            : "Rejection remarks are recommended for clarity."}
        </p>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          placeholder="Enter remarks"
        />
      </div>
    </Modal>
  );
}
