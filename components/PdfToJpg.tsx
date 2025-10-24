import React, { useState, useEffect, useCallback } from 'react';
import FileDropzone from './FileDropzone';
import { convertPdfToJpgAndZip } from '../services/pdfUtils';
import Spinner from './Spinner';
import PdfPagePreview from './PdfPagePreview';
import { PhotoIcon, CheckCircleIcon } from './icons/EditorIcons';
import { usePdfHandler } from '../hooks/usePdfHandler';
import PdfPageGrid from './PdfPageGrid';

const SelectablePagePreview: React.FC<{
    file: File;
    pageNumber: number;
    isSelected: boolean;
    onSelect: (pageNumber: number) => void;
}> = React.memo(({ file, pageNumber, isSelected, onSelect }) => {
    return (
        <div className="relative">
            <PdfPagePreview
                file={file}
                pageNumber={pageNumber}
                onClick={() => onSelect(pageNumber)}
                isSelected={isSelected}
                isLastPage={false}
                onZoom={() => {}}
            />
            {isSelected && (
                 <div className="absolute inset-0 bg-blue-600 bg-opacity-50 flex items-center justify-center rounded-md transition-opacity duration-300 pointer-events-none">
                    <div className="bg-white rounded-full p-1 shadow-xl">
                        <CheckCircleIcon className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
            )}
        </div>
    );
});

const PdfToJpg: React.FC = () => {
    const { file, totalPages, isAnalyzing, progress, error: pdfError, handleFileChange, resetState: resetPdfState } = usePdfHandler();
    
    const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [actionProgress, setActionProgress] = useState(0);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        if (totalPages > 0) {
            selectAllPages();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPages]);
    
    const togglePageSelection = useCallback((pageNumber: number) => {
        setSelectedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pageNumber)) {
                newSet.delete(pageNumber);
            } else {
                newSet.add(pageNumber);
            }
            return newSet;
        });
    }, []);

    const selectAllPages = () => {
        setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
    };
    
    const deselectAllPages = () => {
        setSelectedPages(new Set());
    };

    const handleConvert = async () => {
        if (!file || selectedPages.size === 0) {
            setActionError('Please select at least one page to convert.');
            return;
        }
        setIsLoading(true);
        setActionError(null);
        setActionProgress(0);
        try {
            // FIX: Replaced `Array.from(selectedPages)` with the spread operator `[...selectedPages]`.
            // This ensures TypeScript correctly infers the type as `number[]`, resolving the error.
            const pagesToConvert = [...selectedPages].sort((a, b) => a - b);
            await convertPdfToJpgAndZip(file, pagesToConvert, setActionProgress);
        } catch (e) {
            setActionError('An error occurred during conversion.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetState = () => {
        resetPdfState();
        setSelectedPages(new Set());
        setActionError(null);
        setIsLoading(false);
        setActionProgress(0);
    };

    if (isAnalyzing) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Spinner className="text-blue-600 w-10 h-10" />
                <p className="mt-4 text-lg text-slate-600">Analyzing PDF...</p>
                <div className="w-full max-w-md mt-4">
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
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
            
            <div className="w-full mb-4">
                 <h3 className="font-bold text-lg text-slate-800 mb-2">Select Pages to Convert</h3>
                 <div className="flex justify-center gap-2 mb-4">
                     <button onClick={selectAllPages} className="text-sm font-semibold text-blue-600 hover:underline">Select all</button>
                     <span className="text-slate-300">|</span>
                     <button onClick={deselectAllPages} className="text-sm font-semibold text-blue-600 hover:underline">Deselect all</button>
                 </div>
                <PdfPageGrid totalPages={totalPages}>
                    {(pageNumber) => (
                        <SelectablePagePreview 
                            key={pageNumber} 
                            file={file} 
                            pageNumber={pageNumber}
                            isSelected={selectedPages.has(pageNumber)}
                            onSelect={togglePageSelection}
                        />
                    )}
                </PdfPageGrid>
            </div>

            <button 
                onClick={handleConvert} 
                disabled={isLoading || selectedPages.size === 0}
                className="w-full max-w-md bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl"
            >
                {isLoading ? <><Spinner className="-ml-1 mr-3" /> Converting...</> : <><PhotoIcon className="w-5 h-5 mr-2" /> Convert {selectedPages.size} Pages to JPG</>}
            </button>
            {isLoading && (
                <div className="w-full max-w-md mt-4">
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${actionProgress}%` }}></div>
                    </div>
                    <p className="text-center text-sm text-slate-500 mt-2">Converting... {actionProgress}%</p>
                </div>
            )}
            {actionError && <p className="text-red-500 mt-4 animate-shake">{actionError}</p>}
        </div>
    );
};

export default PdfToJpg;