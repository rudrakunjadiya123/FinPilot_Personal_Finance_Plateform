import { useState, createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

const UploadContext = createContext(null);

export function UploadProvider({ children }) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, completed, failed
  const [recentUploadData, setRecentUploadData] = useState(null);

  const uploadTask = async ({ file, monthKey, statementType, bankName }) => {
    setIsUploading(true);
    setStatus('uploading');
    setProgress(0);
    setRecentUploadData(null);

    const formData = new FormData();
    formData.append('statement', file);
    formData.append('month', monthKey);
    if (statementType) formData.append('statementType', statementType);
    if (bankName) formData.append('bankName', bankName);

    try {
      const { data } = await apiClient.post('/api/statements/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          // Map physical network transfer to 0-80% block.
          // Remaining 20% reserved for AI backend processing (which takes 3-10 seconds)
          let pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          let mappedTo80 = Math.floor(pct * 0.8);
          setProgress(mappedTo80);
          
          if (mappedTo80 === 80) {
            setStatus('processing'); // AI taking over
          }
        },
      });

      // API completely resolved synchronously
      setProgress(100);
      setStatus('completed');
      
      // Pass the uploaded parameters back so the UI can auto-filter to them
      setRecentUploadData({
        ...data,
        params: { monthKey, statementType, bankName }
      });

      // Global invalidation triggers map
      queryClient.invalidateQueries({ queryKey: ['statements', 'uploads'] });
      queryClient.invalidateQueries({ queryKey: ['statements', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['statements', 'needsReview'] });
      queryClient.invalidateQueries({ queryKey: ['statements', 'trend'] });

      setTimeout(() => {
        setIsUploading(false);
        setStatus('idle');
        setProgress(0);
      }, 5000); // Give the completed UI bar 5 seconds to show 100%

      return data;
    } catch (err) {
      setProgress(0);
      setStatus('failed');
      setIsUploading(false);
      throw err;
    }
  };

  const clearRecentData = () => {
    setRecentUploadData(null);
  };

  const value = {
    isUploading,
    progress,
    status,
    recentUploadData,
    uploadTask,
    clearRecentData,
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export function useUploadContext() {
  return useContext(UploadContext);
}
