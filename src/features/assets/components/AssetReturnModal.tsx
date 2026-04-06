import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import DatePicker from "../../../components/ui/DatePicker";
import { InputField } from "../../../components/ui/InputField";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import type { AssetItem, ReturnAssetPayload } from "../services/assetService";
import { returnAsset } from "../services/assetService";

type FormValues = {
  returnedOn: string;
  returnCondition: string;
  notes: string;
};

type Props = {
  open: boolean;
  asset: AssetItem | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

export default function AssetReturnModal({
  open,
  asset,
  onClose,
  onSaved,
}: Props) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      returnedOn: new Date().toISOString().slice(0, 10),
      returnCondition: "",
      notes: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;
    reset({
      returnedOn: new Date().toISOString().slice(0, 10),
      returnCondition: "",
      notes: "",
    });
  }, [open, reset]);

  const submit = async (data: FormValues) => {
    if (!asset?._id) return;

    const payload: ReturnAssetPayload = {
      returnedOn: data.returnedOn,
      returnCondition: data.returnCondition?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };

    await returnAsset(asset._id, payload);
    await onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={`Return Asset${asset?.assetCode ? ` • ${asset.assetCode}` : ""}`}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="asset-return-form"
            isLoading={isSubmitting}
          >
            Return
          </Button>
        </div>
      }
    >
      <form
        id="asset-return-form"
        onSubmit={handleSubmit(submit)}
        className="space-y-4"
      >
        <FormRequiredNote />

        <Controller
          name="returnedOn"
          control={control}
          rules={{ required: "Return date is required" }}
          render={({ field }) => (
            <DatePicker
              label="Returned On"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.returnedOn?.message}
              max={new Date().toISOString().slice(0, 10)}
            />
          )}
        />

        <Controller
          name="returnCondition"
          control={control}
          render={({ field }) => (
            <InputField
              label="Condition (optional)"
              placeholder="Good / Damaged / etc"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <InputField
              label="Notes (optional)"
              placeholder="Any note..."
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </form>
    </Modal>
  );
}
