import React, { useState, useCallback, useEffect } from 'react';
import { splitPdfAndZip, splitPdfByRangesAndZip } from '../services/pdfUtils';
import FileDropzone from './FileDropzone';
import PdfPagePreview from './PdfPagePreview';
import Spinner from './Spinner';
import Modal from './Modal';
import PdfPageZoomView from './PdfPageZoomView';
import { usePdfHandler } from '../hooks/usePdfHandler';
import PdfPageGrid from './PdfPageGrid';

type SplitMode = 'visual' | 'range';

const parseRangeString = (input: string, maxPage: number): { ranges: {start: number, end: number}[], error: string | null } => {
  if (!input.trim()) {
    return { ranges: [], error: null };
  }

  const parts = input.split(',');
  const ranges: {start: number, end: number}[] = [];

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;

    if (!/^\d+(-\d+)?$/.test(trimmedPart)) {
      return { ranges: [], error: `Invalid format in segment: "${trimmedPart}". Use numbers and hyphens only.` };
    }

    if (trimmedPart.includes('-')) {
      const [startStr, endStr] = trimmedPart.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        return { ranges: [], error: `Invalid range: "${trimmedPart}".` };
      }
      if (start > end) {
        return { ranges: [], error: `Invalid range: start page ${start} is greater than end page ${end}.` };
      }
      if (start < 1 || end > maxPage) {
        return { ranges: [], error: `Page numbers out of bounds. Must be between 1 and ${maxPage}.` };
      }
      ranges.push({ start, end });
    } else {
      const page = parseInt(trimmedPart, 10);
      if (isNaN(page)) {
        return { ranges: [], error: `Invalid page number: "${trimmedPart}".` };
      }
      if (page < 1 || page > maxPage) {
        return { ranges: [], error: `Page number out of bounds. Must be between 1 and ${maxPage}.` };
      }
      ranges.push({ start: page, end: page });
    }
  }

  ranges.sort((a, b) => a.start - b.start);
  return { ranges, error: null };
};

