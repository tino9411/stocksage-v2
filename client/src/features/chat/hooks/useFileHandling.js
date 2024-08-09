// client/src/features/chat/hooks/useFileHandling.js
import { useState, useCallback } from 'react';
import * as chatApi from '../api/chatApi';

export const useFileHandling = (addLog, addServerLogs) => {
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const uploadFile = useCallback(async (file, currentThreadId) => {
    const formData = new FormData();
    formData.append('files', file);
    formData.append('threadId', currentThreadId);
  
    try {
      setUploadingFiles(prev => ({ ...prev, [file.name]: true }));
      addLog(`Uploading file: ${file.name}...`);
      const response = await chatApi.uploadFile(formData);
      addLog(`File uploaded successfully: ${file.name}`);
      if (response.logs) addServerLogs(response.logs);
      
      const uploadedFile = {
        ...response.files[0],
        size: file.size
      };
      
      setUploadedFiles(prev => [...prev, uploadedFile]);
      return uploadedFile;
    } catch (error) {
      addLog(`Error uploading file: ${file.name}`);
      throw error;
    } finally {
      setUploadingFiles(prev => {
        const newState = { ...prev };
        delete newState[file.name];
        return newState;
      });
    }
  }, [addLog, addServerLogs]);

  const removeUploadedFile = useCallback(async (fileId, threadId) => {
    try {
      addLog(`Removing file: ${fileId}...`);
      await chatApi.removeFile(fileId, threadId);
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      addLog(`File removed successfully: ${fileId}`);
    } catch (error) {
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