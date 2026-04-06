import type { TargetingPayload } from "../services/communicationService";

export type FormErrors = Record<string, string>;

function getPlainTextLength(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function hasTargetAudience(targeting: TargetingPayload) {
  return (
    targeting.allEmployees ||
    targeting.departmentIds.length > 0 ||
    targeting.roleKeys.length > 0 ||
    targeting.designationIds.length > 0 ||
    targeting.projectIds.length > 0 ||
    targeting.userIds.length > 0
  );
}

export function validatePolicyForm(values: {
  title: string;
  category: string;
  summary: string;
  content: string;
  effectiveDate: string;
  changeSummary: string;
}) {
  const errors: FormErrors = {};
  const title = values.title.trim();
  const category = values.category.trim();
  const summary = values.summary.trim();
  const changeSummary = values.changeSummary.trim();
  const contentLength = getPlainTextLength(values.content);

  if (title.length < 3) errors.title = "Policy title must be at least 3 characters.";
  else if (title.length > 180) errors.title = "Policy title must be 180 characters or less.";

  if (category.length > 120) errors.category = "Category must be 120 characters or less.";
  if (summary.length > 500) errors.summary = "Summary must be 500 characters or less.";
  if (contentLength < 5) errors.content = "Policy content must be at least 5 characters.";
  else if (contentLength > 30000) errors.content = "Policy content must be 30000 characters or less.";
  if (values.effectiveDate && !isValidDate(values.effectiveDate)) errors.effectiveDate = "Enter a valid effective date.";
  if (changeSummary.length > 300) errors.changeSummary = "Change summary must be 300 characters or less.";

  return errors;
}

export function validateAnnouncementForm(values: {
  title: string;
  summary: string;
  content: string;
  publishDate: string;
  expiryDate: string;
  targeting: TargetingPayload;
}) {
  const errors: FormErrors = {};
  const title = values.title.trim();
  const summary = values.summary.trim();
  const contentLength = getPlainTextLength(values.content);

  if (title.length < 3) errors.title = "Title must be at least 3 characters.";
  else if (title.length > 180) errors.title = "Title must be 180 characters or less.";

  if (summary.length < 5) errors.summary = "Summary must be at least 5 characters.";
  else if (summary.length > 500) errors.summary = "Summary must be 500 characters or less.";

  if (contentLength < 5) errors.content = "Content must be at least 5 characters.";
  else if (contentLength > 30000) errors.content = "Content must be 30000 characters or less.";

  if (!values.publishDate) errors.publishDate = "Publish date is required.";
  else if (!isValidDate(values.publishDate)) errors.publishDate = "Enter a valid publish date.";

  if (values.expiryDate && !isValidDate(values.expiryDate)) {
    errors.expiryDate = "Enter a valid expiry date.";
  } else if (
    values.publishDate &&
    values.expiryDate &&
    isValidDate(values.publishDate) &&
    isValidDate(values.expiryDate) &&
    new Date(values.expiryDate) < new Date(values.publishDate)
  ) {
    errors.expiryDate = "Expiry date must be after publish date.";
  }

  if (!hasTargetAudience(values.targeting)) {
    errors.targeting = "Select at least one target audience.";
  }

  return errors;
}

export function validateEventForm(values: {
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
  reminders: Array<{
    reminderType: string;
    channels: string[];
    customDateTime: string;
  }>;
}) {
  const errors: FormErrors = {};
  const title = values.title.trim();
  const descriptionLength = getPlainTextLength(values.description);
  const hhmm = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (title.length < 3) errors.title = "Event title must be at least 3 characters.";
  else if (title.length > 180) errors.title = "Event title must be 180 characters or less.";

  if (descriptionLength < 5) errors.description = "Description must be at least 5 characters.";
  else if (descriptionLength > 20000) errors.description = "Description must be 20000 characters or less.";

  if (!values.publishDate) errors.publishDate = "Publish date is required.";
  else if (!isValidDate(values.publishDate)) errors.publishDate = "Enter a valid publish date.";

  if (!values.startDate) errors.startDate = "Start date is required.";
  else if (!isValidDate(values.startDate)) errors.startDate = "Enter a valid start date.";

  if (!values.endDate) errors.endDate = "End date is required.";
  else if (!isValidDate(values.endDate)) errors.endDate = "Enter a valid end date.";
  else if (
    values.startDate &&
    isValidDate(values.startDate) &&
    new Date(values.endDate) < new Date(values.startDate)
  ) {
    errors.endDate = "End date must be on or after start date.";
  }

  if (!values.allDay) {
    if (!hhmm.test(values.startTime.trim())) errors.startTime = "Start time is required in HH:mm format.";
    if (!hhmm.test(values.endTime.trim())) errors.endTime = "End time is required in HH:mm format.";
  }

  if ((values.mode === "online" || values.mode === "hybrid") && !values.meetingLink.trim()) {
    errors.meetingLink = "Meeting link is required for online or hybrid events.";
  } else if (values.meetingLink.trim().length > 500) {
    errors.meetingLink = "Meeting link must be 500 characters or less.";
  }

  if (!hasTargetAudience(values.targeting)) {
    errors.targeting = "Select at least one target audience.";
  }

  values.reminders.forEach((item, index) => {
    if (!item.channels.length) {
      errors[`reminders.${index}.channels`] = "Select at least one reminder channel.";
    }
    if (item.reminderType === "custom" && !item.customDateTime) {
      errors[`reminders.${index}.customDateTime`] = "Custom reminder date and time is required.";
    }
  });

  return errors;
}
