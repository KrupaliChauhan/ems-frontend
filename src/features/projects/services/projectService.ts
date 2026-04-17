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
  members: ProjectEmployee[];
  employees: ProjectEmployee[];
  projectLeader?: ProjectLeader;
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
    members: ProjectEmployee[];
    employees: ProjectEmployee[];
    projectLeader?: ProjectLeader;
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
  members: string[]; // user ids
};

function normalizeProjectItem<T extends {
  members?: ProjectEmployee[];
  employees?: ProjectEmployee[];
  projectLeader?: ProjectLeader;
  createdBy?: ProjectLeader;
}>(project: T): T & {
  members: ProjectEmployee[];
  employees: ProjectEmployee[];
  projectLeader?: ProjectLeader;
  createdBy?: ProjectLeader;
} {
  const members = project.members && project.members.length > 0
    ? project.members
    : project.employees || [];
  const projectLeader = project.projectLeader || project.createdBy;

  return {
    ...project,
    members,
    employees: members,
    projectLeader,
    createdBy: projectLeader
  };
}

export async function createProject(payload: ProjectPayload) {
  const response = await apiRequest<{ project: ProjectItem; projectId?: string }>(
    "/api/projects",
    "POST",
    payload,
  );

  return {
    projectId: response.projectId ?? response.project._id,
    project: normalizeProjectItem(response.project)
  };
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

  const response = await apiRequest<ProjectListResponse>(
    `/api/projects?${q.toString()}`,
    "GET",
  );

  return {
    ...response,
    items: response.items.map((project) => normalizeProjectItem(project))
  };
}

export async function getProjectById(id: string) {
  const response = await apiRequest<ProjectItem>(`/api/projects/${id}`, "GET");
  return normalizeProjectItem(response);
}
export async function getProjects(page = 1, limit = 10) {
  const response = await apiRequest<{
    items: ProjectItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/api/projects?page=${page}&limit=${limit}`);

  return {
    ...response,
    items: response.items.map((project) => normalizeProjectItem(project))
  };
}
export async function updateProject(id: string, payload: ProjectPayload) {
  const response = await apiRequest<{ project: ProjectItem; projectId?: string }>(
    `/api/projects/${id}`,
    "PUT",
    payload,
  );

  return {
    projectId: response.projectId ?? response.project._id,
    project: normalizeProjectItem(response.project)
  };
}

export async function softDeleteProject(id: string) {
  return apiRequest<{ message: string }>(`/api/projects/${id}`, "DELETE");
}

export async function myProjects(params?: { search?: string; status?: string }) {
  const qs = new URLSearchParams({
    search: params?.search || "",
    status: params?.status || "all"
  });
  const response = await apiRequest<{ items: ProjectItem[] }>(`/api/projects/my?${qs.toString()}`, "GET");
  return {
    items: response.items.map((project) => normalizeProjectItem(project))
  };
}
