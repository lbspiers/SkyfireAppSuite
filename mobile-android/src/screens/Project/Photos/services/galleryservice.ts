// src/screens/Project/Photos/services/galleryService.ts
import type { PhotoItem, MediaType } from "../types";
import axiosInstance from "../../../../api/axiosInstance";
import apiEndpoints from "../../../../config/apiEndPoint";

const LOG_SCOPE = "[galleryService]";
const log = (...a: any[]) => console.log(LOG_SCOPE, ...a);
const nowIso = () => new Date().toISOString();
const short = (v: any, len = 140) =>
  typeof v === "string" ? (v.length > len ? v.slice(0, len) + "…" : v) : v;

const slug = (s: string) =>
  (s || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function extFromPath(path: string): string | undefined {
  const m = /(?:\.([a-z0-9]+))$/i.exec((path || "").split("?")[0]);
  return m?.[1]?.toLowerCase();
}
function guessMimeFromExt(ext?: string): string | undefined {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "heic":
      return "image/heic";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    default:
      return undefined;
  }
}

/**
 * Some Android devices/emulators return content:// URIs.
 * fetch(file://) works but fetch(content://) can fail.
 * We try react-native-blob-util or rn-fetch-blob (whichever is installed)
 * to read base64 and create a Blob via data: URL.
 */
async function fileUriToBlobSmart(
  uri: string,
  contentTypeHint?: string
): Promise<Blob> {
  try {
    if (/^content:\/\//i.test(uri)) {
      let RB: any | undefined;
      try {
        RB = require("react-native-blob-util"); // preferred
        log("using react-native-blob-util for content://");
      } catch {
        try {
          RB = require("rn-fetch-blob"); // legacy
          log("using rn-fetch-blob for content://");
        } catch {
          RB = undefined;
        }
      }

      if (RB?.fs?.readFile) {
        const base64 = await RB.fs.readFile(uri, "base64");
        const dataUrl = `data:${
          contentTypeHint || "application/octet-stream"
        };base64,${base64}`;
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        // @ts-ignore: RN Blob has size
        log("blob(content://) size", (blob as any)?.size);
        return blob;
      }

      log("no blob util available; last-ditch fetch(content://)");
      const res = await fetch(uri);
      if (!res.ok) throw new Error(`fetch(content://) failed ${res.status}`);
      return await res.blob();
    }

    // file:// or http(s)://
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`fetch(${uri}) failed ${res.status}`);
    const blob = await res.blob();
    // @ts-ignore
    log("blob(file/http) size", (blob as any)?.size);
    return blob;
  } catch (e: any) {
    log("fileUriToBlobSmart ERROR", e?.message || e);
    throw e;
  }
}

async function putToS3(presignedUrl: string, blob: Blob, contentType?: string) {
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = contentType;

  const urlForLog = short(presignedUrl.split("?")[0], 200);
  log("S3 PUT", {
    url: urlForLog,
    contentType /* size: (blob as any)?.size */,
  });

  const putRes = await fetch(presignedUrl, {
    method: "PUT",
    headers,
    body: blob,
  });

  const ok = putRes.ok;
  const status = putRes.status;
  const text = !ok ? await putRes.text().catch(() => "") : "";
  log("S3 →", { ok, status, err: short(text) });

  if (!ok) throw new Error(`S3 upload failed (${status}) ${short(text, 200)}`);
  return presignedUrl.split("?")[0]; // public URL
}

async function getPresignedUrl(params: {
  companyId: string;
  directory: string;
  fileName: string;
}) {
  const { companyId, directory, fileName } = params;
  const URL = `${apiEndpoints.BASE_URL}/company/${companyId}/file-upload-url`;
  log("presign GET", { URL, params: { directory, fileName } });

  const res = await axiosInstance.get(URL, { params: { directory, fileName } });
  const { upload_url, key } = (res.data as any) || {};
  log("presign ←", { hasUrl: !!upload_url, key: short(key, 160) });

  if (!upload_url || !key)
    throw new Error("Invalid response from file-upload-url");
  return { uploadUrl: upload_url as string, key: key as string };
}

