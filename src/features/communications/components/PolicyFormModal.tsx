import { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import DatePicker from "../../../components/ui/DatePicker";
import { InputField } from "../../../components/ui/InputField";
import Modal from "../../../components/ui/Modal";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import FormRequiredNote from "../../../components/ui/FormRequiredNote";
import type { PolicyDetail } from "../services/communicationService";
import { validatePolicyForm, type FormErrors } from "./formValidation";
import RichTextEditor from "./RichTextEditor";

type Props = {
  open: boolean;
  initial?: PolicyDetail | null;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    category: string;
    summary: string;
    content: string;
    effectiveDate: string | null;
    isPublished: boolean;
    changeSummary?: string;
  }, id?: string) => Promise<void>;
};

export default function PolicyFormModal({ open, initial, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [changeSummary, setChangeSummary] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const isEdit = useMemo(() => Boolean(initial?.id), [initial]);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title || "");
    setCategory(initial?.category || "");
    setSummary(initial?.summary || "");
    setContent(initial?.content || "");
    setEffectiveDate(initial?.effectiveDate ? initial.effectiveDate.slice(0, 10) : "");
    setIsPublished(initial?.isPublished || false);
    setChangeSummary("");
    setErrors({});
    setSubmitError("");
    setSaving(false);
  }, [initial, open]);

  const updateError = (field: string, value: string) => {
    if (!errors[field]) return;
    const nextErrors = validatePolicyForm({
      title: field === "title" ? value : title,
      category: field === "category" ? value : category,
      summary: field === "summary" ? value : summary,
      content: field === "content" ? value : content,
      effectiveDate: field === "effectiveDate" ? value : effectiveDate,
      changeSummary: field === "changeSummary" ? value : changeSummary
    });

    setErrors((current) => ({ ...current, [field]: nextErrors[field] || "" }));
  };

  const handleSubmit = async () => {
    const nextErrors = validatePolicyForm({
      title,
      category,
      summary,
      content,
      effectiveDate,
      changeSummary
    });

    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          title,
          category,
          summary,
          content,
          effectiveDate: effectiveDate || null,
          isPublished,
          changeSummary
        },
        initial?.id
      );
      onClose();
    } catch {
      setSubmitError("Unable to save the policy right now. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Update Policy" : "Create Policy"}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} isLoading={saving}>
            {isEdit ? "Update Policy" : "Create Policy"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {submitError ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p> : null}
        <FormRequiredNote />

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Policy Title"
            required
            value={title}
            onChange={(value) => {
              setTitle(value);
              updateError("title", value);
            }}
            placeholder="Leave policy"
            error={errors.title}
          />
          <InputField
            label="Category"
            required
            value={category}
            onChange={(value) => {
              setCategory(value);
              updateError("category", value);
            }}
            placeholder="HR / Compliance / IT"
            error={errors.category}
          />
        </div>

        <InputField
          label="Summary"
          required
          value={summary}
          onChange={(value) => {
            setSummary(value);
            updateError("summary", value);
          }}
          placeholder="Short policy summary"
          error={errors.summary}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <DatePicker
            label="Effective Date"
            required
            value={effectiveDate}
            onChange={(value) => {
              setEffectiveDate(value);
              updateError("effectiveDate", value);
            }}
            error={errors.effectiveDate}
          />
          <SelectDropdown
            label="Status"
            value={isPublished ? "published" : "draft"}
            onChange={(value) => setIsPublished(value === "published")}
            options={[
              { label: "Draft", value: "draft" },
              { label: "Published", value: "published" }
            ]}
          />
        </div>

        {isEdit ? (
          <InputField
            label="Change Summary"
            value={changeSummary}
            onChange={(value) => {
              setChangeSummary(value);
              updateError("changeSummary", value);
            }}
            placeholder="Optional note for this revision"
            error={errors.changeSummary}
          />
        ) : null}

        <RichTextEditor
          label="Policy Content"
          required
          value={content}
          onChange={(value) => {
            setContent(value);
            updateError("content", value);
          }}
          helperText="Use the existing editor to keep policy formatting readable."
          error={errors.content}
        />
      </div>
    </Modal>
  );
}
