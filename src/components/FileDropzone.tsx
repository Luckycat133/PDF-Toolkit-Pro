import React, { useState, DragEvent, ChangeEvent, useCallback } from 'react';
import { UploadIcon } from './icons/EditorIcons';
import { renderPdfPageAsImage } from '../services/pdfUtils';
import Spinner from './Spinner';

interface FileDropzoneProps {
  onFileChange: (files: FileList) => void;
  accept: string;
  multiple?: boolean;
  loading: boolean;
  error: string | null;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ onFileChange, accept, multiple = false, loading, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // For multiple file upload success flash

  // New state for single file preview
  const [preview, setPreview] = useState<{ name: string; size: string; thumbnail: string; } | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [internalError, setInternalError] = useState<string|null>(null);

  const showSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 1500);
  };

  const handleDrag = (e: DragEvent<HTMLLabelElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading && !isGeneratingPreview) {
        setIsDragging(dragging);
    }
  };
  
  const handleFiles = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;
    setInternalError(null);

    if (multiple) {
        onFileChange(files);
        showSuccess();
        return;
    }
    
    // Single file logic
    const file = files[0];
    if (file.type !== 'application/pdf') {
        setInternalError('Please upload a valid PDF file.');
        return;
    }

    setIsGeneratingPreview(true);
    setPreview(null);
    try {
      const canvas = document.createElement('canvas');
      // Render at a small scale for performance
      await renderPdfPageAsImage(file, 1, canvas, undefined, 0.5); 
      const thumbnail = canvas.toDataURL('image/jpeg');
      const sizeInKB = (file.size / 1024).toFixed(0);
      
      setIsGeneratingPreview(false);
      setPreview({
        name: file.name,
        size: `${sizeInKB} KB`,
        thumbnail: thumbnail,
      });

      // Delay to allow user to see the preview before the UI transitions
      setTimeout(() => {
        onFileChange(files);
      }, 1200);

    } catch (e) {
      console.error("Failed to generate preview", e);
      setInternalError('Could not read file. It may be corrupted or protected.');
      setIsGeneratingPreview(false);
    }
  }, [multiple, onFileChange]);

  const handleDrop = useCallback((e: DragEvent<HTMLLabelElement>) => {
    handleDrag(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [handleFiles]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
    // Reset the input value to allow uploading the same file again
    e.target.value = '';
  }, [handleFiles]);

  const currentError = error || internalError;

  let content;
  if (isGeneratingPreview) {
    content = (
      <div className="space-y-2 text-center flex flex-col items-center justify-center h-full">
        <Spinner className="w-12 h-12 text-blue-500" />
        <p className="text-sm text-slate-600 mt-2">Generating preview...</p>
      </div>
    );
  } else if (preview) {
    content = (
      <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-2">
        <img src={preview.thumbnail} alt="PDF preview" className="max-h-32 rounded border border-slate-300 shadow-md mb-3" />
        <p className="font-semibold text-slate-700 truncate w-full px-2" title={preview.name}>{preview.name}</p>
        <p className="text-sm text-slate-500">{preview.size}</p>
      </div>
    );
  } else {
    content = (
      <div className="space-y-2 text-center flex flex-col items-center justify-center">
        <UploadIcon className={`mx-auto h-12 w-12 text-slate-400 group-hover:text-blue-500 transition-colors ${isDragging ? 'text-blue-500' : ''}`} />
        <div className="flex text-sm text-slate-600">
            <span className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                <span>Upload {multiple ? "files" : "a file"}</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept={accept} multiple={multiple} onChange={handleChange} />
            </span>
            <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-slate-500">
            PDF files only
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
        <label
            onDragEnter={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDragOver={(e) => handleDrag(e, true)}
            onDrop={handleDrop}
            className={`
                flex justify-center w-full h-64 px-6 pt-5 pb-6 border-2
                border-dashed rounded-lg transition-all duration-300
                group
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}
                ${isSuccess || preview ? '!border-green-500 !bg-green-50' : ''}
            `}
        >
            {content}
        </label>
        {currentError && <p className="mt-2 text-sm text-red-600 text-center animate-shake">{currentError}</p>}
    </div>
  );
};

export default FileDropzone;