// client/src/features/chat/api/chatApi.js

import axiosInstance from '../../../axiosConfig';

const handleResponse = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }
  throw new Error(`API error: ${response.status} ${response.statusText}`);
};

export const createThread = () => 
  axiosInstance.post('/api/chat/create-thread').then(handleResponse);

export const sendMessage = (threadId, message) => 
  axiosInstance.post('/api/chat/stream/message', { threadId, message }).then(handleResponse);

export const uploadFile = (formData) => 
  axiosInstance.post('/api/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(handleResponse);

export const removeFile = (fileId) => 
  axiosInstance.delete(`/api/chat/files/${fileId}`).then(handleResponse);

export const endChat = (threadId) => 
  axiosInstance.post('/api/chat/end', { threadId }).then(handleResponse);