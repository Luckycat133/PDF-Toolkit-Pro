import React, { useState, useRef, DragEvent, useCallback } from 'react';
import FileDropzone from './FileDropzone';
import { mergePdfs, renderPdfPageAsImage } from '../services/pdfUtils';
import Spinner from './Spinner';
import { PdfFileIcon, TrashIcon } from './icons/EditorIcons';

interface MergedFile {
    id: string;
    file: File;
    thumbnail: string | null;
    isLoading: boolean;
}

const Merger: React.FC = () => {
    const [files, setFiles] = useState<MergedFile[]>([]);
    const [outputFilename, setOutputFilename] = useState('merged.pdf');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const generateThumbnail = useCallback(async (fileId: string, file: File) => {
        try {
            const canvas = document.createElement('canvas');
            // Render at a small scale for performance
            await renderPdfPageAsImage(file, 1, canvas, undefined, 0.3);
            const thumbnailDataUrl = canvas.toDataURL('image/jpeg');

            setFiles(prevFiles => prevFiles.map(f =>
                f.id === fileId ? { ...f, thumbnail: thumbnailDataUrl, isLoading: false } : f
            ));
        } catch (e) {
            console.error(`Failed to generate thumbnail for ${file.name}:`, e);
            // Stop loading indicator even on error
            setFiles(prevFiles => prevFiles.map(f =>
                f.id === fileId ? { ...f, isLoading: false } : f
            ));
        }
    }, []);

    const handleFileChange = useCallback((fileList: FileList) => {
        setError(null);
        const newFilesArray = Array.from(fileList)
            .filter(file => file.type === 'application/pdf')
            .map(file => ({
                id: `${file.name}-${file.lastModified}-${Math.random()}`,
                file,
                thumbnail: null,
                isLoading: true,
            }));

        if (newFilesArray.length !== fileList.length) {
            setError("Some files were not PDFs and were ignored.");
        }

        setFiles(prev => [...prev, ...newFilesArray]);

        newFilesArray.forEach(newFile => {
            generateThumbnail(newFile.id, newFile.file);
        });
    }, [generateThumbnail]);
    
    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            setError('Please upload at least two PDF files to merge.');
            return;
        }
        if (!outputFilename.trim()) {
            setError('Please provide a valid output file name.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setProgress(0);
        try {
            const fileArray = files.map(f => f.file);
            const finalFilename = outputFilename.trim().toLowerCase().endsWith('.pdf') 
                ? outputFilename.trim() 
                : `${outputFilename.trim()}.pdf`;
            await mergePdfs(fileArray, finalFilename, setProgress);
        } catch (e) {
            console.error(e);
            setError('An error occurred while merging the PDFs.');
        } finally {
            setIsLoading(false);
            setProgress(0);
        }
    };
    
    const handleDragStart = (e: DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
    };
    
    const handleDragEnter = (e: DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };
    
    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;

        const newFiles = [...files];
        const dragItemContent = newFiles[dragItem.current];
        newFiles.splice(dragItem.current, 1);
        newFiles.splice(dragOverItem.current, 0, dragItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        setFiles(newFiles);
    };

    const resetState = () => {
        setFiles([]);
        setError(null);
        setIsLoading(false);
        setProgress(0);
        setOutputFilename('merged.pdf');
    };

    return (
        <div className="flex flex-col items-center">
            <FileDropzone 
                onFileChange={handleFileChange} 
                accept="application/pdf" 
                multiple 
                loading={isLoading} 
                error={error}
            />

            {files.length > 0 && (
                <div className="w-full mt-8 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800">Files to Merge ({files.length})</h3>
                        <button onClick={resetState} className="text-sm text-blue-600 hover:underline">Clear all</button>
                    </div>
                    <p className="text-slate-500 mb-4">Drag and drop files to change their merge order.</p>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {files.map((item, index) => (
                            <div 
                                key={item.id}
                                className="flex items-center justify-between bg-slate-100 p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing"
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <div className="flex items-center min-w-0">
                                    <span className="text-slate-400 font-bold text-lg mr-4">{index + 1}</span>
                                    
                                    <div className="w-10 h-14 mr-3 flex-shrink-0 bg-slate-200 rounded flex items-center justify-center border border-slate-300">
                                        {item.isLoading ? (
                                            <Spinner className="w-5 h-5 text-slate-500" />
                                        ) : item.thumbnail ? (
                                            <img src={item.thumbnail} alt={`Preview of ${item.file.name}`} className="w-full h-full object-cover rounded" />
                                        ) : (
                                            <PdfFileIcon className="w-6 h-6 text-red-500" />
                                        )}
                                    </div>

                                    <div className="flex flex-col min-w-0">
                                        <span className="text-slate-700 font-medium truncate pr-2" title={item.file.name}>{item.file.name}</span>
                                        <span className="text-xs text-slate-500">{(item.file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </div>
                                <button onClick={() => removeFile(item.id)} className="p-1 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-500 transition-colors flex-shrink-0">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col items-center">
                         <div className="w-full max-w-md mb-6">
                            <label htmlFor="output-name" className="block text-sm font-bold text-slate-700 mb-2">Output File Name</label>
                            <input
                                type="text"
                                id="output-name"
                                value={outputFilename}
                                onChange={(e) => setOutputFilename(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="merged.pdf"
                            />
                        </div>

                        <button 
                            onClick={handleMerge} 
                            disabled={isLoading || files.length < 2}
                            className="w-full max-w-md bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? <><Spinner className="-ml-1 mr-3" /> Merging...</> : 'Merge PDFs'}
                        </button>
                        {isLoading && (
                            <div className="w-full max-w-md mt-4">
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                                </div>
                                <p className="text-center text-sm text-slate-500 mt-2">Merging... {progress}%</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Merger;