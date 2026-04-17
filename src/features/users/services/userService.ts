import { apiRequest } from "../../../services/api";
import type { UserRole } from "../../auth/services/auth";

export type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  status?: "Active" | "Inactive";
  isDeleted?: boolean;
  joiningDate?: string | null;
  teamLeaderId?: string | null;
  teamLeaderName?: string;
  department?: string;
  designation?: string;
};

export type UserDetail = UserItem & {
  departmentId: string;
  designationId: string;
  teamLeaderId: string;
  teamLeaderName?: string;
  joiningDate: string;
};

export type UsersResponse = {
  items: UserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function fetchUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: "Active" | "Inactive";
}): Promise<UsersResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const search = (params.search ?? "").trim();
  const status = params.status ?? "";

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);

  return apiRequest<UsersResponse>(`/api/users?${qs.toString()}`);
}

export async function fetchProjectAssignableEmployees() {
  return apiRequest<{
    items: {
      _id: string;
      name: string;
      email: string;
      role: UserRole;
      isActive?: boolean;
      status?: "Active" | "Inactive";
    }[];
  }>("/api/users/project-assignable-employees", "GET");
}

export async function fetchUserById(id: string) {
  return apiRequest<UserDetail>(`/api/users/${id}`, "GET");
}

export async function createUser(payload: {
  name: string;
  email: string;
  role: UserRole;
  joiningDate: string;
  teamLeaderId?: string;
  departmentId?: string;
  designationId?: string;
}) {
  return apiRequest<{ id: string; message: string }>(
    `/api/users`,
    "POST",
    payload,
  );
}
export async function fetchActiveUsers() {
  return apiRequest<{
    items: {
      _id: string;
      name: string;
      email: string;
      role: string;
      status?: string;
    }[];
  }>("/api/users?status=Active&limit=1000");
}
export async function updateUserStatus(
  id: string,
  isActive: boolean,
) {
  return apiRequest<UserItem>(`/api/users/${id}/status`, "PATCH", { isActive });
}
export async function updateUser(
  id: string,
  payload: {
    name: string;
    email: string;
    role: UserRole;
    joiningDate: string;
    teamLeaderId?: string;
    departmentId?: string;
    designationId?: string;
    status?: "Active" | "Inactive";
    isActive?: boolean;
  },
) {
  return apiRequest(`/api/users/${id}`, "PUT", payload);
}

export async function deleteUser(id: string) {
  return apiRequest(`/api/users/${id}`, "DELETE");
}
