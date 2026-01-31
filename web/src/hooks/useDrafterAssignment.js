import { useState, useEffect, useCallback, useRef } from 'react';
import { drafterAssignmentService } from '../services/drafterAssignmentService';

const POLL_INTERVAL = 30000; // 30 seconds for question updates

/**
 * Custom hook for drafter assignment workspace
 * @param {string} assignmentUuid - Assignment UUID
 * @returns {Object} Assignment data and methods
 */
export const useDrafterAssignment = (assignmentUuid) => {
  const [assignment, setAssignment] = useState(null);
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);

  // Fetch assignment data
  const fetchAssignment = useCallback(async () => {
    if (!assignmentUuid) return;

    try {
      setError(null);
      const data = await drafterAssignmentService.getAssignment(assignmentUuid);
      setAssignment(data.assignment);
      setProject(data.project);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch assignment:', err);
      setError(err);
      setLoading(false);
    }
  }, [assignmentUuid]);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    if (!assignmentUuid) return;

    try {
      const filesData = await drafterAssignmentService.getFiles(assignmentUuid);
      setFiles(filesData);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  }, [assignmentUuid]);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    if (!assignmentUuid) return;

    try {
      const questionsData = await drafterAssignmentService.getQuestions(assignmentUuid);
      setQuestions(questionsData);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    }
  }, [assignmentUuid]);

  // Upload file
  const uploadFile = useCallback(async (file, fileType) => {
    if (!assignmentUuid) return;

    try {
      // Get presigned upload URL
      const { uploadUrl, fileKey } = await drafterAssignmentService.getUploadUrl(
        assignmentUuid,
        file.name,
        fileType,
        file.type
      );

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3');
      }

      // Register file with API
      await drafterAssignmentService.registerFile(assignmentUuid, {
        fileName: file.name,
        fileType,
        fileUrl: fileKey,
        fileSizeBytes: file.size,
        mimeType: file.type
      });

      // Refresh file list
      await fetchFiles();

      return true;
    } catch (err) {
      console.error('Failed to upload file:', err);
      throw err;
    }
  }, [assignmentUuid, fetchFiles]);

  // Delete file
  const deleteFile = useCallback(async (fileUuid) => {
    if (!assignmentUuid) return;

    try {
      await drafterAssignmentService.deleteFile(assignmentUuid, fileUuid);
      await fetchFiles();
      return true;
    } catch (err) {
      console.error('Failed to delete file:', err);
      throw err;
    }
  }, [assignmentUuid, fetchFiles]);

  // Ask question
  const askQuestion = useCallback(async (questionText) => {
    if (!assignmentUuid) return;

    try {
      await drafterAssignmentService.askQuestion(assignmentUuid, questionText);
      await fetchQuestions();
      return true;
    } catch (err) {
      console.error('Failed to ask question:', err);
      throw err;
    }
  }, [assignmentUuid, fetchQuestions]);

  // Complete assignment
  const completeAssignment = useCallback(async () => {
    if (!assignmentUuid) return;

    try {
      const result = await drafterAssignmentService.completeAssignment(assignmentUuid);
      return result;
    } catch (err) {
      console.error('Failed to complete assignment:', err);
      throw err;
    }
  }, [assignmentUuid]);

  // Release assignment
  const releaseAssignment = useCallback(async (reason, notes) => {
    if (!assignmentUuid) return;

    try {
      const result = await drafterAssignmentService.releaseAssignment(assignmentUuid, reason, notes);
      return result;
    } catch (err) {
      console.error('Failed to release assignment:', err);
      throw err;
    }
  }, [assignmentUuid]);

  // Initial fetch
  useEffect(() => {
    fetchAssignment();
    fetchFiles();
    fetchQuestions();
  }, [fetchAssignment, fetchFiles, fetchQuestions]);

  // Poll for question updates
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchQuestions();
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchQuestions]);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      fetchAssignment();
      fetchFiles();
      fetchQuestions();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchAssignment, fetchFiles, fetchQuestions]);

  return {
    assignment,
    project,
    files,
    questions,
    loading,
    error,
    uploadFile,
    deleteFile,
    askQuestion,
    completeAssignment,
    releaseAssignment,
    refresh: () => {
      fetchAssignment();
      fetchFiles();
      fetchQuestions();
    }
  };
};
