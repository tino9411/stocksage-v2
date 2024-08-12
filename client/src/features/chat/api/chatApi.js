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

export const saveMessage = async (threadId, message) => {
  try {
    const response = await fetch(`/api/chat/thread/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Failed to save message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

export const uploadFile = (formData) => 
  axiosInstance.post('/api/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(handleResponse);

export const removeFile = (fileId, threadId) => 
  axiosInstance.delete(`/api/chat/files/${fileId}?threadId=${threadId}`).then(handleResponse);

export const endChat = (threadId) => 
  axiosInstance.post('/api/chat/end', { threadId }).then(handleResponse);

export const getThreads = () => 
  axiosInstance.get('/api/chat/threads').then(handleResponse);

export const deleteThread = (threadId) => 
  axiosInstance.delete(`/api/chat/thread/${threadId}`).then(handleResponse);

// New function to get messages for a specific thread
export const getThreadMessages = (threadId) => 
  axiosInstance.get(`/api/chat/thread/${threadId}/messages`).then(handleResponse);