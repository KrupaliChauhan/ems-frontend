import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import Loader from "../../../components/ui/Loader";
import { formatDate } from "../../../utils/date";
import { getSession, hasAccess } from "../../auth/services/auth";
import { acknowledgeAnnouncement, getAnnouncementById, markAnnouncementRead, type AnnouncementItem } from "../services/communicationService";

export default function AnnouncementDetailsPage() {
  const { announcementId } = useParams();
  const navigate = useNavigate();
  const { user } = getSession();
  const canManage = hasAccess(user?.role, "communicationsManage");
  const [item, setItem] = useState<AnnouncementItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!announcementId) return;
      setLoading(true);
      try {
        const data = await getAnnouncementById(announcementId);
        setItem(data);
        if (!canManage) {
          await markAnnouncementRead(announcementId);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load announcement");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [announcementId, canManage]);

  if (loading || !item) {
    return <Loader variant="block" label="Loading announcement..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => navigate("/communications/announcements")}>Back</Button>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.announcementType}</p>
          <h2 className="text-3xl font-semibold text-slate-900">{item.title}</h2>
        </div>
      </div>

      <div className="rounded-[32px] border border-[rgba(123,97,63,0.12)] bg-[rgba(255,253,248,0.92)] p-6 shadow-[0_18px_40px_rgba(33,29,22,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">{item.lifecycleStatus}</span>
          {item.isPinned ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Pinned</span> : null}
          {item.isUrgent ? <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">Urgent</span> : null}
        </div>
        <p className="mt-4 text-base leading-7 text-slate-600">{item.summary}</p>
        {item.bannerImage ? <img src={`${import.meta.env.VITE_API_URL}${item.bannerImage.url}`} alt={item.title} className="mt-5 h-64 w-full rounded-[28px] object-cover" /> : null}
        <div className="prose prose-slate mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: item.content || "" }} />
        <p className="mt-6 text-sm text-slate-500">Published on {formatDate(item.publishDate)}</p>
      </div>

      {!canManage && item.acknowledgementRequired && !item.receipt?.acknowledgedAt ? (
        <Button onClick={async () => {
          if (!announcementId) return;
          await acknowledgeAnnouncement(announcementId);
          setSuccess("Announcement acknowledged successfully.");
          const refreshed = await getAnnouncementById(announcementId);
          setItem(refreshed);
        }}>
          Acknowledge Announcement
        </Button>
      ) : null}

      {canManage && item.report ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Targeted", value: item.report.totalTargetedUsers, tone: "bg-slate-900 text-white" },
            { label: "Read", value: item.report.totalRead, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Unread", value: item.report.totalUnread, tone: "bg-amber-50 text-amber-700" },
            { label: "Acknowledged", value: item.report.totalAcknowledged, tone: "bg-sky-50 text-sky-700" }
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
