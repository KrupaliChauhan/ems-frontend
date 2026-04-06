import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import DatePicker from "../../../components/ui/DatePicker";
import { InputField } from "../../../components/ui/InputField";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import type { AssetItem, AllocateAssetPayload } from "../services/assetService";
import { allocateAsset } from "../services/assetService";
import { fetchActiveUsers } from "../../users/services/userService";
import type { UserItem } from "../../users/services/userService";

type FormValues = {
  employeeId: string;
  allocatedOn: string;
  expectedReturnOn: string;
  notes: string;
};

type Props = {
  open: boolean;
  asset: AssetItem | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

export default function AssetAllocateModal({
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
      employeeId: "",
      allocatedOn: new Date().toISOString().slice(0, 10),
      expectedReturnOn: "",
      notes: "",
    },
    mode: "onChange",
  });

  const [users, setUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    if (!open) return;

    reset({
      employeeId: "",
      allocatedOn: new Date().toISOString().slice(0, 10),
      expectedReturnOn: "",
      notes: "",
    });

    (async () => {
      try {
        const res = await fetchActiveUsers();
        setUsers((res.items || []) as UserItem[]);
      } catch {
        setUsers([]);
      }
    })();
  }, [open, reset, setUsers]);

  const userOptions = useMemo(
    () =>
      (users || []).map((u) => ({
        label: `${u.name} (${u.email})`,
        value: u._id,
      })),
    [users],
  );

  const submit = async (data: FormValues) => {
    if (!asset?._id) return;
    const payload: AllocateAssetPayload = {
      employeeId: data.employeeId,
      allocatedOn: data.allocatedOn,
      expectedReturnOn: data.expectedReturnOn || undefined,
      notes: data.notes?.trim() || undefined,
    };

    await allocateAsset(asset._id, payload);
    await onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      title={`Allocate Asset${asset?.assetCode ? ` • ${asset.assetCode}` : ""}`}
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
            form="asset-allocate-form"
            isLoading={isSubmitting}
          >
            Allocate
          </Button>
        </div>
      }
    >
      <form
        id="asset-allocate-form"
        onSubmit={handleSubmit(submit)}
        className="space-y-4"
      >
        <FormRequiredNote />

        <Controller
          name="employeeId"
          control={control}
          rules={{ required: "User is required" }}
          render={({ field }) => (
            <SelectDropdown
              label="Allocate To"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.employeeId?.message}
              placeholder="Select user"
              options={userOptions}
            />
          )}
        />

        <Controller
          name="allocatedOn"
          control={control}
          rules={{ required: "Allocated date is required" }}
          render={({ field }) => (
            <DatePicker
              label="Allocated On"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.allocatedOn?.message}
              max={new Date().toISOString().slice(0, 10)}
            />
          )}
        />

        <Controller
          name="expectedReturnOn"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Expected Return (optional)"
              value={field.value}
              onChange={field.onChange}
              error={errors.expectedReturnOn?.message}
              min={new Date().toISOString().slice(0, 10)}
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
