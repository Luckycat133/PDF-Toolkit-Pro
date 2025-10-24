import React, { useState, useEffect, useRef } from 'react';
import { renderPdfPageAsImage } from '../services/pdfUtils';
import { MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowPathIcon } from './icons/EditorIcons';
import Spinner from './Spinner';

interface PdfPageZoomViewProps {
  file: File;
  pageNumber: number;
}

const INITIAL_SCALE = 1.5;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const SCALE_STEP = 0.25;

const PdfPageZoomView: React.FC<PdfPageZoomViewProps> = ({ file, pageNumber }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(INITIAL_SCALE);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderPage = async () => {
      if (!file || !canvasRef.current) return;
      setIsLoading(true);
      setError(null);
      try {
        await renderPdfPageAsImage(file, pageNumber, canvasRef.current, undefined, scale);
      } catch (e) {
        if (isMounted) {
          setError('Failed to render a high-resolution preview.');
        }
        console.error(e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    renderPage();
    return () => { isMounted = false; };
  }, [file, pageNumber, scale]);

  const handleZoomIn = () => setScale(s => Math.min(s + SCALE_STEP, MAX_SCALE));
  const handleZoomOut = () => setScale(s => Math.max(s - SCALE_STEP, MIN_SCALE));
  const handleResetZoom = () => setScale(INITIAL_SCALE);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-slate-100 rounded-lg p-2 mb-4 flex items-center gap-2 sticky top-0 z-10 w-full justify-center">
        <button onClick={handleZoomOut} disabled={scale <= MIN_SCALE} className="p-2 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <MagnifyingGlassMinusIcon className="w-5 h-5 text-slate-700" />
        </button>
        <span className="text-sm font-semibold text-slate-700 w-16 text-center">{(scale * 100).toFixed(0)}%</span>
        <button onClick={handleZoomIn} disabled={scale >= MAX_SCALE} className="p-2 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <MagnifyingGlassPlusIcon className="w-5 h-5 text-slate-700" />
        </button>
        <button onClick={handleResetZoom} className="p-2 rounded-md hover:bg-slate-200 transition-colors">
          <ArrowPathIcon className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      <div className="w-full h-full overflow-auto text-center relative min-h-[60vh]">
        {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                <Spinner className="text-blue-600" />
                <p className="mt-2 text-slate-600">Loading preview...</p>
            </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
        <canvas ref={canvasRef} className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} shadow-lg mx-auto`}/>
      </div>
    </div>
  );
};

export default PdfPageZoomView;
