import { apiRequest } from "../../../services/api";

export type AssetStatus =
  | "IN_STOCK"
  | "ALLOCATED"
  | "REPAIR"
  | "RETIRED"
  | "LOST";

export type AssetUser = {
  _id: string;
  name: string;
  email: string;
  role?: "superadmin" | "admin" | "employee";
  status?: "Active" | "Inactive";
};

export type AssetAllocationItem = {
  _id: string;
  assetId: string;
  employeeId: AssetUser;
  allocatedOn: string;
  expectedReturnOn?: string | null;
  returnedOn?: string | null;
  allocatedBy?: AssetUser | null;
  notes?: string;
  returnCondition?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AssetItem = {
  _id: string;
  assetCode: string;
  serialNo?: string;
  name: string;
  category?: string;
  brand?: string;
  model?: string;

  purchaseDate?: string | null;
  warrantyEndDate?: string | null;
  cost?: number | null;

  status: AssetStatus;

  currentAllocation?: AssetAllocationItem | null;

  createdAt?: string;
  updatedAt?: string;
};

export type AssetListResponse = {
  items: AssetItem[];
  total: number;
  page: number;
  limit: number;
};

export type AssetListQuery = Partial<{
  q: string;
  status: AssetStatus;
  category: string;
  page: number;
  limit: number;
}>;

export type UpsertAssetPayload = Partial<{
  assetCode: string;
  serialNo: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  purchaseDate: string;
  warrantyEndDate: string;
  cost: number;
  status: AssetStatus;
}>;

export type AllocateAssetPayload = {
  employeeId: string;
  allocatedOn: string;
  expectedReturnOn?: string;
  notes?: string;
};

export type ReturnAssetPayload = {
  returnedOn: string;
  returnCondition?: string;
  notes?: string;
};

export async function getAssets(params: AssetListQuery = {}) {
  const qs = new URLSearchParams();

  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  if (params.category) qs.set("category", params.category);

  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));

  const url = qs.toString() ? `/api/assets?${qs.toString()}` : "/api/assets";
  return apiRequest<AssetListResponse>(url, "GET");
}

export async function createAsset(payload: UpsertAssetPayload) {
  return apiRequest<{ asset: AssetItem; message?: string }>(
    "/api/assets",
    "POST",
    payload,
  );
}

export async function updateAsset(
  assetId: string,
  payload: UpsertAssetPayload,
) {
  return apiRequest<{ asset: AssetItem; message?: string }>(
    `/api/assets/${assetId}`,
    "PUT",
    payload,
  );
}

export async function deleteAsset(assetId: string) {
  return apiRequest<{ success?: boolean; message: string }>(
    `/api/assets/${assetId}`,
    "DELETE",
  );
}

export async function allocateAsset(
  assetId: string,
  payload: AllocateAssetPayload,
) {
  return apiRequest<{ allocation: AssetAllocationItem; message?: string }>(
    `/api/assets/${assetId}/allocate`,
    "POST",
    payload,
  );
}

export async function returnAsset(
  assetId: string,
  payload: ReturnAssetPayload,
) {
  return apiRequest<{ allocation: AssetAllocationItem; message?: string }>(
    `/api/assets/${assetId}/return`,
    "POST",
    payload,
  );
}

export async function getAssetHistory(assetId: string) {
  return apiRequest<{ items: AssetAllocationItem[] }>(
    `/api/assets/${assetId}/history`,
    "GET",
  );
}
