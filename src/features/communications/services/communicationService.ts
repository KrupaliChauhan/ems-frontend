import { apiRequest } from "../../../services/api";
import type { UserRole } from "../../auth/services/auth";

export type TargetingOption = {
  id: string;
  name: string;
};

export type CommunicationMeta = {
  roles: UserRole[];
  departments: TargetingOption[];
  designations: Array<TargetingOption & { departmentId: string | null; departmentName: string }>;
  users: Array<{ id: string; name: string; email: string; role: UserRole; departmentId: string | null; designationId: string | null }>;
  projects: Array<{ id: string; name: string; employeeIds: string[] }>;
};

export type TargetingPayload = {
  allEmployees: boolean;
  departmentIds: string[];
  roleKeys: UserRole[];
  designationIds: string[];
  projectIds: string[];
  userIds: string[];
};

export type UploadedFile = {
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
};

export type AnnouncementItem = {
  id: string;
  title: string;
  summary: string;
  content?: string;
  announcementType: string;
  priority: string;
  status: string;
  lifecycleStatus: string;
  publishDate: string;
  expiryDate?: string | null;
  isPinned: boolean;
  isUrgent: boolean;
  sendEmail?: boolean;
  sendInAppNotification?: boolean;
  acknowledgementRequired?: boolean;
  attachments: UploadedFile[];
  bannerImage: UploadedFile | null;
  targeting: {
    allEmployees: boolean;
    departments?: TargetingOption[];
    roles?: UserRole[];
    designations?: TargetingOption[];
    projects?: TargetingOption[];
    users?: Array<{ id: string; name: string; email: string }>;
  };
  readAt?: string | null;
  acknowledgedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  report?: {
    totalTargetedUsers: number;
    totalRead: number;
    totalUnread: number;
    totalAcknowledged: number;
    readUsers: Array<{ _id?: string; name?: string; email?: string }>;
    acknowledgedUsers: Array<{ _id?: string; name?: string; email?: string }>;
    unreadUserIds: string[];
  } | null;
  receipt?: {
    deliveredAt: string;
    readAt: string | null;
    acknowledgedAt: string | null;
  } | null;
};

export type EventItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  publishDate: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  location: string;
  mode: "online" | "offline" | "hybrid";
  meetingLink?: string;
  status: string;
  lifecycleStatus: string;
  sendEmail?: boolean;
  sendInAppNotification?: boolean;
  attachments: UploadedFile[];
  bannerImage: UploadedFile | null;
  targeting: {
    allEmployees: boolean;
    departments?: TargetingOption[];
    roles?: UserRole[];
    designations?: TargetingOption[];
    projects?: TargetingOption[];
    users?: Array<{ id: string; name: string; email: string }>;
  };
  reminderSettings?: Array<{
    _id?: string;
    reminderType: "immediate" | "1_day_before" | "1_hour_before" | "custom";
    channels: Array<"in_app" | "email">;
    customDateTime?: string | null;
    processedAt?: string | null;
  }>;
  rsvpStatus?: string;
  respondedAt?: string | null;
  organizer?: { id: string | null; name: string; email: string };
  invitation?: { status: string; openedAt: string | null; respondedAt: string | null } | null;
  report?: {
    totalInvitedUsers: number;
    acceptedUsers: Array<{ _id?: string; name?: string; email?: string }>;
    declinedUsers: Array<{ _id?: string; name?: string; email?: string }>;
    maybeUsers: Array<{ _id?: string; name?: string; email?: string }>;
    pendingUsers: Array<{ _id?: string; name?: string; email?: string }>;
    counts: {
      accepted: number;
      declined: number;
      maybe: number;
      pending: number;
    };
  } | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type:
    | "announcement"
    | "event"
    | "event_reminder"
    | "leave_status"
    | "task_assignment"
    | "task_due"
    | "task_overdue"
    | "project_member_added"
    | "policy_acknowledgment_reminder";
  link: string;
  readAt: string | null;
  createdAt: string;
};

