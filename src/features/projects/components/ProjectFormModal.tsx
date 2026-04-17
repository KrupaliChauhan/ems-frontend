import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../../components/ui/Modal";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import { InputField } from "../../../components/ui/InputField";
import DatePicker from "../../../components/ui/DatePicker";
import SelectDropdown from "../../../components/ui/SelectDropdown";

import { fetchProjectAssignableEmployees, type UserItem } from "../../users/services/userService";
import {
  createProject,
  getProjectById,
  updateProject,
  type ProjectPayload,
  type ProjectStatus,
} from "../services/projectService";

type Props = {
  open: boolean;
  mode: "add" | "edit";
  projectId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

const ProjectFormModal = ({
  open,
  mode,
  projectId,
  onClose,
  onSuccess,
}: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<UserItem[]>([]);
  const members = useMemo(
    () =>
      users
        .filter(
          (u) =>
            (u.role === "employee" || u.role === "teamLeader") &&
            u.status !== "Inactive" &&
            !u.isDeleted,
        )
        .map((u) => ({
          value: u._id,
          label: `${u.name} (${u.email}) - ${u.role === "teamLeader" ? "Team Leader" : "Employee"}`,
        })),
    [users],
  );

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD
  const [status, setStatus] = useState<ProjectStatus>("pending");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const reset = () => {
    setName("");
    setDescription("");
    setTimeLimit("");
    setStartDate("");
    setStatus("pending");
    setSelectedEmployees([]);
    setErrors({});
  };

  const loadUsers = async () => {
    try {
      const res = await fetchProjectAssignableEmployees();
      setUsers(res.items);
    } catch (e: unknown) {
      let message = "Failed to load employees";
      if (e instanceof Error) {
        message = e.message;
      } else if (typeof e === "string") {
        message = e;
      }
      setErrorMsg(message);
      setErrorOpen(true);
    }
  };

  /*const loadProject = async () => {
    if (mode !== "edit" || !projectId) return;
    setLoading(true);
    try {
      const p = await getProjectById(projectId);
      setName(p.name);
      setDescription(p.description);
      setTimeLimit(p.timeLimit);
      setStartDate(p.startDate ? String(p.startDate).slice(0, 10) : "");
      setStatus(p.status);
      setSelectedEmployees(p.employees.map((e) => e._id));
    } catch (e: unknown) {
        let message="Failed to load project"
        if(e instanceof Error){
            message=e.message
        }
        else if(typeof e==="string"){
            message=e
        }
      setErrorMsg(message);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };*/
  const loadProject = async () => {
    if (mode !== "edit" || !projectId) return;

    setLoading(true);
    try {
      const p = await getProjectById(projectId);

      setName(p.name ?? "");
      setDescription(p.description ?? "");
      setTimeLimit(p.timeLimit ?? "");

      setStartDate(p.startDate ? String(p.startDate).slice(0, 10) : "");

      setStatus(p.status ?? "pending");

      setSelectedEmployees(
        Array.isArray(p.members) ? p.members.map((member) => member._id) : [],
      );
    } catch (e: unknown) {
      let message = "Failed to load project";
      if (e instanceof Error) message = e.message;
      else if (typeof e === "string") message = e;

      setErrorMsg(message);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!open) return;
    // open -> load
    setErrors({});
    loadUsers();
    if (mode === "add") reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, projectId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Project name is required";
    if (description.trim().length < 5)
      e.description = "Description is required";
    if (!timeLimit.trim()) e.timeLimit = "Time limit is required";
    if (!startDate) e.startDate = "Start date is required";
    if (!selectedEmployees.length) e.employees = "Select at least 1 project member";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    const payload: ProjectPayload = {
      name: name.trim(),
      description: description.trim(),
      timeLimit: timeLimit.trim(),
      startDate,
      status,
      members: selectedEmployees,
    };

    setLoading(true);
    try {
      if (mode === "add") {
        await createProject(payload);
      } else {
        if (!projectId) throw new Error("Missing project id");
        await updateProject(projectId, payload);
      }
      onSuccess();
      if (mode === "add") {
        navigate("/projects");
      }
    } catch (e: unknown) {
      let message = "Save failed";
      if (e instanceof Error) {
        message = e.message;
      } else if (typeof e === "string") {
        message = e;
      }
      setErrorMsg(message);
      setErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm"
        disabled={loading}
      >
        Cancel
      </button>
      <button
        onClick={submit}
        className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Saving..." : mode === "add" ? "Create" : "Update"}
      </button>
    </div>
  );

  return (
    <>
      <Modal
        open={open}
        title={mode === "add" ? "Add Project" : "Edit Project"}
        onClose={onClose}
        footer={footer}
        size="lg"
      >
        <div className="space-y-4">
          <FormRequiredNote />
          <InputField
            label="Project Name"
            required
            value={name}
            onChange={setName}
            placeholder="Enter project name"
            error={errors.name}
          />

          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-slate-900">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full min-h-[100px] rounded-lg border bg-white px-3 py-2 text-sm outline-none ${
                errors.description
                  ? "border-red-300 focus:ring-2 focus:ring-red-200"
                  : "border-slate-200 focus:ring-2 focus:ring-slate-200"
              }`}
              placeholder="Enter project description"
            />
            {errors.description ? (
              <p className="mt-1.5 text-sm text-red-600">
                {errors.description}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Time Limit"
              required
              value={timeLimit}
              onChange={setTimeLimit}
              placeholder="e.g. 3 months / 30 days"
              error={errors.timeLimit}
            />

            <DatePicker
              label="Start Date"
              required
              value={startDate}
              onChange={setStartDate}
              error={errors.startDate}
            />
          </div>

          <SelectDropdown
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as ProjectStatus)}
            options={[
              { label: "Active", value: "active" },
              { label: "Pending", value: "pending" },
            ]}
          />

          {/* Multi select */}
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-slate-900">
              Project Members (Multi Select) <span className="text-red-500">*</span>
            </label>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="max-h-44 overflow-auto space-y-2">
                {members.length === 0 ? (
                  <p className="text-sm text-slate-500">No employees found</p>
                ) : (
                  members.map((opt) => {
                    const id = String(opt.value);
                    const checked = selectedEmployees.some(
                      (selectedId) => String(selectedId) === id,
                    );
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setSelectedEmployees((prev) => {
                              if (isChecked)
                                return Array.from(
                                  new Set([...prev, opt.value]),
                                );
                              return prev.filter((id) => id !== opt.value);
                            });
                          }}
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })
                )}
              </div>

              {errors.employees ? (
                <p className="mt-2 text-sm text-red-600">{errors.employees}</p>
              ) : null}

              {selectedEmployees.length ? (
                <p className="mt-2 text-xs text-slate-500">
                  Selected: {selectedEmployees.length}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={errorOpen}
        title="Error"
        message={errorMsg}
        onConfirm={() => setErrorOpen(false)}
        onCancel={() => setErrorOpen(false)}
      />
    </>
  );
};

export default ProjectFormModal;