function normalizeMediaRow(row: any): PhotoItem {
  const captured =
    row?.capturedAt ?? row?.captured_at ?? row?.created_at ?? nowIso();
  const created =
    row?.createdAt ?? row?.created_at ?? row?.captured_at ?? captured;

  const normalized: PhotoItem = {
    id: row.id,
    projectId: row.projectId ?? row.project_uuid,
    url: row.url,
    thumbUrl: row.thumbUrl ?? row.thumb_url ?? null,
    posterUrl: row.posterUrl ?? row.poster_url ?? null,
    section: row.section,
    tag: row.tag ?? null,
    fileName: row.fileName ?? row.file_name ?? null,
    originalNotes: row.originalNotes ?? row.original_notes ?? row.note ?? null,
    aiSummary: row.aiSummary ?? row.ai_summary ?? null,
    capturedAt:
      typeof captured === "string"
        ? captured
        : new Date(captured).toISOString(),
    createdAt:
      typeof created === "string" ? created : new Date(created).toISOString(),
    mediaType:
      (row.mediaType as MediaType) ||
      (row.type as MediaType) ||
      (row.media_type as MediaType) ||
      "photo",
    durationMs: row.durationMs ?? row.duration_ms ?? null,
    mimeType: row.mimeType ?? row.mime_type ?? null,
    fileSize: row.fileSize ?? row.file_size ?? null,
  };

  log("normalize", {
    id: normalized.id,
    type: normalized.mediaType,
    url: short(normalized.url, 140),
  });
  return normalized;
}

/** =========================
 *  Public API
 *  ========================= */

export async function fetchProjectPhotos(
  projectId: string,
  filters?: { section?: string; tag?: string; type?: MediaType }
): Promise<PhotoItem[]> {
  const path =
    apiEndpoints.PROJECT?.PHOTOS?.LIST(projectId) ??
    `/project/${projectId}/photos`;
  const URL = `${apiEndpoints.BASE_URL}${path}`;
  log("LIST GET", { URL, filters });

  const res = await axiosInstance.get(URL, { params: filters });
  const rows = (res.data as any[]) || [];
  log("LIST ←", { count: rows.length });
  return rows.map(normalizeMediaRow);
}

export async function deletePhotos(
  projectId: string,
  ids: string[]
): Promise<void> {
  if (!ids?.length) return;
  log("DELETE", { projectId, ids });

  if (ids.length === 1) {
    const path =
      apiEndpoints.PROJECT?.PHOTOS?.DELETE_ONE(projectId, ids[0]) ??
      `/project/${projectId}/photos/${ids[0]}`;
    const URL = `${apiEndpoints.BASE_URL}${path}`;
    await axiosInstance.delete(URL);
  } else {
    const path =
      apiEndpoints.PROJECT?.PHOTOS?.BULK_DELETE(projectId) ??
      `/project/${projectId}/photos/bulk-delete`;
    const URL = `${apiEndpoints.BASE_URL}${path}`;
    await axiosInstance.post(URL, { ids });
  }
  log("DELETE ← ok");
}

export async function uploadCapturedPhoto(params: {
  companyId: string;
  projectId: string;
  localUri: string;
  section: string;
  tag?: string | null;
  note?: string | null;
  aiSummary?: string | null;
  capturedAt?: string;
}) {
  const {
    companyId,
    projectId,
    localUri,
    section,
    tag = null,
    note = null,
    aiSummary = null,
    capturedAt = nowIso(),
  } = params;

  const ext = extFromPath(localUri) || "jpg";
  const contentType = guessMimeFromExt(ext) || "image/jpeg";

  const sectionSlug = slug(section || "photos");
  const tagSlug = slug(tag || "untagged");
  const ts = Date.now();

  const fileName = `photo_${ts}_${sectionSlug}_${tagSlug}.${ext}`;
  const directory = `projects/${projectId}/photos/${sectionSlug}`;

  log("UPLOAD photo →", {
    companyId,
    projectId,
    section,
    tag,
    localUri,
    fileName,
    directory,
    contentType,
  });

  const { uploadUrl } = await getPresignedUrl({
    companyId,
    directory,
    fileName,
  });
  const blob = await fileUriToBlobSmart(localUri, contentType);
  const publicUrl = await putToS3(uploadUrl, blob, contentType);

  const path =
    apiEndpoints.PROJECT?.PHOTOS?.CREATE(projectId) ??
    `/project/${projectId}/photos`;
  const URL = `${apiEndpoints.BASE_URL}${path}`;

  const body = {
    url: publicUrl,
    section,
    tag: tag || undefined,
    capturedAt,
    type: "photo" as MediaType,
    originalNotes: note ?? undefined,
    aiSummary: aiSummary ?? undefined,
    fileName,
  };

  log("REGISTER photo POST", {
    URL,
    body: { ...body, url: short(publicUrl, 160) },
  });
  const res = await axiosInstance.post(URL, body);
  log("REGISTER photo ← ok");
  return normalizeMediaRow(res.data);
}

