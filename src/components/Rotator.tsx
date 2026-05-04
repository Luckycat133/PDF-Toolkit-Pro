import React, { useState, useEffect, useRef, useCallback } from 'react';
import FileDropzone from './FileDropzone';
import { rotatePdf, renderPdfPageAsImage } from '../services/pdfUtils';
import Spinner from './Spinner';
import { RotateCcwIcon, RotateCwIcon, ArrowPathIcon } from './icons/EditorIcons';
import { usePdfHandler } from '../hooks/usePdfHandler';
import PdfPageGrid from './PdfPageGrid';

interface RotatablePagePreviewProps {
    file: File;
    pageNumber: number;
    rotation: number;
    onRotate: (pageNumber: number, angle: number) => void;
}

const RotatablePagePreview: React.FC<RotatablePagePreviewProps> = React.memo(({ file, pageNumber, rotation, onRotate }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const renderPage = async () => {
            if (!file || !canvasRef.current) return;
            setIsLoading(true);
            try {
                await renderPdfPageAsImage(file, pageNumber, canvasRef.current);
            } catch (error) {
                console.error(`Failed to render page ${pageNumber}:`, error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        renderPage();
        return () => { isMounted = false; };
    }, [file, pageNumber]);

    return (
        <div className="relative group text-center">
            <div className="aspect-[7/10] bg-white rounded-md shadow-sm overflow-hidden ring-1 ring-slate-300 relative">
                {isLoading && <div className="w-full h-full flex items-center justify-center bg-slate-200 animate-pulse"></div>}
                <canvas 
                  ref={canvasRef} 
                  className={`w-full h-full transition-transform duration-300 ${isLoading ? 'hidden' : 'block'}`}
                  style={{ transform: `rotate(${rotation}deg)` }} 
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <button onClick={() => onRotate(pageNumber, -90)} className="bg-white/80 rounded-full p-2 text-slate-700 hover:bg-white"><RotateCcwIcon className="w-5 h-5"/></button>
                    <button onClick={() => onRotate(pageNumber, 90)} className="bg-white/80 rounded-full p-2 text-slate-700 hover:bg-white"><RotateCwIcon className="w-5 h-5"/></button>
                </div>
            </div>
            <div className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm text-slate-700 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border border-slate-200">
                {pageNumber}
            </div>
            <p className="text-sm font-semibold text-slate-600 mt-2">{rotation}°</p>
        </div>
    );
});


const Rotator: React.FC = () => {
    const { file, totalPages, isAnalyzing, progress, error: pdfError, handleFileChange, resetState: resetPdfState } = usePdfHandler();
    
    const [rotations, setRotations] = useState<{ [page: number]: number }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [actionProgress, setActionProgress] = useState(0);
    const [actionError, setActionError] = useState<string | null>(null);

    const handleRotate = useCallback((pageNumber: number, angle: number) => {
        setRotations(prev => {
            const current = prev[pageNumber] || 0;
            const newRotation = (current + angle) % 360;
            return { ...prev, [pageNumber]: newRotation };
        });
    }, []);

    const handleRotateAll = (angle: number) => {
        const newRotations: { [page: number]: number } = {};
        for(let i=1; i<=totalPages; i++) {
            const current = rotations[i] || 0;
            newRotations[i] = (current + angle) % 360;
        }
        setRotations(newRotations);
    };

    const handleSave = async () => {
        if (!file) return;
        setIsLoading(true);
        setActionError(null);
        // FIX: The `setProgress` function is not available in this scope. Use `setActionProgress` to manage the progress of the save action.
        setActionProgress(0);
        try {
            await rotatePdf(file, rotations, setActionProgress);
        } catch (e) {
            setActionError('Failed to save rotated PDF.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetState = () => {
        resetPdfState();
        setRotations({});
        setActionError(null);
        setIsLoading(false);
        setActionProgress(0);
    };

    if (isAnalyzing) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <Spinner className="text-blue-600 w-10 h-10" />
                <p className="mt-4 text-lg text-slate-600">Analyzing PDF...</p>
                <div className="w-full max-w-md mt-4 bg-slate-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
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

            <div className="w-full mb-4 flex justify-center gap-2">
                <button onClick={() => handleRotateAll(-90)} className="flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 font-semibold">
                    <RotateCcwIcon className="w-5 h-5"/> Rotate all Left
                </button>
                 <button onClick={() => handleRotateAll(90)} className="flex items-center gap-2 bg-slate-200 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-300 font-semibold">
                    <RotateCwIcon className="w-5 h-5"/> Rotate all Right
                </button>
            </div>

            <div className="w-full mb-8">
                <PdfPageGrid totalPages={totalPages}>
                    {(pageNumber) => (
                         <RotatablePagePreview 
                            key={pageNumber} 
                            file={file} 
                            pageNumber={pageNumber}
                            rotation={rotations[pageNumber] || 0}
                            onRotate={handleRotate}
                        />
                    )}
                </PdfPageGrid>
            </div>

            <button 
                onClick={handleSave} 
                disabled={isLoading}
                className="w-full max-w-md bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl"
            >
                {isLoading ? <><Spinner className="-ml-1 mr-3" /> Saving...</> : <><ArrowPathIcon className="w-5 h-5 mr-2" /> Save Rotated PDF</>}
            </button>
            {isLoading && (
                <div className="w-full max-w-md mt-4">
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${actionProgress}%` }}></div>
                    </div>
                     <p className="text-center text-sm text-slate-500 mt-2">Processing... {actionProgress}%</p>
                </div>
            )}
            {actionError && <p className="text-red-500 mt-4 animate-shake">{actionError}</p>}
        </div>
    );
};

export default Rotator;