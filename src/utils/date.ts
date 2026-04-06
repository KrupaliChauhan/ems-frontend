export function formatDate(isoOrDate?: string | null) {
  if (!isoOrDate) return "-";

  try {
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return isoOrDate;

    const parts = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).formatToParts(d);

    const day = parts.find((part) => part.type === "day")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const year = parts.find((part) => part.type === "year")?.value;

    return day && month && year ? `${day} ${month}, ${year}` : isoOrDate;
  } catch {
    return isoOrDate;
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const timeLabel = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });

    return `${formatDate(value)}, ${timeLabel}`;
  } catch {
    return value;
  }
}
