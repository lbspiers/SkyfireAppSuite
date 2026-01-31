// src/api/systemDetails.service.ts

import axiosInstance from "./axiosInstance";
import apiEndpoints from "../config/apiEndPoint";

/** Remove only `undefined` values; keep null/empty so we can clear DB columns. */
function pruneUndefined<T extends Record<string, any>>(obj: T): T {
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
  return Object.fromEntries(entries) as T;
}

/**
 * Fetch the system details row for a project.
 * Returns the row object or null if none exists (404).
 */
export async function fetchSystemDetails(projectUuid: string) {
  try {
    const path =
      apiEndpoints.PROJECT?.SYSTEM_DETAILS?.GET(projectUuid) ??
      `/project/${projectUuid}/system-details`;
    const URL = `${apiEndpoints.BASE_URL}${path}`;

    const resp = await axiosInstance.get(URL);
    if (resp.status === 200 && resp.data?.success) {
      return resp.data.data; // the system details row
    }
    throw new Error(
      `Unexpected fetchSystemDetails response: ${JSON.stringify(resp.data)}`
    );
  } catch (err: any) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

/**
 * Upsert (create/update) system details for a project (PUT).
 * Returns the created/updated row.
 */
export async function saveSystemDetails(
  projectUuid: string,
  payload: Record<string, any>
) {
  const path =
    apiEndpoints.PROJECT?.SYSTEM_DETAILS?.UPSERT(projectUuid) ??
    `/project/${projectUuid}/system-details`;
  const URL = `${apiEndpoints.BASE_URL}${path}`;

  const body = pruneUndefined(payload);

  const resp = await axiosInstance.put(URL, body);
  if (resp.status === 200 && resp.data?.success) {
    return resp.data.data;
  }
  throw new Error(
    `Unexpected saveSystemDetails response: ${JSON.stringify(resp.data)}`
  );
}

/**
 * Partial update (PATCH) — not used yet, but handy if backend supports it.
 */
export async function patchSystemDetails(
  projectUuid: string,
  payload: Record<string, any>
) {
  const path =
    apiEndpoints.PROJECT?.SYSTEM_DETAILS?.UPSERT(projectUuid) ??
    `/project/${projectUuid}/system-details`;
  const URL = `${apiEndpoints.BASE_URL}${path}`;

  const body = pruneUndefined(payload);

  const resp = await axiosInstance.patch(URL, body);
  if (resp.status === 200 && resp.data?.success) {
    return resp.data.data;
  }
  throw new Error(
    `Unexpected patchSystemDetails response: ${JSON.stringify(resp.data)}`
  );
}
