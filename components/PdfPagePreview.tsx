
import React, { useEffect, useRef, useState } from 'react';
import { renderPdfPageAsImage } from '../services/pdfUtils';
import { MagnifyingGlassPlusIcon } from './icons/EditorIcons';

interface PdfPagePreviewProps {
    file: File;
    pageNumber: number;
    onClick: () => void;
    isSelected: boolean;
    isLastPage: boolean;
    onZoom: (pageNumber: number) => void;
}

const PdfPagePreview: React.FC<PdfPagePreviewProps> = ({ file, pageNumber, onClick, isSelected, isLastPage, onZoom }) => {
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
        
        return () => {
            isMounted = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file, pageNumber]);

    const ringClass = isSelected ? 'ring-4 ring-blue-500' : 'ring-1 ring-slate-300';
    const cursorClass = isLastPage ? 'cursor-not-allowed' : 'cursor-pointer hover:ring-blue-400';

    return (
        <div 
            className={`relative group transition-all duration-200 ${!isLastPage ? 'hover:scale-105' : ''}`}
            onClick={!isLastPage ? onClick : undefined}
        >
            <div className={`aspect-[7/10] bg-white rounded-md shadow-sm overflow-hidden ${ringClass} ${cursorClass}`}>
                {isLoading && <div className="w-full h-full flex items-center justify-center bg-slate-200 animate-pulse"></div>}
                <canvas ref={canvasRef} className={`w-full h-full ${isLoading ? 'hidden' : 'block'}`} />
            </div>
            <div className="absolute top-1 right-1 bg-white/80 backdrop-blur-sm text-slate-700 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border border-slate-200">
                {pageNumber}
            </div>
             <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onZoom(pageNumber);
                }}
                aria-label={`Zoom on page ${pageNumber}`}
                className="absolute bottom-1 right-1 bg-slate-800 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black scale-90 group-hover:scale-100"
            >
                <MagnifyingGlassPlusIcon className="w-4 h-4" />
            </button>
            {isSelected && <div className="absolute inset-x-0 -bottom-1 h-1 bg-blue-500 rounded-full"></div>}
        </div>
    );
};

export default React.memo(PdfPagePreview);