export type PolicyListItem = {
  id: string;
  title: string;
  code: string;
  category: string;
  summary: string;
  versionNumber: number;
  isPublished: boolean;
  effectiveDate: string | null;
  acknowledgmentStatus: "ACKNOWLEDGED" | "PENDING";
  acknowledgedAt: string | null;
  acknowledgmentSummary: {
    totalEmployees: number;
    acknowledgedCount: number;
    pendingCount: number;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type PolicyHistoryItem = {
  id: string;
  versionNumber: number;
  title: string;
  category: string;
  summary: string;
  content: string;
  effectiveDate: string | null;
  isPublished: boolean;
  changeSummary: string;
  changedAt: string;
  changedBy: { id: string; name: string; email: string } | null;
};

export type PolicyReportItem = {
  employeeId: string;
  employeeName: string;
  email: string;
  departmentId: string | null;
  departmentName: string;
  versionNumber: number;
  status: "ACKNOWLEDGED" | "PENDING";
  acknowledgedAt: string | null;
};

export type PolicyDetail = PolicyListItem & {
  content: string;
  report: {
    totalEmployees: number;
    acknowledgedCount: number;
    pendingCount: number;
    items: PolicyReportItem[];
  } | null;
  history: PolicyHistoryItem[];
};

export type CommunicationDashboardResponse = {
  roleView: "manager" | "employee";
  totals?: {
    totalAnnouncements: number;
    unreadAnnouncements: number;
    upcomingEvents: number;
  };
  participationSummary?: {
    accepted: number;
    declined: number;
    maybe: number;
    pending: number;
  };
  latestAnnouncements: Array<{
    id: string;
    title: string;
    summary: string;
    publishDate: string;
    isPinned: boolean;
    priority: string;
  }>;
  pinnedAnnouncements?: Array<{
    id: string;
    title: string;
    summary: string;
    publishDate: string;
    isPinned: boolean;
    priority: string;
  }>;
  upcomingEvents?: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    mode: string;
    location: string;
  }>;
};

export async function getCommunicationMeta() {
  return apiRequest<CommunicationMeta>("/api/communications/meta", "GET");
}

export async function getCommunicationDashboard() {
  return apiRequest<CommunicationDashboardResponse>("/api/communications/dashboard", "GET");
}

export async function listAnnouncements(params: {
  page?: number;
  limit?: number;
  search?: string;
  announcementType?: string;
  priority?: string;
  status?: string;
  departmentId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    search: params.search || "",
    announcementType: params.announcementType || "all",
    priority: params.priority || "all",
    status: params.status || "all",
    departmentId: params.departmentId || "",
    fromDate: params.fromDate || "",
    toDate: params.toDate || ""
  });

  return apiRequest<{
    items: AnnouncementItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/api/communications/announcements?${qs.toString()}`, "GET");
}

export async function getAnnouncementById(id: string) {
  return apiRequest<AnnouncementItem>(`/api/communications/announcements/${id}`, "GET");
}

export async function saveAnnouncement(payload: FormData, id?: string) {
  return apiRequest<{ id?: string }>(
    id ? `/api/communications/announcements/${id}` : "/api/communications/announcements",
    id ? "PUT" : "POST",
    payload
  );
}

export async function publishAnnouncement(id: string) {
  return apiRequest(`/api/communications/announcements/${id}/publish`, "POST");
}

export async function archiveAnnouncement(id: string) {
  return apiRequest(`/api/communications/announcements/${id}/archive`, "POST");
}

export async function restoreAnnouncement(id: string) {
  return apiRequest(`/api/communications/announcements/${id}/restore`, "POST");
}

export async function deleteAnnouncement(id: string) {
  return apiRequest(`/api/communications/announcements/${id}`, "DELETE");
}

export async function markAnnouncementRead(id: string) {
  return apiRequest(`/api/communications/announcements/${id}/read`, "POST");
}

export async function acknowledgeAnnouncement(id: string) {
  return apiRequest(`/api/communications/announcements/${id}/acknowledge`, "POST");
}

export async function listEvents(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  departmentId?: string;
  date?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    search: params.search || "",
    category: params.category || "all",
    status: params.status || "all",
    departmentId: params.departmentId || "",
    date: params.date || "",
    fromDate: params.fromDate || "",
    toDate: params.toDate || ""
  });

  return apiRequest<{
    items: EventItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/api/communications/events?${qs.toString()}`, "GET");
}

