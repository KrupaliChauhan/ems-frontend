import { apiRequest } from "../../../services/api";

export type ProjectStatus = "active" | "pending" | "completed";

export type ProjectEmployee = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export type ProjectLeader = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

export type ProjectItem = {
  _id: string;
  name: string;
  description: string;
  timeLimit: string;
  startDate: string;
  status: ProjectStatus;
  employees: ProjectEmployee[];
  createdBy?: ProjectLeader;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectListResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: Array<{
    _id: string;
    name: string;
    startDate: string;
    timeLimit: string;
    status: ProjectStatus;
    employees: ProjectEmployee[];
    createdBy?: ProjectLeader;
    createdAt?: string;
  }>;
};

export type ProjectPayload = {
  name: string;
  description: string;
  timeLimit: string;
  startDate: string; // "YYYY-MM-DD"
  status: ProjectStatus;
  employees: string[]; // user ids
};

export async function createProject(payload: ProjectPayload) {
  return apiRequest<{ message: string; projectId: string }>(
    "/api/projects",
    "POST",
    payload,
  );
}

export async function listProjects(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    search: params.search || "",
    status: params.status || "all",
  });

  return apiRequest<ProjectListResponse>(
    `/api/projects?${q.toString()}`,
    "GET",
  );
}

export async function getProjectById(id: string) {
  return apiRequest<ProjectItem>(`/api/projects/${id}`, "GET");
}
export async function getProjects(page = 1, limit = 10) {
  return apiRequest<{
    items: ProjectItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/api/projects?page=${page}&limit=${limit}`);
}
export async function updateProject(id: string, payload: ProjectPayload) {
  return apiRequest<{ message: string; project: ProjectItem }>(
    `/api/projects/${id}`,
    "PUT",
    payload,
  );
}

export async function softDeleteProject(id: string) {
  return apiRequest<{ message: string }>(`/api/projects/${id}`, "DELETE");
}

export async function myProjects(params?: { search?: string; status?: string }) {
  const qs = new URLSearchParams({
    search: params?.search || "",
    status: params?.status || "all"
  });
  return apiRequest<{ items: ProjectItem[] }>(`/api/projects/my?${qs.toString()}`, "GET");
}
