import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { InputField } from "../../../components/ui/InputField";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import type {
  LeaveApproverRole,
  LeaveApprovalFlowStep,
  LeaveTypeItem,
  LeaveTypePayload
} from "../services/leaveService";

type Props = {
  open: boolean;
  mode: "add" | "edit";
  initial?: LeaveTypeItem | null;
  onClose: () => void;
  onSave: (payload: LeaveTypePayload) => Promise<void> | void;
};

type FormValues = LeaveTypePayload;

const approverRoleOptions: Array<{ label: string; value: LeaveApproverRole }> = [
  { label: "HR", value: "HR" },
  { label: "Team Leader", value: "teamLeader" },
  { label: "Admin", value: "admin" },
  { label: "Super Admin", value: "superadmin" }
];

const defaultValues: FormValues = {
  name: "",
  code: "",
  description: "",
  color: "#2563eb",
  totalAllocation: 12,
  allocationPeriod: "yearly",
  carryForwardEnabled: false,
  maxCarryForwardLimit: 0,
  accrualEnabled: false,
  accrualAmount: 0,
  accrualFrequency: "monthly",
  approvalWorkflowType: "single_level",
  approvalFlowSteps: [{ level: 1, role: "admin" }],
  maxDaysPerRequest: 5,
  minNoticeDays: 0,
  allowPastDates: false,
  requiresAttachment: false,
  status: "Active"
};

function normalizeApprovalSteps(
  workflowType: FormValues["approvalWorkflowType"],
  steps?: LeaveApprovalFlowStep[]
): LeaveApprovalFlowStep[] {
  const normalized = (steps || [])
    .filter((item) => !!item?.role)
    .sort((left, right) => (left.level ?? 0) - (right.level ?? 0))
    .map((item, index) => ({
      level: index + 1,
      role: item.role
    }));

  if (workflowType === "single_level") {
    return [{ level: 1, role: normalized[0]?.role || "admin" }];
  }

  if (normalized.length >= 2) {
    return normalized;
  }

  return [
    { level: 1, role: normalized[0]?.role || "HR" },
    { level: 2, role: normalized[1]?.role || "admin" }
  ];
}

function normalizeInitialValues(initial?: LeaveTypeItem | null): FormValues {
  if (!initial) {
    return defaultValues;
  }

  const workflowType =
    initial.approvalWorkflowType === "single_level" ? "single_level" : "multi_level";

  return {
    ...initial,
    approvalWorkflowType: workflowType,
    approvalFlowSteps: normalizeApprovalSteps(workflowType, initial.approvalFlowSteps)
  };
}

