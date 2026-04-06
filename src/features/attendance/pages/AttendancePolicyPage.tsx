import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import { InputField } from "../../../components/ui/InputField";
import Loader from "../../../components/ui/Loader";
import { getSession, hasAccess } from "../../auth/services/auth";
import { getAttendancePolicy, updateAttendancePolicy, type AttendancePolicy } from "../services/attendanceService";

const weekdayOptions = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 }
];

type PolicyFormState = {
  officeStartTime: string;
  officeEndTime: string;
  graceMinutes: string;
  halfDayMinutes: string;
  fullDayMinutes: string;
  weeklyOffs: number[];
  multiplePunchAllowed: boolean;
  enableHolidayIntegration: boolean;
  enableLeaveIntegration: boolean;
};

function toFormState(policy: AttendancePolicy): PolicyFormState {
  return {
    officeStartTime: policy.officeStartTime,
    officeEndTime: policy.officeEndTime,
    graceMinutes: String(policy.graceMinutes),
    halfDayMinutes: String(policy.halfDayMinutes),
    fullDayMinutes: String(policy.fullDayMinutes),
    weeklyOffs: policy.weeklyOffs || [],
    multiplePunchAllowed: policy.multiplePunchAllowed,
    enableHolidayIntegration: policy.enableHolidayIntegration,
    enableLeaveIntegration: policy.enableLeaveIntegration
  };
}

export default function AttendancePolicyPage() {
  const { user } = getSession();
  const isAuthorized = hasAccess(user?.role, "attendancePolicy");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PolicyFormState>({
    officeStartTime: "09:30",
    officeEndTime: "18:30",
    graceMinutes: "15",
    halfDayMinutes: "240",
    fullDayMinutes: "480",
    weeklyOffs: [0],
    multiplePunchAllowed: true,
    enableHolidayIntegration: true,
    enableLeaveIntegration: true
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const policy = await getAttendancePolicy();
        setForm(toFormState(policy));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load attendance policy");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (!isAuthorized) {
    return <Navigate to="/attendance" replace />;
  }

  const toggleWeeklyOff = (day: number) => {
    setForm((prev) => ({
      ...prev,
      weeklyOffs: prev.weeklyOffs.includes(day)
        ? prev.weeklyOffs.filter((item) => item !== day)
        : [...prev.weeklyOffs, day].sort((a, b) => a - b)
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAttendancePolicy({
        officeStartTime: form.officeStartTime,
        officeEndTime: form.officeEndTime,
        graceMinutes: Number(form.graceMinutes),
        halfDayMinutes: Number(form.halfDayMinutes),
        fullDayMinutes: Number(form.fullDayMinutes),
        weeklyOffs: form.weeklyOffs,
        multiplePunchAllowed: form.multiplePunchAllowed,
        enableHolidayIntegration: form.enableHolidayIntegration,
        enableLeaveIntegration: form.enableLeaveIntegration
      });
      setSuccess("Attendance policy updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update attendance policy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Attendance Policy</h2>
          <p className="mt-1 text-sm text-slate-500">Configure runtime attendance behavior without changing leave or payroll-ready data structures.</p>
        </div>
      </div>

      {loading ? (
        <Loader variant="block" label="Loading attendance policy..." />
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <FormRequiredNote className="mb-4" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField required label="Office Start Time" type="time" value={form.officeStartTime} onChange={(value) => setForm((prev) => ({ ...prev, officeStartTime: value }))} />
            <InputField required label="Office End Time" type="time" value={form.officeEndTime} onChange={(value) => setForm((prev) => ({ ...prev, officeEndTime: value }))} />
            <InputField required label="Grace Minutes" type="number" value={form.graceMinutes} onChange={(value) => setForm((prev) => ({ ...prev, graceMinutes: value }))} />
            <InputField required label="Half Day Minutes" type="number" value={form.halfDayMinutes} onChange={(value) => setForm((prev) => ({ ...prev, halfDayMinutes: value }))} />
            <InputField required label="Full Day Minutes" type="number" value={form.fullDayMinutes} onChange={(value) => setForm((prev) => ({ ...prev, fullDayMinutes: value }))} />
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-medium text-slate-900">Weekly Offs</p>
            <div className="flex flex-wrap gap-3">
              {weekdayOptions.map((day) => {
                const active = form.weeklyOffs.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeeklyOff(day.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                label: "Multiple Punch Allowed",
                value: form.multiplePunchAllowed,
                key: "multiplePunchAllowed"
              },
              {
                label: "Holiday Integration",
                value: form.enableHolidayIntegration,
                key: "enableHolidayIntegration"
              },
              {
                label: "Leave Integration",
                value: form.enableLeaveIntegration,
                key: "enableLeaveIntegration"
              }
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="text-sm font-medium text-slate-800">{item.label}</span>
                <input
                  type="checkbox"
                  checked={item.value}
                  onChange={(e) => setForm((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                />
              </label>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} isLoading={saving}>Save Policy</Button>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
      <ConfirmDialog open={!!success} title="Success" message={success} mode="Success" onConfirm={() => setSuccess("")} onCancel={() => setSuccess("")} />
    </div>
  );
}
