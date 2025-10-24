
import React, { useState, useEffect } from 'react';
import { usePdfHandler } from '../hooks/usePdfHandler';
import FileDropzone from './FileDropzone';
import Spinner from './Spinner';
import { extractTextFromPdf } from '../services/pdfUtils';
import { CheckCircleIcon, ClipboardIcon } from './icons/EditorIcons';

const PdfToText: React.FC = () => {
  const { file, totalPages, isAnalyzing, progress, error: pdfError, handleFileChange, resetState: resetPdfState } = usePdfHandler();
  
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionProgress, setActionProgress] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (file && totalPages > 0 && !isAnalyzing) {
      handleExtract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, totalPages, isAnalyzing]);

  const handleExtract = async () => {
    if (!file) return;
    setIsLoading(true);
    setExtractedText(null);
    setActionError(null);
    setActionProgress(0);
    try {
      const text = await extractTextFromPdf(file, setActionProgress);
      setExtractedText(text);
    } catch (e) {
      console.error(e);
      setActionError('Failed to extract text from the PDF. The file might be image-based or protected.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const resetState = () => {
    resetPdfState();
    setExtractedText(null);
    setActionError(null);
    setIsLoading(false);
    setActionProgress(0);
  };

  if (isAnalyzing) {
    return (
        <div className="flex flex-col items-center justify-center h-96">
            <Spinner className="text-blue-600 w-10 h-10" />
            <p className="mt-4 text-lg text-slate-600">Analyzing your PDF...</p>
            <div className="w-full max-w-md mt-4">
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-center text-sm text-slate-500 mt-2">{progress}%</p>
            </div>
        </div>
    );
  }

  if (!file) {
    return <FileDropzone onFileChange={handleFileChange} accept="application/pdf" loading={isLoading} error={pdfError} />;
  }

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="w-full bg-slate-100 rounded-lg p-4 mb-6 text-center">
        <p className="font-semibold text-slate-700">{file.name}</p>
        <p className="text-sm text-slate-500">{totalPages} pages</p>
        <button onClick={resetState} className="mt-2 text-sm text-blue-600 hover:underline">
          Use another file
        </button>
      </div>

      {isLoading && (
        <div className="w-full max-w-2xl text-center">
          <Spinner className="text-blue-600 w-10 h-10 mx-auto" />
          <p className="mt-4 text-lg text-slate-600">Extracting text...</p>
          <div className="w-full max-w-md mx-auto mt-4">
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${actionProgress}%` }}></div>
            </div>
            <p className="text-center text-sm text-slate-500 mt-2">{actionProgress}%</p>
          </div>
        </div>
      )}

      {actionError && (
        <p className="text-red-500 mt-4 text-center animate-shake">{actionError}</p>
      )}

      {!isLoading && extractedText !== null && (
        <div className="w-full max-w-4xl">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-lg text-slate-800">Extracted Text</h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-400 transition-all duration-200"
              disabled={copySuccess}
            >
              {copySuccess ? (
                <><CheckCircleIcon className="w-5 h-5 animate-scale-in" /> Copied!</>
              ) : (
                <><ClipboardIcon className="w-5 h-5" /> Copy Text</>
              )}
            </button>
          </div>
          <textarea
            readOnly
            value={extractedText}
            className="w-full h-96 p-4 border border-slate-300 rounded-lg bg-slate-50 font-sans text-sm resize-y"
            placeholder="No text could be extracted from the PDF."
          />
        </div>
      )}
    </div>
  );
};

export default PdfToText;