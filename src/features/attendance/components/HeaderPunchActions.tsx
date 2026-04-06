import { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import AttendanceDayMessage from "./AttendanceDayMessage";
import {
  addAttendancePunch,
  getAttendancePolicy,
  getMyDailyAttendance,
  NON_WORKING_ATTENDANCE_STATUSES,
  publishAttendanceDayUpdate,
  type AttendanceDayResponse,
  type AttendancePolicy
} from "../services/attendanceService";

function formatPunchTime(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getLocalPunchTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export default function HeaderPunchActions() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<"" | "IN" | "OUT">("");
  const [dayData, setDayData] = useState<AttendanceDayResponse>({
    summary: null,
    punches: [],
    status: "PRESENT"
  });
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyDailyAttendance();
      setDayData(data);
      publishAttendanceDayUpdate(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const response = await getAttendancePolicy();
        setPolicy(response);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load attendance policy");
      }
    };

    loadPolicy();
  }, []);

  const handlePunch = async (punchType: "IN" | "OUT") => {
    setSubmitting(punchType);
    setError("");
    try {
      await addAttendancePunch({
        punchType,
        punchTime: getLocalPunchTimestamp(),
        source: "web"
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add punch");
    } finally {
      setSubmitting("");
    }
  };

  const summary = dayData.summary;
  const latestPunch = dayData.punches.length > 0 ? dayData.punches[dayData.punches.length - 1] : null;
  const isNonWorkingDay = summary ? NON_WORKING_ATTENDANCE_STATUSES.includes(summary.status) : false;
  const isCurrentlyPunchedIn = latestPunch?.punchType === "IN";
  const canPunchIn =
    !isNonWorkingDay &&
    !isCurrentlyPunchedIn &&
    (latestPunch?.punchType !== "OUT" || Boolean(policy?.multiplePunchAllowed));
  const canPunchOut = !isNonWorkingDay && isCurrentlyPunchedIn;
  const latestPunchLabel = latestPunch
    ? {
        label: latestPunch.punchType === "IN" ? "Punch In" : "Punch Out",
        value: formatPunchTime(latestPunch.punchTime)
      }
    : null;

  return (
    <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
        <AttendanceDayMessage status={dayData.status} compact />
        <div className="grid grid-cols-2 gap-2 md:flex md:items-start">
          <div className="flex min-w-0 flex-col gap-1">
            <Button
              size="sm"
              className="w-full md:w-auto"
              disabled={loading || submitting !== "" || !canPunchIn}
              isLoading={submitting === "IN"}
              onClick={() => handlePunch("IN")}
            >
              Punch In
            </Button>
            {latestPunchLabel?.label === "Punch In" ? (
              <span className="text-[11px] text-slate-500 md:text-center">
                Punch In: {latestPunchLabel.value}
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full md:w-auto"
              disabled={loading || submitting !== "" || !canPunchOut}
              isLoading={submitting === "OUT"}
              onClick={() => handlePunch("OUT")}
            >
              Punch Out
            </Button>
            {latestPunchLabel?.label === "Punch Out" ? (
              <span className="text-[11px] text-slate-500 md:text-center">
                Punch Out: {latestPunchLabel.value}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
    </>
  );
}
