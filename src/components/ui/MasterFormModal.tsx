import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";

import Modal from "./Modal";
import Button from "./Button";
import { InputField } from "./InputField";
import SelectDropdown from "./SelectDropdown";
import FormRequiredNote from "./FormRequiredNote";

type MasterFormModalProps = {
  open: boolean;
  title: string;
  initialName: string;
  initialStatus?: "Active" | "Inactive";
  onClose: () => void;
  onSave: (payload: { name: string; status: "Active" | "Inactive" }) => void;
};

type FormValues = {
  name: string;
  status: "Active" | "Inactive";
};

const MasterFormModal = ({
  open,
  title,
  initialName,
  initialStatus = "Active",
  onClose,
  onSave,
}: MasterFormModalProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: initialName,
      status: initialStatus,
    },
  });

  // edit mode reset
  useEffect(() => {
    if (open) {
      reset({
        name: initialName,
        status: initialStatus,
      });
    }
  }, [open, initialName, initialStatus, reset]);

  const submit = (data: FormValues) => {
    const trimmed = data.name.trim();

    if (!trimmed) return;

    onSave({
      name: trimmed,
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
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="master-form"
          >
            Save
          </Button>
        </div>
      }
    >
      <form
        id="master-form"
        onSubmit={handleSubmit(submit)}
        className="space-y-4"
      >
        <FormRequiredNote />

        {/* Name Field */}
        <Controller
          name="name"
          control={control}
          rules={{
            required: "Name is required",
            minLength: {
              value: 2,
              message: "Minimum 2 characters required",
            },
          }}
          render={({ field }) => (
            <InputField
              label="Name"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.name?.message}
              placeholder="Enter name"
            />
          )}
        />

        {/* Status */}
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <SelectDropdown
              label="Status"
              value={field.value}
              onChange={(v) => field.onChange(v as "Active" | "Inactive")}
              options={[
                { label: "Active", value: "Active" },
                { label: "Inactive", value: "Inactive" },
              ]}
            />
          )}
        />
      </form>
    </Modal>
  );
};

export default MasterFormModal;
