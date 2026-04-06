import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { InputField } from "../../../components/ui/InputField";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import DatePicker from "../../../components/ui/DatePicker";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import AudienceTargetEditor from "./AudienceTargetEditor";
import RichTextEditor from "./RichTextEditor";
import type { AnnouncementItem, CommunicationMeta, TargetingPayload } from "../services/communicationService";
import type { UserRole } from "../../auth/services/auth";
import { validateAnnouncementForm, type FormErrors } from "./formValidation";

type Props = {
  open: boolean;
  meta: CommunicationMeta | null;
  initial?: AnnouncementItem | null;
  onClose: () => void;
  onSave: (payload: FormData, id?: string) => Promise<void>;
};

const defaultTargeting: TargetingPayload = {
  allEmployees: false,
  departmentIds: [],
  roleKeys: [] as UserRole[],
  designationIds: [],
  projectIds: [],
  userIds: []
};

export default function AnnouncementFormModal({ open, meta, initial, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [publishDate, setPublishDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [targeting, setTargeting] = useState<TargetingPayload>(defaultTargeting);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendInAppNotification, setSendInAppNotification] = useState(true);
  const [acknowledgementRequired, setAcknowledgementRequired] = useState(false);
  const [status, setStatus] = useState("draft");
  const [isPinned, setIsPinned] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [bannerImage, setBannerImage] = useState<FileList | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = useMemo(() => Boolean(initial?.id), [initial]);

  useEffect(() => {
    if (!open) return;

    setTitle(initial?.title || "");
    setSummary(initial?.summary || "");
    setContent(initial?.content || "");
    setAnnouncementType(initial?.announcementType || "general");
    setPriority(initial?.priority || "normal");
    setPublishDate(initial?.publishDate ? initial.publishDate.slice(0, 10) : "");
    setExpiryDate(initial?.expiryDate ? initial.expiryDate.slice(0, 10) : "");
    setTargeting({
      allEmployees: initial?.targeting.allEmployees || false,
      departmentIds: initial?.targeting.departments?.map((item) => item.id) || [],
      roleKeys: (initial?.targeting.roles || []) as UserRole[],
      designationIds: initial?.targeting.designations?.map((item) => item.id) || [],
      projectIds: initial?.targeting.projects?.map((item) => item.id) || [],
      userIds: initial?.targeting.users?.map((item) => item.id) || []
    });
    setSendEmail(initial?.sendEmail || false);
    setSendInAppNotification(initial?.sendInAppNotification ?? true);
    setAcknowledgementRequired(initial?.acknowledgementRequired || false);
    setStatus(initial?.status || "draft");
    setIsPinned(initial?.isPinned || false);
    setIsUrgent(initial?.isUrgent || false);
    setAttachments(null);
    setBannerImage(null);
    setErrors({});
    setSubmitError("");
    setSaving(false);
  }, [initial, open]);

  const updateError = (field: string, value?: string, nextTargeting?: TargetingPayload) => {
    if (!errors[field]) return;
    const nextErrors = validateAnnouncementForm({
      title: field === "title" ? value || "" : title,
      summary: field === "summary" ? value || "" : summary,
      content: field === "content" ? value || "" : content,
      publishDate: field === "publishDate" ? value || "" : publishDate,
      expiryDate: field === "expiryDate" ? value || "" : expiryDate,
      targeting: nextTargeting ?? targeting
    });

    setErrors((current) => ({ ...current, [field]: nextErrors[field] || "" }));
  };

  const handleSubmit = async () => {
    const nextErrors = validateAnnouncementForm({
      title,
      summary,
      content,
      publishDate,
      expiryDate,
      targeting
    });
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("title", title);
      payload.append("summary", summary);
      payload.append("content", content);
      payload.append("announcementType", announcementType);
      payload.append("priority", priority);
      payload.append("publishDate", publishDate);
      payload.append("expiryDate", expiryDate || "");
      payload.append("targeting", JSON.stringify(targeting));
      payload.append("sendEmail", String(sendEmail));
      payload.append("sendInAppNotification", String(sendInAppNotification));
      payload.append("acknowledgementRequired", String(acknowledgementRequired));
      payload.append("status", status);
      payload.append("isPinned", String(isPinned));
      payload.append("isUrgent", String(isUrgent));

      if (attachments) {
        Array.from(attachments).forEach((file) => payload.append("attachments", file));
      }
      if (bannerImage?.[0]) {
        payload.append("bannerImage", bannerImage[0]);
      }

      await onSave(payload, initial?.id);
      onClose();
    } catch {
      setSubmitError("Unable to save the announcement right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit Announcement" : "Create Announcement"}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} isLoading={saving}>
            {isEdit ? "Update" : "Save"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {submitError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p> : null}
        <FormRequiredNote />

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Title"
            required
            value={title}
            onChange={(value) => {
              setTitle(value);
              updateError("title", value);
            }}
            placeholder="Announcement title"
            error={errors.title}
          />
          <InputField
            label="Summary"
            required
            value={summary}
            onChange={(value) => {
              setSummary(value);
              updateError("summary", value);
            }}
            placeholder="Short summary"
            error={errors.summary}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SelectDropdown
            label="Type"
            value={announcementType}
            onChange={setAnnouncementType}
            options={[
              { label: "General", value: "general" },
              { label: "Policy", value: "policy" },
              { label: "Celebration", value: "celebration" },
              { label: "Alert", value: "alert" },
              { label: "Update", value: "update" },
              { label: "Other", value: "other" }
            ]}
          />
          <SelectDropdown
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={[
              { label: "Low", value: "low" },
              { label: "Normal", value: "normal" },
              { label: "High", value: "high" },
              { label: "Urgent", value: "urgent" }
            ]}
          />
          <SelectDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
              { label: "Archived", value: "archived" }
            ]}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DatePicker
            label="Publish Date"
            required
            value={publishDate}
            onChange={(value) => {
              setPublishDate(value);
              updateError("publishDate", value);
            }}
            error={errors.publishDate}
          />
          <DatePicker
            label="Expiry Date"
            value={expiryDate}
            onChange={(value) => {
              setExpiryDate(value);
              updateError("expiryDate", value);
            }}
            error={errors.expiryDate}
          />
        </div>

        <RichTextEditor
          label="Rich Content"
          required
          value={content}
          onChange={(value) => {
            setContent(value);
            updateError("content", value);
          }}
          helperText="Use formatting tools to prepare the announcement body."
          error={errors.content}
        />

        <AudienceTargetEditor
          meta={meta}
          value={targeting}
          onChange={(value) => {
            setTargeting(value);
            updateError("targeting", undefined, value);
          }}
          error={errors.targeting}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[rgba(123,97,63,0.12)] bg-white/80 p-4">
            <p className="text-sm font-semibold text-slate-900">Delivery Settings</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
                Send Email Notification
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={sendInAppNotification} onChange={(e) => setSendInAppNotification(e.target.checked)} />
                Send In-App Notification
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={acknowledgementRequired} onChange={(e) => setAcknowledgementRequired(e.target.checked)} />
                Acknowledgement Required
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(123,97,63,0.12)] bg-white/80 p-4">
            <p className="text-sm font-semibold text-slate-900">Visibility Flags</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
                Pin Announcement
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
                Mark as Urgent
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-900">Attachments</label>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(e) => setAttachments(e.target.files)}
              className="block w-full rounded-2xl border border-[rgba(123,97,63,0.15)] bg-white px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-900">Banner Image</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={(e) => setBannerImage(e.target.files)}
              className="block w-full rounded-2xl border border-[rgba(123,97,63,0.15)] bg-white px-4 py-3 text-sm"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
