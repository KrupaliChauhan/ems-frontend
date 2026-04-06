import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Loader from "../../../components/ui/Loader";
import { formatDate } from "../../../utils/date";
import { getSession, hasAccess } from "../../auth/services/auth";
import { archiveEvent, cancelEvent, getEventById, publishEvent, restoreEvent, rsvpToEvent, type EventItem } from "../services/communicationService";

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = getSession();
  const canManage = hasAccess(user?.role, "communicationsManage");
  const [item, setItem] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const data = await getEventById(eventId);
        setItem(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load event");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const refreshEvent = async () => {
    if (!eventId) return;
    const refreshed = await getEventById(eventId);
    setItem(refreshed);
  };

  if (loading || !item) {
    return <Loader variant="block" label="Loading event..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/communications/events")}>Back</Button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.category}</p>
            <h2 className="text-3xl font-semibold text-slate-900">{item.title}</h2>
          </div>
        </div>

        {canManage ? (
          <div className="flex flex-wrap gap-3">
            {item.status === "draft" ? (
              <Button
                onClick={async () => {
                  if (!eventId) return;
                  await publishEvent(eventId);
                  setSuccess("Event published successfully.");
                  await refreshEvent();
                }}
              >
                Publish
              </Button>
            ) : null}
            {item.status === "published" ? (
              <Button
                variant="outline"
                onClick={async () => {
                  if (!eventId) return;
                  await cancelEvent(eventId);
                  setSuccess("Event cancelled successfully.");
                  await refreshEvent();
                }}
              >
                Cancel
              </Button>
            ) : null}
            {item.status === "archived" ? (
              <Button
                variant="outline"
                onClick={async () => {
                  if (!eventId) return;
                  await restoreEvent(eventId);
                  setSuccess("Event unarchived successfully.");
                  await refreshEvent();
                }}
              >
                Unarchive
              </Button>
            ) : item.status !== "draft" && item.status !== "archived" ? (
              <Button
                variant="outline"
                onClick={async () => {
                  if (!eventId) return;
                  await archiveEvent(eventId);
                  setSuccess("Event archived successfully.");
                  await refreshEvent();
                }}
              >
                Archive
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-[32px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.92)] p-6 shadow-[0_18px_40px_rgba(33,29,22,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{item.lifecycleStatus}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{item.mode}</span>
        </div>
        <p className="mt-4 text-base leading-7 text-slate-600">{item.description}</p>
        {item.bannerImage ? <img src={`${import.meta.env.VITE_API_URL}${item.bannerImage.url}`} alt={item.title} className="mt-5 h-64 w-full rounded-[28px] object-cover" /> : null}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Schedule</p>
            <p className="mt-2 text-sm text-slate-600">{formatDate(item.startDate)} to {formatDate(item.endDate)}</p>
            <p className="mt-1 text-sm text-slate-600">{item.allDay ? "All Day" : `${item.startTime} - ${item.endTime}`}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Location & Organizer</p>
            <p className="mt-2 text-sm text-slate-600">{item.location || "N/A"}</p>
            <p className="mt-1 text-sm text-slate-600">{item.organizer?.name || "Organizer"}</p>
          </div>
        </div>

        {item.meetingLink ? (
          <a
            href={item.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex rounded-2xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            Open Meeting Link
          </a>
        ) : null}
      </div>

      {!canManage ? (
        <div className="flex flex-wrap gap-3">
          {(["Accepted", "Declined", "Maybe"] as const).map((status) => (
            <Button
              key={status}
              variant={item.invitation?.status === status ? "primary" : "outline"}
              onClick={async () => {
                if (!eventId) return;
                await rsvpToEvent(eventId, status);
                setSuccess(`RSVP updated to ${status}.`);
                await refreshEvent();
              }}
            >
              {status}
            </Button>
          ))}
        </div>
      ) : null}

      {canManage && item.report ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Invited", value: item.report.totalInvitedUsers, tone: "bg-slate-900 text-white" },
            { label: "Accepted", value: item.report.counts.accepted, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Declined", value: item.report.counts.declined, tone: "bg-rose-50 text-rose-700" },
            { label: "Maybe", value: item.report.counts.maybe, tone: "bg-sky-50 text-sky-700" },
            { label: "Pending", value: item.report.counts.pending, tone: "bg-amber-50 text-amber-700" }
          ].map((card) => (
            <div key={card.label} className={`rounded-[28px] px-5 py-5 shadow-sm ${card.tone}`}>
              <p className="text-xs uppercase tracking-[0.18em] opacity-80">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <ConfirmDialog open={!!error} title="Error" message={error} onConfirm={() => setError("")} onCancel={() => setError("")} />
      <ConfirmDialog open={!!success} title="Success" message={success} mode="Success" onConfirm={() => setSuccess("")} onCancel={() => setSuccess("")} />
    </div>
  );
}