export async function getEventById(id: string) {
  return apiRequest<EventItem>(`/api/communications/events/${id}`, "GET");
}

export async function saveEvent(payload: FormData, id?: string) {
  return apiRequest<{ id?: string }>(
    id ? `/api/communications/events/${id}` : "/api/communications/events",
    id ? "PUT" : "POST",
    payload
  );
}

export async function publishEvent(id: string) {
  return apiRequest(`/api/communications/events/${id}/publish`, "POST");
}

export async function cancelEvent(id: string) {
  return apiRequest(`/api/communications/events/${id}/cancel`, "POST");
}

export async function archiveEvent(id: string) {
  return apiRequest(`/api/communications/events/${id}/archive`, "POST");
}

export async function restoreEvent(id: string) {
  return apiRequest(`/api/communications/events/${id}/restore`, "POST");
}
export async function deleteEvent(id: string) {
  return apiRequest(`/api/communications/events/${id}`, "DELETE");
}

export async function rsvpToEvent(id: string, status: "Accepted" | "Declined" | "Maybe") {
  return apiRequest(`/api/communications/events/${id}/rsvp`, "POST", { status });
}

export async function getEventCalendar(params: { fromDate: string; toDate: string }) {
  const qs = new URLSearchParams({
    fromDate: params.fromDate,
    toDate: params.toDate
  });
  return apiRequest<{ items: EventItem[] }>(`/api/communications/events/calendar?${qs.toString()}`, "GET");
}

export async function getNotifications(limit = 8) {
  return apiRequest<{ items: NotificationItem[]; unreadCount: number }>(
    `/api/communications/notifications?limit=${limit}`,
    "GET"
  );
}

export async function markNotificationRead(id: string) {
  return apiRequest(`/api/communications/notifications/${id}/read`, "POST");
}

export async function markAllNotificationsRead() {
  return apiRequest(`/api/communications/notifications/read-all`, "POST");
}

export async function listPolicies(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isPublished?: string;
}) {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
    search: params.search || "",
    category: params.category || "all",
    isPublished: params.isPublished || "all"
  });

  return apiRequest<{
    items: PolicyListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/api/communications/policies?${qs.toString()}`, "GET");
}

export async function getPolicyById(id: string) {
  return apiRequest<PolicyDetail>(`/api/communications/policies/${id}`, "GET");
}

export async function savePolicy(
  payload: {
    title: string;
    category: string;
    summary: string;
    content: string;
    effectiveDate: string | null;
    isPublished: boolean;
    changeSummary?: string;
  },
  id?: string
) {
  return apiRequest<{ id?: string }>(
    id ? `/api/communications/policies/${id}` : "/api/communications/policies",
    id ? "PUT" : "POST",
    payload
  );
}

export async function acknowledgePolicy(id: string) {
  return apiRequest(`/api/communications/policies/${id}/acknowledge`, "POST");
}

export async function getPolicyAcknowledgmentReport(
  id: string,
  params?: {
    departmentId?: string;
    employeeId?: string;
    status?: "all" | "ACKNOWLEDGED" | "PENDING";
  }
) {
  const qs = new URLSearchParams({
    departmentId: params?.departmentId || "",
    employeeId: params?.employeeId || "",
    status: params?.status || "all"
  });

  return apiRequest<{
    policyId: string;
    policyTitle: string;
    versionNumber: number;
    totalEmployees: number;
    acknowledgedCount: number;
    pendingCount: number;
    items: PolicyReportItem[];
  }>(`/api/communications/policies/${id}/acknowledgments?${qs.toString()}`, "GET");
}
