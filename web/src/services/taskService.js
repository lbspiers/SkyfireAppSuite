/**
 * Task Service - Handles task CRUD and queries
 */
import axios from '../config/axios';

/**
 * Get tasks assigned to current user
 * @param {string|null} status - Optional status filter
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Task[] }
 */
export const getMyTasks = async (status = null) => {
  try {
    const params = status ? { status } : {};
    const response = await axios.get('/tasks/assigned-to-me', { params });
    return response.data;
  } catch (error) {
    console.error('[TaskService] Error fetching my tasks:', error);
    throw new Error(error?.response?.data?.message || 'Unable to load tasks');
  }
};

/**
 * Get tasks created/assigned by current user
 * @param {string|null} status - Optional status filter
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Task[] }
 */
export const getTasksIAssigned = async (status = null) => {
  try {
    const params = status ? { status } : {};
    const response = await axios.get('/tasks/assigned-by-me', { params });
    return response.data;
  } catch (error) {
    console.error('[TaskService] Error fetching assigned tasks:', error);
    throw new Error(error?.response?.data?.message || 'Unable to load tasks');
  }
};

/**
 * Get tasks for a specific project
 * @param {string} projectUuid - Project UUID
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Task[] }
 */
export const getProjectTasks = async (projectUuid) => {
  try {
    const response = await axios.get(`/tasks/project/${projectUuid}`);
    return response.data;
  } catch (error) {
    console.error('[TaskService] Error fetching project tasks:', error);
    throw new Error(error?.response?.data?.message || 'Unable to load tasks');
  }
};

/**
 * Create a new task
 * @param {Object} taskData - Task data
 * @param {string} taskData.title - Task title
 * @param {string} [taskData.description] - Task description
 * @param {string} [taskData.assigneeUuid] - UUID of assigned user
 * @param {string} [taskData.projectUuid] - UUID of associated project
 * @param {string} [taskData.dueDate] - Due date (ISO string)
 * @param {string} [taskData.priority] - Priority level (low, normal, high, urgent)
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Task }
 */
export const createTask = async (taskData) => {
  try {
    const response = await axios.post('/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error('[TaskService] Error creating task:', error);
    throw new Error(error?.response?.data?.message || 'Unable to create task');
  }
};

/**
 * Update task status
 * @param {number} taskId - Task ID
 * @param {string} status - New status (pending, in_progress, completed)
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Task }
 */
export const updateTaskStatus = async (taskId, status) => {
  try {
    const response = await axios.put(`/tasks/${taskId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('[TaskService] Error updating task:', error);
    throw new Error(error?.response?.data?.message || 'Unable to update task');
  }
};

/**
 * Update task details
 * @param {number} taskId - Task ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - { status: 'SUCCESS', data: Task }
 */
export const updateTask = async (taskId, updates) => {
  try {
    const response = await axios.put(`/tasks/${taskId}`, updates);
    return response.data;
  } catch (error) {
    console.error('[TaskService] Error updating task:', error);
    throw new Error(error?.response?.data?.message || 'Unable to update task');
  }
};

/**
 * Delete a task
 * @param {number} taskId - Task ID
 * @returns {Promise<Object>} - { status: 'SUCCESS', message: string }
 */
export const deleteTask = async (taskId) => {
  try {
    const response = await axios.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('[TaskService] Error deleting task:', error);
    throw new Error(error?.response?.data?.message || 'Unable to delete task');
  }
};
