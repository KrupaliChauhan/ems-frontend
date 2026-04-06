import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { InputField } from "../../../components/ui/InputField";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import DatePicker from "../../../components/ui/DatePicker";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import AudienceTargetEditor from "./AudienceTargetEditor";
import RichTextEditor from "./RichTextEditor";
import type { CommunicationMeta, EventItem, TargetingPayload } from "../services/communicationService";
import type { UserRole } from "../../auth/services/auth";
import { validateEventForm, type FormErrors } from "./formValidation";

type Props = {
  open: boolean;
  meta: CommunicationMeta | null;
  initial?: EventItem | null;
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

type ReminderItem = {
  reminderType: "immediate" | "1_day_before" | "1_hour_before" | "custom";
  channels: Array<"in_app" | "email">;
  customDateTime: string;
};

function toIsoDateTimeOrNull(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function EventFormModal({ open, meta, initial, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("meeting");
  const [description, setDescription] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState("");
  const [mode, setMode] = useState("offline");
  const [meetingLink, setMeetingLink] = useState("");
  const [status, setStatus] = useState("draft");
  const [sendEmail, setSendEmail] = useState(false);
  const [sendInAppNotification, setSendInAppNotification] = useState(true);
  const [targeting, setTargeting] = useState<TargetingPayload>(defaultTargeting);
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [bannerImage, setBannerImage] = useState<FileList | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState<ReminderItem[]>([
    { reminderType: "immediate", channels: ["in_app"], customDateTime: "" }
  ]);

  const isEdit = useMemo(() => Boolean(initial?.id), [initial]);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title || "");
    setCategory(initial?.category || "meeting");
    setDescription(initial?.description || "");
    setPublishDate(initial?.publishDate ? initial.publishDate.slice(0, 10) : "");
    setStartDate(initial?.startDate ? initial.startDate.slice(0, 10) : "");
    setEndDate(initial?.endDate ? initial.endDate.slice(0, 10) : "");
    setStartTime(initial?.startTime || "09:00");
    setEndTime(initial?.endTime || "10:00");
    setAllDay(initial?.allDay || false);
    setLocation(initial?.location || "");
    setMode(initial?.mode || "offline");
    setMeetingLink(initial?.meetingLink || "");
    setStatus(initial?.status || "draft");
    setSendEmail(initial?.sendEmail || false);
    setSendInAppNotification(initial?.sendInAppNotification ?? true);
    setTargeting({
      allEmployees: initial?.targeting.allEmployees || false,
      departmentIds: initial?.targeting.departments?.map((item) => item.id) || [],
      roleKeys: (initial?.targeting.roles || []) as UserRole[],
      designationIds: initial?.targeting.designations?.map((item) => item.id) || [],
      projectIds: initial?.targeting.projects?.map((item) => item.id) || [],
      userIds: initial?.targeting.users?.map((item) => item.id) || []
    });
    setReminders(
      initial?.reminderSettings?.length
        ? initial.reminderSettings.map((item) => ({
            reminderType: item.reminderType,
            channels: item.channels,
            customDateTime: item.customDateTime ? item.customDateTime.slice(0, 16) : ""
          }))
        : [{ reminderType: "immediate", channels: ["in_app"], customDateTime: "" }]
    );
    setAttachments(null);
    setBannerImage(null);
    setErrors({});
    setSubmitError("");
    setSaving(false);
  }, [initial, open]);

  const buildValidationErrors = (overrides?: Partial<{
    title: string;
    description: string;
    publishDate: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    allDay: boolean;
    meetingLink: string;
    mode: string;
    targeting: TargetingPayload;
    reminders: typeof reminders;
  }>) =>
    validateEventForm({
      title,
      description,
      publishDate,
      startDate,
      endDate,
      startTime,
      endTime,
      allDay,
      meetingLink,
      mode,
      targeting,
      reminders,
      ...overrides
    });

  const updateError = (field: string, overrides?: Parameters<typeof buildValidationErrors>[0]) => {
    if (!errors[field]) return;
    const nextErrors = buildValidationErrors(overrides);
    setErrors((current) => {
      const updated = { ...current };
      if (nextErrors[field]) {
        updated[field] = nextErrors[field];
      } else {
        delete updated[field];
      }
      return updated;
    });
  };

  const toggleReminderChannel = (
    channels: ReminderItem["channels"],
    channel: ReminderItem["channels"][number],
    checked: boolean
  ): ReminderItem["channels"] => {
    if (checked) {
      return channels.includes(channel) ? channels : [...channels, channel];
    }

    return channels.filter((currentChannel) => currentChannel !== channel);
  };

  const handleSubmit = async () => {
    const nextErrors = buildValidationErrors();
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("title", title);
      payload.append("category", category);
      payload.append("description", description);
      payload.append("publishDate", publishDate);
      payload.append("startDate", startDate);
      payload.append("endDate", endDate);
      payload.append("startTime", startTime);
      payload.append("endTime", endTime);
      payload.append("allDay", String(allDay));
      payload.append("location", location);
      payload.append("mode", mode);
      payload.append("meetingLink", meetingLink);
      payload.append("status", status);
      payload.append("sendEmail", String(sendEmail));
      payload.append("sendInAppNotification", String(sendInAppNotification));
      payload.append("targeting", JSON.stringify(targeting));
      payload.append(
        "reminderSettings",
        JSON.stringify(
          reminders.map((item) => ({
            reminderType: item.reminderType,
            channels: item.channels,
            customDateTime: item.reminderType === "custom" ? toIsoDateTimeOrNull(item.customDateTime) : null
          }))
        )
      );

      if (attachments) {
        Array.from(attachments).forEach((file) => payload.append("attachments", file));
      }
      if (bannerImage?.[0]) payload.append("bannerImage", bannerImage[0]);

      await onSave(payload, initial?.id);
      onClose();
    } catch {
      setSubmitError("Unable to save the event right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Edit Event" : "Create Event"}
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
            label="Event Title"
            required
            value={title}
            onChange={(value) => {
              setTitle(value);
              updateError("title", { title: value });
            }}
            placeholder="Event title"
            error={errors.title}
          />
          <SelectDropdown
            label="Category"
            value={category}
            onChange={setCategory}
            options={[
              { label: "Meeting", value: "meeting" },
              { label: "Training", value: "training" },
              { label: "Celebration", value: "celebration" },
              { label: "Townhall", value: "townhall" },
              { label: "Engagement", value: "engagement" },
              { label: "Other", value: "other" }
            ]}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <DatePicker
            label="Publish Date"
            required
            value={publishDate}
            onChange={(value) => {
              setPublishDate(value);
              updateError("publishDate", { publishDate: value });
            }}
            error={errors.publishDate}
          />
          <DatePicker
            label="Start Date"
            required
            value={startDate}
            onChange={(value) => {
              setStartDate(value);
              updateError("startDate", { startDate: value });
              updateError("endDate", { startDate: value });
            }}
            error={errors.startDate}
          />
          <DatePicker
            label="End Date"
            required
            value={endDate}
            onChange={(value) => {
              setEndDate(value);
              updateError("endDate", { endDate: value });
            }}
            error={errors.endDate}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InputField
            label="Start Time"
            required
            type="time"
            value={startTime}
            onChange={(value) => {
              setStartTime(value);
              updateError("startTime", { startTime: value });
            }}
            error={errors.startTime}
          />
          <InputField
            label="End Time"
            required
            type="time"
            value={endTime}
            onChange={(value) => {
              setEndTime(value);
              updateError("endTime", { endTime: value });
            }}
            error={errors.endTime}
          />
          <SelectDropdown
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" },
              { label: "Cancelled", value: "cancelled" }
            ]}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SelectDropdown
            label="Mode"
            value={mode}
            onChange={(value) => {
              setMode(value);
              updateError("meetingLink", { mode: value });
            }}
            options={[
              { label: "Offline", value: "offline" },
              { label: "Online", value: "online" },
              { label: "Hybrid", value: "hybrid" }
            ]}
          />
          <InputField label="Location" value={location} onChange={setLocation} placeholder="Office / venue / city" />
          <label className="flex items-center gap-3 rounded-2xl border border-[rgba(123,97,63,0.12)] bg-white/80 px-4 py-3 text-sm font-semibold text-slate-900">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => {
                const checked = e.target.checked;
                setAllDay(checked);
                updateError("startTime", { allDay: checked });
                updateError("endTime", { allDay: checked });
              }}
            />
            All Day Event
          </label>
        </div>

        {(mode === "online" || mode === "hybrid") ? (
          <InputField
            label="Meeting Link"
            value={meetingLink}
            onChange={(value) => {
              setMeetingLink(value);
              updateError("meetingLink", { meetingLink: value });
            }}
            placeholder="https://..."
            error={errors.meetingLink}
          />
        ) : null}

        <RichTextEditor
          label="Description"
          required
          value={description}
          onChange={(value) => {
            setDescription(value);
            updateError("description", { description: value });
          }}
          error={errors.description}
        />

        <AudienceTargetEditor
          meta={meta}
          value={targeting}
          onChange={(value) => {
            setTargeting(value);
            updateError("targeting", { targeting: value });
          }}
          error={errors.targeting}
        />

        <div className="rounded-2xl border border-[rgba(123,97,63,0.12)] bg-white/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">Reminder Settings</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setReminders((current) => [
                  ...current,
                  { reminderType: "1_day_before", channels: ["in_app"], customDateTime: "" }
                ])
              }
            >
              Add Reminder
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {reminders.map((item, index) => (
              <div key={`${item.reminderType}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
                <SelectDropdown
                  label="Reminder Type"
                  value={item.reminderType}
                  onChange={(value) =>
                    setReminders((current) => {
                      const nextReminders = current.map((entry, entryIndex) =>
                        entryIndex === index
                          ? {
                              ...entry,
                              reminderType: value as typeof entry.reminderType,
                              customDateTime: value === "custom" ? entry.customDateTime : ""
                            }
                          : entry
                      );
                      updateError(`reminders.${index}.customDateTime`, { reminders: nextReminders });
                      return nextReminders;
                    })
                  }
                  options={[
                    { label: "Immediate", value: "immediate" },
                    { label: "1 Day Before", value: "1_day_before" },
                    { label: "1 Hour Before", value: "1_hour_before" },
                    { label: "Custom", value: "custom" }
                  ]}
                />
                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-900">Channels</p>
                  <div className="space-y-2 rounded-2xl border border-[rgba(123,97,63,0.12)] bg-white px-4 py-3 text-sm text-slate-700">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.channels.includes("in_app")}
                        onChange={(e) =>
                          setReminders((current) => {
                            const nextReminders = current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? {
                                    ...entry,
                                    channels: toggleReminderChannel(entry.channels, "in_app", e.target.checked)
                                  }
                                : entry
                            );
                            updateError(`reminders.${index}.channels`, { reminders: nextReminders });
                            return nextReminders;
                          })
                        }
                      />
                      In-App
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.channels.includes("email")}
                        onChange={(e) =>
                          setReminders((current) => {
                            const nextReminders = current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? {
                                    ...entry,
                                    channels: toggleReminderChannel(entry.channels, "email", e.target.checked)
                                  }
                                : entry
                            );
                            updateError(`reminders.${index}.channels`, { reminders: nextReminders });
                            return nextReminders;
                          })
                        }
                      />
                      Email
                    </label>
                  </div>
                  {errors[`reminders.${index}.channels`] ? (
                    <p className="mt-1.5 text-sm text-red-600">{errors[`reminders.${index}.channels`]}</p>
                  ) : null}
                </div>
                <InputField
                  label="Custom Date Time"
                  required={item.reminderType === "custom"}
                  type="datetime-local"
                  value={item.customDateTime}
                  onChange={(value) =>
                    setReminders((current) => {
                      const nextReminders = current.map((entry, entryIndex) =>
                        entryIndex === index ? { ...entry, customDateTime: value } : entry
                      );
                      updateError(`reminders.${index}.customDateTime`, { reminders: nextReminders });
                      return nextReminders;
                    })
                  }
                  error={errors[`reminders.${index}.customDateTime`]}
                />
              </div>
            ))}
          </div>
        </div>

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
            <label className="mb-1.5 block text-sm font-medium text-slate-900">Event Banner</label>
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
