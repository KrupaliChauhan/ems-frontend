import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { InputField } from "../../../components/ui/InputField";
import DatePicker from "../../../components/ui/DatePicker";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import type {
  AssetItem,
  AssetStatus,
  UpsertAssetPayload,
} from "../services/assetService";

type AssetFormValues = {
  assetCode: string;
  name: string;
  category: string;
  serialNo: string;
  brand: string;
  model: string;
  purchaseDate: string;
  warrantyEndDate: string;
  cost: string;
  status: AssetStatus;
};

type Props = {
  open: boolean;
  title: string;
  initial?: Partial<AssetItem> | null;
  onClose: () => void;
  onSave: (payload: UpsertAssetPayload) => Promise<void> | void;
};

export default function AssetFormModal({
  open,
  title,
  initial,
  onClose,
  onSave,
}: Props) {
  const formatDateValue = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    defaultValues: {
      assetCode: "",
      name: "",
      category: "",
      serialNo: "",
      brand: "",
      model: "",
      purchaseDate: "",
      warrantyEndDate: "",
      cost: "",
      status: "IN_STOCK",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;

    reset({
      assetCode: initial?.assetCode ?? "",
      name: initial?.name ?? "",
      category: initial?.category ?? "",
      serialNo: initial?.serialNo ?? "",
      brand: initial?.brand ?? "",
      model: initial?.model ?? "",
      purchaseDate: formatDateValue(initial?.purchaseDate),
      warrantyEndDate: formatDateValue(initial?.warrantyEndDate),
      cost: initial?.cost != null ? String(initial.cost) : "",
      status: (initial?.status as AssetStatus) ?? "IN_STOCK",
    });
  }, [open, initial, reset]);

  const statusOptions = [
    { label: "IN_STOCK", value: "IN_STOCK" },
    { label: "REPAIR", value: "REPAIR" },
    { label: "RETIRED", value: "RETIRED" },
    { label: "LOST", value: "LOST" },
  ];

  const submit = async (data: AssetFormValues) => {
    const parsedCost = data.cost.trim() === "" ? undefined : Number(data.cost);

    await onSave({
      assetCode: data.assetCode.trim(),
      name: data.name.trim(),
      category: data.category?.trim() || undefined,
      serialNo: data.serialNo?.trim() || undefined,
      brand: data.brand?.trim() || undefined,
      model: data.model?.trim() || undefined,
      purchaseDate: data.purchaseDate || undefined,
      warrantyEndDate: data.warrantyEndDate || undefined,
      cost: parsedCost,
      status: data.status,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      title={title}
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
          <Button type="submit" form="asset-form" isLoading={isSubmitting}>
            Save
          </Button>
        </div>
      }
    >
      <form
        id="asset-form"
        onSubmit={handleSubmit(submit)}
        className="space-y-4"
      >
        <FormRequiredNote />

        <Controller
          name="assetCode"
          control={control}
          rules={{ required: "Asset Code is required" }}
          render={({ field }) => (
            <InputField
              label="Asset Code"
              required
              placeholder="ASSET-001"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              error={errors.assetCode?.message}
            />
          )}
        />

        <Controller
          name="name"
          control={control}
          rules={{
            required: "Asset Name is required",
            minLength: { value: 2, message: "Min 2 chars" },
          }}
          render={({ field }) => (
            <InputField
              label="Asset Name"
              required
              placeholder="Laptop / Monitor / Phone"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              error={errors.name?.message}
            />
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <InputField
                label="Category"
                placeholder="IT / Furniture"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={errors.category?.message}
              />
            )}
          />

          <Controller
            name="serialNo"
            control={control}
            render={({ field }) => (
              <InputField
                label="Serial No"
                placeholder="Serial number"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={errors.serialNo?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Controller
            name="brand"
            control={control}
            render={({ field }) => (
              <InputField
                label="Brand"
                placeholder="Dell / HP"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={errors.brand?.message}
              />
            )}
          />

          <Controller
            name="model"
            control={control}
            render={({ field }) => (
              <InputField
                label="Model"
                placeholder="Inspiron / Elitebook"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={errors.model?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Controller
            name="purchaseDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Purchase Date"
                value={field.value}
                onChange={field.onChange}
                name={field.name}
                error={errors.purchaseDate?.message}
              />
            )}
          />

          <Controller
            name="warrantyEndDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                label="Warranty End Date"
                value={field.value}
                onChange={field.onChange}
                name={field.name}
                error={errors.warrantyEndDate?.message}
              />
            )}
          />
        </div>

        <Controller
          name="cost"
          control={control}
          rules={{
            validate: (value) => {
              if (value.trim() === "") return true;
              const numericValue = Number(value);
              if (Number.isNaN(numericValue)) return "Cost must be a valid number";
              if (numericValue < 0) return "Cost cannot be negative";
              return true;
            },
          }}
          render={({ field }) => (
            <InputField
              label="Cost"
              placeholder="Enter asset cost"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              error={errors.cost?.message}
            />
          )}
        />

        <Controller
          name="status"
          control={control}
          rules={{ required: "Status is required" }}
          render={({ field }) => (
            <SelectDropdown
              label="Status"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.status?.message}
              placeholder="Select status"
              options={statusOptions}
            />
          )}
        />
      </form>
    </Modal>
  );
}
