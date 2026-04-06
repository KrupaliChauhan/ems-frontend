import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import DatePicker from "../../../components/ui/DatePicker";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import type { LeaveBalanceItem, LeaveHolidayItem, LeaveTypeItem } from "../services/leaveService";

type Props = {
  open: boolean;
  leaveTypes: LeaveTypeItem[];
  balances: LeaveBalanceItem[];
  holidays: LeaveHolidayItem[];
  onClose: () => void;
  onSubmit: (payload: FormData) => Promise<void>;
};

type FormValues = {
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  dayUnit: "FULL" | "HALF";
  reason: string;
  attachment: FileList | null;
};

function calculateDays(
  fromDate: string,
  toDate: string,
  dayUnit: "FULL" | "HALF",
  holidayDateKeys: Set<string>
) {
  if (!fromDate || !toDate) return 0;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return 0;
  if (dayUnit === "HALF") {
    if (fromDate !== toDate) return 0;
    const dayOfWeek = from.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0;
    return holidayDateKeys.has(fromDate) ? 0 : 0.5;
  }

  let totalDays = 0;
  const current = new Date(from);

  while (current <= to) {
    const dayOfWeek = current.getDay();
    const dateKey = current.toISOString().slice(0, 10);
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDateKeys.has(dateKey)) {
      totalDays += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return totalDays;
}

export default function LeaveRequestFormModal({ open, leaveTypes, balances, holidays, onClose, onSubmit }: Props) {
  const [serverError, setServerError] = useState("");
  const {
    control,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      leaveTypeId: "",
      fromDate: "",
      toDate: "",
      dayUnit: "FULL",
      reason: "",
      attachment: null,
    },
  });

  useEffect(() => {
    if (open) {
      setServerError("");
      reset({
        leaveTypeId: "",
        fromDate: "",
        toDate: "",
        dayUnit: "FULL",
        reason: "",
        attachment: null,
      });
    }
  }, [open, reset]);

  const leaveTypeId = watch("leaveTypeId");
  const fromDate = watch("fromDate");
  const toDate = watch("toDate");
  const dayUnit = watch("dayUnit");

  const selectedType = useMemo(
    () => leaveTypes.find((item) => item.id === leaveTypeId) ?? null,
    [leaveTypeId, leaveTypes],
  );
  const selectedBalance = useMemo(
    () => balances.find((item) => item.leaveType.id === leaveTypeId) ?? null,
    [balances, leaveTypeId],
  );
  const holidayDateKeys = useMemo(
    () => new Set(holidays.filter((item) => item.isActive).map((item) => item.dateKey)),
    [holidays],
  );

  const totalDays = calculateDays(fromDate, toDate, dayUnit, holidayDateKeys);

  const submit = async (values: FormValues) => {
    setServerError("");
    const formData = new FormData();
    formData.append("leaveTypeId", values.leaveTypeId);
    formData.append("fromDate", values.fromDate);
    formData.append("toDate", values.toDate);
    formData.append("dayUnit", values.dayUnit);
    formData.append("reason", values.reason.trim());
    if (values.attachment?.[0]) {
      formData.append("attachment", values.attachment[0]);
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to apply leave");
    }
  };

  return (
    <Modal
      open={open}
      title="Apply Leave"
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="leave-apply-form" isLoading={isSubmitting}>
            Submit Leave
          </Button>
        </div>
      }
    >
      <form id="leave-apply-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        {serverError ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{serverError}</p> : null}
        <FormRequiredNote />

        <Controller
          name="leaveTypeId"
          control={control}
          rules={{ required: "Leave type is required" }}
          render={({ field }) => (
            <SelectDropdown
              label="Leave Type"
              required
              value={field.value}
              onChange={field.onChange}
              error={errors.leaveTypeId?.message}
              options={leaveTypes.map((item) => ({
                label: `${item.name} (${item.code})`,
                value: item.id,
              }))}
            />
          )}
        />

        {selectedType ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex flex-wrap gap-3">
              <span>Remaining: <b>{selectedBalance?.remaining ?? 0}</b></span>
              <span>Max / Request: <b>{selectedType.maxDaysPerRequest}</b></span>
              <span>Notice: <b>{selectedType.minNoticeDays} day(s)</b></span>
              <span>Attachment: <b>{selectedType.requiresAttachment ? "Required" : "Optional"}</b></span>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="fromDate"
            control={control}
            rules={{ required: "From date is required" }}
            render={({ field }) => (
              <DatePicker label="From Date" required value={field.value} onChange={field.onChange} error={errors.fromDate?.message} />
            )}
          />
          <Controller
            name="toDate"
            control={control}
            rules={{ required: "To date is required" }}
            render={({ field }) => (
              <DatePicker label="To Date" required value={field.value} onChange={field.onChange} error={errors.toDate?.message} />
            )}
          />
          <Controller
            name="dayUnit"
            control={control}
            render={({ field }) => (
              <SelectDropdown
                label="Day Unit"
                value={field.value}
                onChange={(value) => field.onChange(value as "FULL" | "HALF")}
                options={[
                  { label: "Full Day", value: "FULL" },
                  { label: "Half Day", value: "HALF" },
                ]}
              />
            )}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Calculated Leave Days</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalDays}</p>
          <p className="mt-2 text-xs text-slate-500">Weekends and active holidays are excluded from the count.</p>
        </div>

        <Controller
          name="reason"
          control={control}
          rules={{ required: "Reason is required", minLength: { value: 5, message: "Minimum 5 characters required" } }}
          render={({ field }) => (
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-slate-900">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              />
              {errors.reason?.message ? <p className="mt-1.5 text-sm text-red-600">{errors.reason.message}</p> : null}
            </div>
          )}
        />

        <Controller
          name="attachment"
          control={control}
          render={({ field }) => (
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-slate-900">Attachment</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={(e) => field.onChange(e.target.files)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <p className="mt-1.5 text-xs text-slate-500">Allowed: PDF, PNG, JPG, JPEG, DOC, DOCX up to 5MB.</p>
            </div>
          )}
        />
      </form>
    </Modal>
  );
}