const Splitter: React.FC = () => {
  const { file, totalPages, isAnalyzing, progress, error: pdfError, handleFileChange, resetState: resetPdfState } = usePdfHandler();
  
  const [splitMode, setSplitMode] = useState<SplitMode>('visual');
  const [splitPoints, setSplitPoints] = useState<number[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [rangeInput, setRangeInput] = useState('');
  const [parsedRanges, setParsedRanges] = useState<{start: number, end: number}[]>([]);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [actionProgress, setActionProgress] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [zoomedPage, setZoomedPage] = useState<number | null>(null);

  const toggleSplitPoint = useCallback((pageNumber: number) => {
    if (pageNumber === totalPages) return;
    setSplitPoints(prev =>
      prev.includes(pageNumber)
        ? prev.filter(p => p !== pageNumber).sort((a, b) => a - b)
        : [...prev, pageNumber].sort((a, b) => a - b)
    );
  }, [totalPages]);
  
  const handleRangeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRangeInput(value);
    
    const { ranges, error } = parseRangeString(value, totalPages);
    if (error) {
        setRangeError(error);
        setParsedRanges([]);
    } else {
        setRangeError(null);
        setParsedRanges(ranges);
    }
  };

  const handleSplit = async () => {
    if (!file) return;

    setIsLoading(true);
    setActionError(null);
    setActionProgress(0);

    try {
      if (splitMode === 'range') {
        if (rangeError || parsedRanges.length === 0) {
            setActionError('Please enter valid page ranges.');
            setIsLoading(false);
            return;
        }
        await splitPdfByRangesAndZip(file, parsedRanges, setActionProgress);
      } else { // 'visual' mode
        if (splitPoints.length === 0) {
          setActionError('Please select at least one split point.');
          setIsLoading(false);
          return;
        }
        const validFileNames = fileNames.every(name => name.trim() !== '');
        if (!validFileNames) {
          setActionError('All file names must be provided.');
          setIsLoading(false);
          return;
        }
        await splitPdfAndZip(file, splitPoints, fileNames, setActionProgress);
      }
    } catch (e) {
      console.error(e);
      setActionError('An error occurred while splitting the PDF.');
    } finally {
      setIsLoading(false);
      setActionProgress(0);
    }
  };

  const getSplitRanges = useCallback(() => {
    const ranges: {start: number, end: number}[] = [];
    if (totalPages === 0) return ranges;
    
    let lastPoint = 0;
    const sortedPoints = [...splitPoints].sort((a,b) => a-b);

    sortedPoints.forEach(point => {
        ranges.push({ start: lastPoint + 1, end: point });
        lastPoint = point;
    });
    ranges.push({ start: lastPoint + 1, end: totalPages });
    
    return ranges;
  }, [splitPoints, totalPages]);

  useEffect(() => {
    if (!file || splitMode !== 'visual') return;
    const ranges = getSplitRanges();
    const baseName = file.name.replace(/\.pdf$/i, '');
    setFileNames(ranges.map((range, i) => {
        if (ranges.length === 1) return `${baseName}.pdf`;
        return `${baseName}-part-${i + 1}_(pages_${range.start}-${range.end}).pdf`;
    }));
  }, [getSplitRanges, file, splitMode]);
  
  const handleNameChange = (index: number, newName: string) => {
    const newFileNames = [...fileNames];
    newFileNames[index] = newName;
    setFileNames(newFileNames);
  };

  const resetState = () => {
    resetPdfState();
    setSplitPoints([]);
    setFileNames([]);
    setRangeInput('');
    setParsedRanges([]);
    setRangeError(null);
    setActionError(null);
    setIsLoading(false);
    setActionProgress(0);
    setZoomedPage(null);
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
  
  const fileCount = splitMode === 'visual' ? splitPoints.length + 1 : parsedRanges.length;
  const isSplitDisabled = splitMode === 'visual' ? splitPoints.length === 0 : (!!rangeError || parsedRanges.length === 0);

  return (
    <div className="flex flex-col items-center animate-fade-in">
        <div className="w-full bg-slate-100 rounded-lg p-4 mb-6 text-center">
            <p className="font-semibold text-slate-700">{file.name}</p>
            <p className="text-sm text-slate-500">{totalPages} pages</p>
            <button onClick={resetState} className="mt-2 text-sm text-blue-600 hover:underline">
                Use another file
            </button>
        </div>

        <div className="flex justify-center mb-6 border border-slate-200 rounded-lg p-1 bg-slate-100 w-fit mx-auto">
            <button onClick={() => setSplitMode('visual')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${splitMode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>Visual Split</button>
            <button onClick={() => setSplitMode('range')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${splitMode === 'range' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>Split by Range</button>
        </div>

        {splitMode === 'visual' ? (
            <div className="w-full mb-6">
                <h3 className="font-bold text-lg text-slate-800 mb-2">Select Split Points</h3>
                <p className="text-slate-500 mb-4">Click on a page to mark it as the end of a section. A split will occur after the selected page. The blue lines indicate where the document will be split.</p>
                <PdfPageGrid totalPages={totalPages}>
                  {(pageNumber) => (
                    <PdfPagePreview 
                        file={file} 
                        pageNumber={pageNumber}
                        onClick={() => toggleSplitPoint(pageNumber)}
                        isSelected={splitPoints.includes(pageNumber)}
                        isLastPage={pageNumber === totalPages}
                        onZoom={setZoomedPage}
                    />
                  )}
                </PdfPageGrid>
            </div>
        ) : (
            <div className="w-full max-w-xl mx-auto mb-6">
                <h3 className="font-bold text-lg text-slate-800 mb-2">Enter Page Ranges</h3>
                <p className="text-slate-500 mb-4">
                  Specify pages and ranges separated by commas. For example: <strong>2, 5-8, 10</strong>.
                  This will create three separate PDF files from your document.
                </p>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={handleRangeInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${rangeError ? 'border-red-500' : 'border-slate-300'}`}
                  placeholder="e.g., 1-5, 8, 10-12"
                />
                {rangeError && <p className="text-red-500 mt-2 text-sm animate-shake">{rangeError}</p>}
            </div>
        )}

        <div className="w-full max-w-xl mx-auto mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-lg text-blue-800 mb-2">Resulting Files</h3>
            {splitMode === 'visual' ? (
                splitPoints.length > 0 ? (
                    <div className="space-y-3">
                        {getSplitRanges().map((range, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap mb-2 sm:mb-0">
                                   File {index + 1}: Pages {range.start} - {range.end}
                                </span>
                                <input
                                    type="text"
                                    value={fileNames[index] || ''}
                                    onChange={(e) => handleNameChange(index, e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`File ${index + 1} name`}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-blue-700">No split points selected. The entire document will be one file.</p>
                )
            ) : (
                parsedRanges.length > 0 ? (
                    <div className="space-y-2">
                        {parsedRanges.map((range, index) => (
                            <div key={index} className="flex items-center gap-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full w-fit">
                                File {index + 1}: Pages {range.start}{range.start !== range.end ? ` - ${range.end}` : ''}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-blue-700">Enter a valid range to see the resulting files.</p>
                )
            )}
        </div>


        <button 
            onClick={handleSplit} 
            disabled={isLoading || isSplitDisabled}
            className="w-full max-w-md bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl"
        >
            {isLoading ? <><Spinner className="-ml-1 mr-3" /> Processing...</> : `Split into ${fileCount} Files`}
        </button>
        {isLoading && (
            <div className="w-full max-w-md mt-4">
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${actionProgress}%` }}></div>
                </div>
                <p className="text-center text-sm text-slate-500 mt-2">Splitting... {actionProgress}%</p>
            </div>
        )}
        {actionError && <p className="text-red-500 mt-4 animate-shake">{actionError}</p>}
        
        <Modal
            isOpen={zoomedPage !== null}
            onClose={() => setZoomedPage(null)}
            title={`Page ${zoomedPage} - High Resolution Preview`}
        >
            {zoomedPage !== null && (
                <PdfPageZoomView file={file} pageNumber={zoomedPage} />
            )}
        </Modal>
    </div>
  );
};

export default Splitter;