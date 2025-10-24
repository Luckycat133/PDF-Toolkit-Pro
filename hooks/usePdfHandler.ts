
import { useState } from 'react';
import { renderPdfPageAsImage, clearPdfCache as clearCache } from '../services/pdfUtils';

export const usePdfHandler = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (files: FileList) => {
    const pdfFile = files[0];
    if (pdfFile && pdfFile.type === 'application/pdf') {
      setIsAnalyzing(true);
      setError(null);
      setFile(pdfFile);
      setProgress(0);
      try {
        // Clear cache for any previous files before loading a new one
        clearCache(); 
        const { totalPages } = await renderPdfPageAsImage(pdfFile, 1, undefined, setProgress);
        setTotalPages(totalPages);
      } catch (e) {
        setError('Could not read PDF file. It may be corrupted or protected.');
        setFile(null);
        setTotalPages(0);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const resetState = () => {
    setFile(null);
    setTotalPages(0);
    setError(null);
    setIsAnalyzing(false);
    setProgress(0);
    clearCache();
  };

  return {
    file,
    totalPages,
    isAnalyzing,
    progress,
    error,
    handleFileChange,
    resetState,
  };
};
