/**
 * Revision Service
 *
 * Handles AHJ and Utility revision requests including:
 * - S3 presigned URL uploads
 * - CRUD operations for revisions
 * - Document download URLs
 *
 * Backend: /project/:projectId/revisions/*
 */

import axiosInstance from '../api/axiosInstance';

// Types
export interface RevisionRequest {
  id: string;
  projectId: string;
  companyId: string;
  requesterId: string;
  supportTicketId: number | null;
  revisionType: 'ahj' | 'utility';
  status: 'pending' | 'in_progress' | 'complete';
  reviewerName: string | null;
  reviewerPhone: string | null;
  reviewerEmail: string | null;
  documentUrl: string;
  documentFilename: string;
  documentSize: number | null;
  userNotes: string | null;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateRevisionParams {
  revisionType: 'ahj' | 'utility';
  reviewerName?: string;
  reviewerPhone?: string;
  reviewerEmail?: string;
  notes?: string;
}

export interface ListRevisionsParams {
  type?: 'ahj' | 'utility';
  status?: 'pending' | 'in_progress' | 'complete';
}

export interface UploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
}

export interface DocumentUrlResponse {
  downloadUrl: string;
  filename: string;
  expiresIn: number;
}

/**
 * Get a presigned S3 URL for uploading a revision document
 */
async function getUploadUrl(projectUuid: string, fileName: string, contentType: string): Promise<UploadUrlResponse> {
  const response = await axiosInstance.get(
    `/project/${projectUuid}/revisions/upload-url`,
    { params: { fileName, contentType } }
  );

  if (response.data.status !== 'SUCCESS') {
    throw new Error(response.data.message || 'Failed to get upload URL');
  }

  return response.data.data;
}

/**
 * Upload a file directly to S3 using the presigned URL
 */
async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
  }
}

/**
 * List revisions for a project
 */
async function list(
  projectUuid: string,
  params?: ListRevisionsParams
): Promise<RevisionRequest[]> {
  const response = await axiosInstance.get(
    `/project/${projectUuid}/revisions`,
    { params }
  );

  if (response.data.status !== 'SUCCESS') {
    throw new Error(response.data.message || 'Failed to list revisions');
  }

  return response.data.data;
}

/**
 * Get a single revision by ID
 */
async function get(projectUuid: string, revisionId: string): Promise<RevisionRequest> {
  const response = await axiosInstance.get(
    `/project/${projectUuid}/revisions/${revisionId}`
  );

  if (response.data.status !== 'SUCCESS') {
    throw new Error(response.data.message || 'Failed to get revision');
  }

  return response.data.data;
}

/**
 * Submit a new revision request
 *
 * Flow:
 * 1. Get presigned S3 upload URL
 * 2. Upload file directly to S3
 * 3. Create revision record in database
 */
async function submitRevision(
  projectUuid: string,
  file: File,
  params: CreateRevisionParams
): Promise<RevisionRequest> {
  // Step 1: Get presigned upload URL
  const { uploadUrl, s3Key } = await getUploadUrl(projectUuid, file.name, file.type || 'application/octet-stream');

  // Step 2: Upload file directly to S3
  await uploadToS3(uploadUrl, file);

  // Step 3: Create revision record in database
  const response = await axiosInstance.post(
    `/project/${projectUuid}/revisions`,
    {
      revisionType: params.revisionType,
      documentUrl: s3Key,
      documentFilename: file.name,
      documentSize: file.size,
      reviewerName: params.reviewerName || null,
      reviewerPhone: params.reviewerPhone || null,
      reviewerEmail: params.reviewerEmail || null,
      userNotes: params.notes || null,
    }
  );

  if (response.data.status !== 'SUCCESS') {
    throw new Error(response.data.message || 'Failed to create revision');
  }

  return response.data.data;
}

/**
 * Update a revision (status, notes, etc.)
 */
async function update(
  projectUuid: string,
  revisionId: string,
  updates: Partial<{
    status: 'pending' | 'in_progress' | 'complete';
    userNotes: string;
    aiSummary: string;
  }>
): Promise<RevisionRequest> {
  const response = await axiosInstance.patch(
    `/project/${projectUuid}/revisions/${revisionId}`,
    updates
  );

  if (response.data.status !== 'SUCCESS') {
    throw new Error(response.data.message || 'Failed to update revision');
  }

  return response.data.data;
}

/**
 * Delete a revision
 */
async function remove(projectUuid: string, revisionId: string): Promise<void> {
  const response = await axiosInstance.delete(
    `/project/${projectUuid}/revisions/${revisionId}`
  );

  if (response.data.status !== 'SUCCESS') {
    throw new Error(response.data.message || 'Failed to delete revision');
  }
}

/**
 * Get a presigned download URL for a revision's document
 */
async function getDocumentUrl(
  projectUuid: string,
  revisionId: string
): Promise<DocumentUrlResponse> {
  const response = await axiosInstance.get(
    `/project/${projectUuid}/revisions/${revisionId}/document-url`
  );

  if (response.data.status !== 'SUCCESS') {
    throw new Error(response.data.message || 'Failed to get document URL');
  }

  return response.data.data;
}

const revisionService = {
  list,
  get,
  submitRevision,
  update,
  delete: remove,
  getDocumentUrl,
  getUploadUrl,
};

export default revisionService;
