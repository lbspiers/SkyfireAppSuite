/**
 * Dev Task Service - API calls for Dev Portal
 */
import axios from '../config/axios';

const BASE_URL = '/api/dev-tasks';

export const getTasks = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await axios.post(BASE_URL, taskData);
  return response.data;
};

export const updateTask = async (taskId, updates) => {
  const response = await axios.put(`${BASE_URL}/${taskId}`, updates);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await axios.delete(`${BASE_URL}/${taskId}`);
  return response.data;
};

export const bulkImportTasks = async (tasks) => {
  const response = await axios.post(`${BASE_URL}/bulk`, { tasks });
  return response.data;
};

export const startTasks = async (taskIds) => {
  const response = await axios.post(`${BASE_URL}/start-tasks`, { taskIds });
  return response.data;
};

export const getAverages = async () => {
  const response = await axios.get(`${BASE_URL}/averages`);
  return response.data;
};

export const getAnalytics = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/analytics`);
    return response.data;
  } catch (error) {
    console.error('[DevTask] Failed to fetch analytics:', error);
    throw error;
  }
};

export const resetTimer = async (taskUuid) => {
  const response = await axios.post(`${BASE_URL}/${taskUuid}/reset-timer`);
  return response.data;
};

export const bulkCompleteCSV = async (csvContent) => {
  const response = await axios.post(`${BASE_URL}/bulk-complete-csv`, { csvContent });
  return response.data;
};
