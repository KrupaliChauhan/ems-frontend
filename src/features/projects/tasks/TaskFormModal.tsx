import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import { InputField } from "../../../components/ui/InputField";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import DatePicker from "../../../components/ui/DatePicker";
import type { ProjectEmployee } from "../services/projectService";
import type { TaskPriority, TaskItem } from "../../tasks/services/taskService";

type Props = {
  open: boolean;
  mode: "add" | "edit";
  members: ProjectEmployee[];
  initial?: TaskItem | null;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description: string;
    assignedTo: string;
    priority: TaskPriority;
    dueDate: string | null;
    estimatedHours: number | null;
  }) => Promise<void> | void;
};

const priorityOptions = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
  { label: "Critical", value: "Critical" },
];

export default function TaskFormModal({
  open,
  mode,
  members,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const membersOptions = useMemo(
    () =>
      (members || []).map((m) => ({
          label: `${m.name} (${m.email})`,
          value: m._id,
        })),
    [members],
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [estimatedHours, setEstimatedHours] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initial) {
      setTitle(initial.title ?? "");
      setDescription(initial.description ?? "");
      setAssignedTo(initial.assignedTo?._id ?? "");
      setPriority(initial.priority ?? "Medium");
      setDueDate(initial.dueDate ? String(initial.dueDate).slice(0, 10) : null);
      setEstimatedHours(
        initial.estimatedHours === null || initial.estimatedHours === undefined
          ? ""
          : String(initial.estimatedHours),
      );
    } else {
      setTitle("");
      setDescription("");
      setAssignedTo(membersOptions[0]?.value ?? "");
      setPriority("Medium");
      setDueDate(null);
      setEstimatedHours("");
    }
    setErrors({});
    setSubmitError("");
  }, [open, mode, initial, membersOptions]);

  const validate = (values?: {
    title?: string;
    assignedTo?: string;
    estimatedHours?: string;
  }) => {
    const nextTitle = (values?.title ?? title).trim();
    const nextAssignedTo = values?.assignedTo ?? assignedTo;
    const nextEstimatedHours = values?.estimatedHours ?? estimatedHours;
    const nextErrors: Record<string, string> = {};

    if (nextTitle.length < 2) {
      nextErrors.title = "Task title is required.";
    }
    if (!nextAssignedTo) {
      nextErrors.assignedTo = "Please select a team member.";
    }

    const hours = nextEstimatedHours.trim() === "" ? null : Number(nextEstimatedHours);
    if (nextEstimatedHours.trim() !== "" && (Number.isNaN(hours) || (hours ?? 0) < 0)) {
      nextErrors.estimatedHours = "Estimated hours must be a valid non-negative number.";
    }

    return nextErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    const t = title.trim();
    const hours = estimatedHours.trim() === "" ? null : Number(estimatedHours);

    setSubmitting(true);
    try {
      await onSubmit({
        title: t,
        description: description.trim(),
        assignedTo,
        priority,
        dueDate,
        estimatedHours: hours,
      });
      onClose();
    } catch {
      setSubmitError("Unable to save the task right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === "add" ? "New Task" : "Edit Task"}
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="task-form"
            isLoading={submitting}
          >
            {mode === "add" ? "Create" : "Save"}
          </Button>
        </div>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
        <FormRequiredNote />
        <InputField
          label="Title"
          required
          value={title}
          onChange={(value) => {
            setTitle(value);
            if (errors.title) {
              setErrors((current) => ({ ...current, title: validate({ title: value }).title || "" }));
            }
          }}
          placeholder="e.g. Integrate tasks API"
          error={errors.title}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-900">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            placeholder="Optional details..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectDropdown
            label="Assign To"
            required
            value={assignedTo}
            onChange={(value) => {
              setAssignedTo(value);
              if (errors.assignedTo) {
                setErrors((current) => ({ ...current, assignedTo: validate({ assignedTo: value }).assignedTo || "" }));
              }
            }}
            options={membersOptions}
            error={errors.assignedTo}
          />
          <SelectDropdown
            label="Priority"
            value={priority}
            onChange={(v) => setPriority(v as TaskPriority)}
            options={priorityOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Due Date"
            value={dueDate ?? ""}
            onChange={(v) => setDueDate(v ? v : null)}
          />
          <InputField
            label="Estimated Hours"
            value={estimatedHours}
            onChange={(value) => {
              setEstimatedHours(value);
              if (errors.estimatedHours) {
                setErrors((current) => ({
                  ...current,
                  estimatedHours: validate({ estimatedHours: value }).estimatedHours || ""
                }));
              }
            }}
            placeholder="e.g. 6"
            inputMode="decimal"
            error={errors.estimatedHours}
          />
        </div>

        {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      </form>
    </Modal>
  );
}
