export const HOLIDAY_SCOPE_OPTIONS = [
  { label: "Company Wide", value: "COMPANY" },
  { label: "Department Specific", value: "DEPARTMENT" }
] as const;

export type HolidayScope = (typeof HOLIDAY_SCOPE_OPTIONS)[number]["value"];

export function normalizeHolidayScope(scope?: string | null): HolidayScope {
  const value = String(scope || "")
    .toLowerCase()
    .trim();

  if (!value) return "COMPANY";
  if (["company", "all", "global", "branch", "office"].includes(value)) return "COMPANY";
  if (["department", "dept"].includes(value)) return "DEPARTMENT";

  return "COMPANY";
}

export function getHolidayScopeLabel(scope?: string | null, departmentName?: string | null) {
  const normalized = normalizeHolidayScope(scope);
  switch (normalized) {
    case "DEPARTMENT":
      return departmentName ? `Department - ${departmentName}` : "Department";
    case "COMPANY":
    default:
      return "Company Wide";
  }
}
