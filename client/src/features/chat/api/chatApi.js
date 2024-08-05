import axiosInstance from '../../../axiosConfig';

const handleResponse = (response) => {
  if (response.status >= 200 && response.status < 300) {
    return response.data;
  }
  throw new Error(`API error: ${response.status} ${response.statusText}`);
};

export const initializeAssistant = () => 
  axiosInstance.post('/api/chat/initialize').then(handleResponse);

export const startConversation = () => 
  axiosInstance.post('/api/chat/start', { message: "Start conversation" }).then(handleResponse);

export const sendMessage = (message) => 
  axiosInstance.post('/api/chat/stream/message', { message }).then(handleResponse);

export const uploadFile = (formData) => 
  axiosInstance.post('/api/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(handleResponse);

export const removeFile = (fileId) => 
  axiosInstance.delete(`/api/chat/files/${fileId}`).then(handleResponse);

export const endChat = () => 
  axiosInstance.post('/api/chat/end').then(handleResponse);