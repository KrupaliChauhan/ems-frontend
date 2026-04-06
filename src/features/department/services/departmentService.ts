import { apiRequest } from "../../../services/api";
//import type { ApiResponse } from "../services/api";

export type DepartmentItem = {
  id: string;
  name: string;
  status: "Active" | "Inactive";
};

export type DepartmentListResponse = {
  items: DepartmentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function listDepartments(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const search = (params.search ?? "").trim();

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (search) qs.set("search", search);

  return apiRequest<DepartmentListResponse>(
    `/api/departments?${qs.toString()}`,
  );
}
export async function createDepartment(payload: {
  name: string;
  status: "Active" | "Inactive";
}) {
  return apiRequest(`/api/departments`, "POST", payload);
}

export async function updateDepartment(
  id: string,
  payload: {
    name: string;
    status: "Active" | "Inactive";
  },
) {
  return apiRequest(`/api/departments/${id}`, "PUT", payload);
}

export async function deleteDepartment(id: string) {
  return apiRequest(`/api/departments/${id}`, "DELETE");
}
