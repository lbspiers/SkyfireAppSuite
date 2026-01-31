/**
 * Dev Note Service - API calls for Dev Portal Notes
 */
import axios from '../config/axios';

const BASE_URL = '/api/dev-notes';

export const getNotes = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

export const createNote = async (noteData) => {
  const response = await axios.post(BASE_URL, noteData);
  return response.data;
};

export const updateNote = async (noteId, updates) => {
  const response = await axios.put(`${BASE_URL}/${noteId}`, updates);
  return response.data;
};

export const deleteNote = async (noteId) => {
  const response = await axios.delete(`${BASE_URL}/${noteId}`);
  return response.data;
};

export const sendNote = async (noteId) => {
  const response = await axios.post(`${BASE_URL}/${noteId}/send`);
  return response.data;
};
