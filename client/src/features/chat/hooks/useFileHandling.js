import { useState, useCallback } from 'react';
import axiosInstance from '../../../axiosConfig';

export const useFileHandling = (addLog, addServerLogs, isInitialized, isConversationStarted) => {
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const uploadFile = useCallback(async (file) => {
    if (!isInitialized || !isConversationStarted) {
      throw new Error('Assistant not initialized or conversation not started');
    }
  
    const formData = new FormData();
    formData.append('files', file);
  
    try {
      setUploadingFiles(prev => ({ ...prev, [file.name]: true }));
      addLog(`Uploading file: ${file.name}...`);
      const response = await axiosInstance.post('/api/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      addLog(`File uploaded successfully: ${file.name}`);
      addServerLogs(response.data.logs);

      const uploadedFile = {
        ...response.data.files[0],
        size: file.size
      };

      setUploadingFiles(prev => {
        const newState = { ...prev };
        delete newState[file.name];
        return newState;
      });

      setUploadedFiles(prev => [...prev, uploadedFile]);

      return uploadedFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      addLog(`Error uploading file: ${file.name}`);
      setUploadingFiles(prev => {
        const newState = { ...prev };
        delete newState[file.name];
        return newState;
      });
      throw error;
    }
  }, [isInitialized, isConversationStarted, addLog, addServerLogs]);

  const removeUploadedFile = useCallback(async (fileId) => {
    try {
      addLog(`Removing file: ${fileId}...`);
      if (!fileId) {
        throw new Error('Invalid file ID');
      }
      await axiosInstance.delete(`/api/chat/files/${fileId}`);
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      addLog(`File removed successfully: ${fileId}`);
    } catch (error) {
      console.error('Error removing file:', error);
      addLog(`Error removing file: ${fileId}`);
      throw error;
    }
  }, [addLog]);

  return {
    uploadingFiles,
    uploadedFiles,
    setUploadedFiles,
    uploadFile,
    removeUploadedFile
  };
};