export default function LeaveTypeModal({ open, mode, initial, onClose, onSave }: Props) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    defaultValues,
    mode: "onChange"
  });

  const carryForwardEnabled = watch("carryForwardEnabled");
  const accrualEnabled = watch("accrualEnabled");
  const approvalWorkflowType = watch("approvalWorkflowType");
  const approvalFlowSteps = watch("approvalFlowSteps");

  useEffect(() => {
    if (!open) return;
    reset(normalizeInitialValues(initial));
  }, [open, initial, reset]);

  useEffect(() => {
    if (!open) return;
    setValue("approvalFlowSteps", normalizeApprovalSteps(approvalWorkflowType, approvalFlowSteps), {
      shouldDirty: false
    });
  }, [approvalWorkflowType, open, setValue]);

  const setFlowSteps = (steps: LeaveApprovalFlowStep[]) => {
    setValue("approvalFlowSteps", normalizeApprovalSteps(approvalWorkflowType, steps), {
      shouldDirty: true,
      shouldValidate: true
    });
  };

  const updateSingleApprover = (role: string) => {
    setFlowSteps([{ level: 1, role: role as LeaveApproverRole }]);
  };

  const updateMultiApprover = (index: number, role: string) => {
    const next = approvalFlowSteps.map((item, itemIndex) =>
      itemIndex === index ? { ...item, role: role as LeaveApproverRole } : item
    );
    setFlowSteps(next);
  };

  const addApprovalStep = () => {
    setFlowSteps([...approvalFlowSteps, { level: approvalFlowSteps.length + 1, role: "admin" }]);
  };

  const removeApprovalStep = (index: number) => {
    setFlowSteps(approvalFlowSteps.filter((_, itemIndex) => itemIndex !== index));
  };

  const submit = async (values: FormValues) => {
    await onSave({
      ...values,
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      description: values.description.trim(),
      approvalFlowSteps: normalizeApprovalSteps(values.approvalWorkflowType, values.approvalFlowSteps)
    });
  };

  return (
    <Modal
      open={open}
      title={mode === "add" ? "Add Leave Type" : "Edit Leave Type"}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="leave-type-form" isLoading={isSubmitting}>
            {mode === "add" ? "Create" : "Update"}
          </Button>
        </div>
      }
    >
      <form id="leave-type-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Controller
            name="name"
            control={control}
            rules={{ required: "Leave name is required" }}
            render={({ field }) => (
              <InputField label="Leave Name" value={field.value} onChange={field.onChange} error={errors.name?.message} />
            )}
          />
          <Controller
            name="code"
            control={control}
            rules={{ required: "Code is required" }}
            render={({ field }) => (
              <InputField label="Code / Short Name" value={field.value} onChange={field.onChange} error={errors.code?.message} />
            )}
          />
        </div>

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-slate-900">Description</label>
              <textarea
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="min-h-[90px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-slate-900">Badge Color</label>
                <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3">
                  <input type="color" value={field.value} onChange={(e) => field.onChange(e.target.value)} className="h-7 w-10 rounded border-0 bg-transparent p-0" />
                  <span className="text-sm text-slate-600">{field.value}</span>
                </div>
              </div>
            )}
          />
          <Controller
            name="totalAllocation"
            control={control}
            rules={{ required: "Allocation required", min: { value: 0, message: "Minimum 0" } }}
            render={({ field }) => (
              <InputField
                label="Total Allocation"
                type="number"
                value={String(field.value ?? 0)}
                onChange={(value) => field.onChange(Number(value))}
                error={errors.totalAllocation?.message}
              />
            )}
          />
          <Controller
            name="maxDaysPerRequest"
            control={control}
            rules={{ required: "Max days required", min: { value: 0.5, message: "Minimum 0.5" } }}
            render={({ field }) => (
              <InputField
                label="Max Days / Request"
                type="number"
                value={String(field.value ?? 0)}
                onChange={(value) => field.onChange(Number(value))}
                error={errors.maxDaysPerRequest?.message}
              />
            )}
          />
          <Controller
            name="minNoticeDays"
            control={control}
            render={({ field }) => (
              <InputField
                label="Min Notice Days"
                type="number"
                value={String(field.value ?? 0)}
                onChange={(value) => field.onChange(Number(value))}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Controller
            name="allocationPeriod"
            control={control}
            render={({ field }) => (
              <SelectDropdown
                label="Allocation Period"
                value={field.value}
                onChange={(value) => field.onChange(value as FormValues["allocationPeriod"])}
                options={[
                  { label: "Yearly", value: "yearly" },
                  { label: "Monthly", value: "monthly" }
                ]}
              />
            )}
          />
          <Controller
            name="approvalWorkflowType"
            control={control}
            render={({ field }) => (
              <SelectDropdown
                label="Approval Workflow"
                value={field.value}
                onChange={(value) => field.onChange(value as FormValues["approvalWorkflowType"])}
                options={[
                  { label: "Single Level", value: "single_level" },
                  { label: "Multi Level", value: "multi_level" }
                ]}
              />
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <SelectDropdown
                label="Status"
                value={field.value}
                onChange={(value) => field.onChange(value as FormValues["status"])}
                options={[
                  { label: "Active", value: "Active" },
                  { label: "Inactive", value: "Inactive" }
                ]}
              />
            )}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Approval Flow Setup</p>
              <p className="mt-1 text-sm text-slate-500">
                {approvalWorkflowType === "single_level"
                  ? "Choose the one role that will approve this leave type."
                  : "Define the exact sequence this leave request will follow."}
              </p>
            </div>
            {approvalWorkflowType === "multi_level" ? (
              <Button type="button" variant="outline" size="sm" onClick={addApprovalStep}>
                Add Step
              </Button>
            ) : null}
          </div>

          {approvalWorkflowType === "single_level" ? (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <SelectDropdown
                label="Approver Role"
                value={approvalFlowSteps[0]?.role || "admin"}
                onChange={updateSingleApprover}
                options={approverRoleOptions}
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {approvalFlowSteps.map((step, index) => (
                <div key={`approval-step-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-end">
                    <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Step</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{index + 1}</p>
                    </div>
                    <SelectDropdown
                      label="Approver Role"
                      value={step.role}
                      onChange={(value) => updateMultiApprover(index, value)}
                      options={approverRoleOptions}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeApprovalStep(index)}
                      disabled={approvalFlowSteps.length <= 2}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Flow Preview</p>
            <p className="mt-2 text-sm font-medium text-slate-700">
              Employee
              {normalizeApprovalSteps(approvalWorkflowType, approvalFlowSteps).map((step) => {
                const option = approverRoleOptions.find((item) => item.value === step.role);
                return ` -> ${option?.label || step.role}`;
              }).join("")}
            </p>
            {errors.approvalFlowSteps?.message ? (
              <p className="mt-2 text-sm text-rose-600">{errors.approvalFlowSteps.message}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              name="carryForwardEnabled"
              control={control}
              render={({ field }) => (
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">Carry Forward Enabled</span>
                  <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                </label>
              )}
            />
            <Controller
              name="accrualEnabled"
              control={control}
              render={({ field }) => (
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">Monthly Accrual Enabled</span>
                  <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                </label>
              )}
            />
            <Controller
              name="allowPastDates"
              control={control}
              render={({ field }) => (
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">Allow Past Date Apply</span>
                  <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                </label>
              )}
            />
            <Controller
              name="requiresAttachment"
              control={control}
              render={({ field }) => (
                <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm font-medium text-slate-800">Attachment Required</span>
                  <input type="checkbox" checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                </label>
              )}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Controller
              name="maxCarryForwardLimit"
              control={control}
              render={({ field }) => (
                <InputField
                  label="Max Carry Forward"
                  type="number"
                  disabled={!carryForwardEnabled}
                  value={String(field.value ?? 0)}
                  onChange={(value) => field.onChange(Number(value))}
                />
              )}
            />
            <Controller
              name="accrualAmount"
              control={control}
              render={({ field }) => (
                <InputField
                  label="Accrual Amount"
                  type="number"
                  disabled={!accrualEnabled}
                  value={String(field.value ?? 0)}
                  onChange={(value) => field.onChange(Number(value))}
                />
              )}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
