
import React, { useState } from 'react';
import FileDropzone from './FileDropzone';
import { compressPdf } from '../services/pdfUtils';
import Spinner from './Spinner';
import { ArrowsPointingOutIcon } from './icons/EditorIcons';

const Compressor: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (files: FileList) => {
        const pdfFile = files[0];
        if (pdfFile && pdfFile.type === 'application/pdf') {
            setError(null);
            setFile(pdfFile);
        } else {
            setError('Please upload a valid PDF file.');
            setFile(null);
        }
    };

    const handleCompress = async () => {
        if (!file) return;
        setIsLoading(true);
        setError(null);
        setProgress(0);
        try {
            await compressPdf(file, setProgress);
        } catch (e) {
            console.error(e);
            setError('An error occurred while compressing the PDF.');
        } finally {
            setIsLoading(false);
            setProgress(0);
        }
    };

    const resetState = () => {
        setFile(null);
        setError(null);
        setIsLoading(false);
        setProgress(0);
    };

    if (!file) {
        return <FileDropzone onFileChange={handleFileChange} accept="application/pdf" loading={isLoading} error={error} />;
    }

    return (
        <div className="flex flex-col items-center animate-fade-in">
            <div className="w-full bg-slate-100 rounded-lg p-4 mb-6 text-center">
                <p className="font-semibold text-slate-700">{file.name}</p>
                <p className="text-sm text-slate-500">Ready to be compressed.</p>
                <button onClick={resetState} className="mt-2 text-sm text-blue-600 hover:underline">
                    Use another file
                </button>
            </div>
            
            <div className="w-full max-w-md mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-lg text-blue-800 mb-2">Compression Level</h3>
                <div className="flex items-center bg-white p-3 rounded-md border border-slate-200">
                    <input id="basic-compression" name="compression-level" type="radio" defaultChecked className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                    <label htmlFor="basic-compression" className="ml-3 block text-sm font-medium text-slate-700">
                        Basic Compression
                    </label>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    This will rewrite the PDF structure using object streams, which can reduce file size for unoptimized documents. Advanced image compression is not performed.
                </p>
            </div>

            <button 
                onClick={handleCompress} 
                disabled={isLoading}
                className="w-full max-w-md bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl"
            >
                {isLoading ? <><Spinner className="-ml-1 mr-3" /> Compressing...</> : <><ArrowsPointingOutIcon className="w-5 h-5 mr-2" /> Compress PDF</>}
            </button>
            {isLoading && (
                <div className="w-full max-w-md mt-4">
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-center text-sm text-slate-500 mt-2">Processing... {progress}%</p>
                </div>
            )}
            {error && <p className="text-red-500 mt-4 animate-shake">{error}</p>}
        </div>
    );
};

export default Compressor;