export async function uploadCapturedVideo(params: {
  companyId: string;
  projectId: string;
  localUri: string;
  section: string;
  tag?: string | null;
  posterUri?: string;
  durationMs?: number;
  note?: string | null;
  aiSummary?: string | null;
  capturedAt?: string;
}) {
  const {
    companyId,
    projectId,
    localUri,
    section,
    tag = null,
    posterUri,
    durationMs,
    note = null,
    aiSummary = null,
    capturedAt = nowIso(),
  } = params;

  const ext = extFromPath(localUri) || "mp4";
  const contentType = guessMimeFromExt(ext) || "video/mp4";

  const sectionSlug = slug(section || "videos");
  const tagSlug = slug(tag || "untagged");
  const ts = Date.now();

  const fileName = `video_${ts}_${sectionSlug}_${tagSlug}.${ext}`;
  const directory = `projects/${projectId}/photos/${sectionSlug}`;

  log("UPLOAD video →", {
    companyId,
    projectId,
    section,
    tag,
    localUri,
    fileName,
    directory,
    contentType,
    durationMs,
  });

  const { uploadUrl } = await getPresignedUrl({
    companyId,
    directory,
    fileName,
  });
  const blob = await fileUriToBlobSmart(localUri, contentType);
  const publicUrl = await putToS3(uploadUrl, blob, contentType);

  // optional poster
  let posterUrl: string | undefined;
  if (posterUri) {
    const posterExt = extFromPath(posterUri) || "jpg";
    const posterCT = guessMimeFromExt(posterExt) || "image/jpeg";
    const posterName = `video_${ts}_${sectionSlug}_${tagSlug}_poster.${posterExt}`;
    const { uploadUrl: posterSigned } = await getPresignedUrl({
      companyId,
      directory,
      fileName: posterName,
    });
    const pBlob = await fileUriToBlobSmart(posterUri, posterCT);
    posterUrl = await putToS3(posterSigned, pBlob, posterCT);
  }

  const path =
    apiEndpoints.PROJECT?.PHOTOS?.CREATE(projectId) ??
    `/project/${projectId}/photos`;
  const URL = `${apiEndpoints.BASE_URL}${path}`;

  const body = {
    url: publicUrl,
    section,
    tag: tag || undefined,
    capturedAt,
    type: "video" as MediaType,
    durationMs: durationMs ?? undefined,
    posterUrl,
    originalNotes: note ?? undefined,
    aiSummary: aiSummary ?? undefined,
    fileName,
  };

  log("REGISTER video POST", {
    URL,
    body: { ...body, url: short(publicUrl, 160) },
  });
  const res = await axiosInstance.post(URL, body);
  log("REGISTER video ← ok");
  return normalizeMediaRow(res.data);
}

/** Notes */
export async function saveSectionNotes(params: {
  projectId: string;
  section: string;
  note: string | null;
  aiSummary: string | null;
}) {
  const { projectId, section, note, aiSummary } = params;
  const path =
    apiEndpoints.PROJECT?.PHOTOS?.SECTION_NOTES_UPSERT(projectId) ??
    `/project/${projectId}/section-notes`;
  const URL = `${apiEndpoints.BASE_URL}${path}`;
  log("NOTES upsert POST", {
    URL,
    body: { section, note: short(note, 200), aiSummary: short(aiSummary, 200) },
  });

  try {
    await axiosInstance.post(URL, { section, note, aiSummary });
    log("NOTES upsert ← ok");
  } catch (e: any) {
    log("NOTES upsert ERROR", e?.message || e);
    throw e;
  }
}

export async function clearSectionNotes(params: {
  projectId: string;
  section: string;
}) {
  const { projectId, section } = params;
  const path =
    apiEndpoints.PROJECT?.PHOTOS?.SECTION_NOTES_CLEAR(projectId) ??
    `/project/${projectId}/section-notes`;
  const URL = `${apiEndpoints.BASE_URL}${path}`;
  log("NOTES clear DELETE", { URL, body: { section } });

  try {
    await axiosInstance.delete(URL, { data: { section } });
    log("NOTES clear ← ok");
  } catch (e: any) {
    log("NOTES clear ERROR", e?.message || e);
    throw e;
  }
}
