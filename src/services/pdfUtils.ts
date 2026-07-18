import { PDFDocument, degrees } from 'pdf-lib';
import JSZip from 'jszip';
import download from 'downloadjs';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

// Cache for loaded PDF documents to avoid reloading for each page render
const pdfDocCache = new Map<string, any>();

export function clearPdfCache() {
    pdfDocCache.clear();
}

async function getPdfJsDoc(file: File, onProgress?: (progress: number) => void) {
    const fileKey = `${file.name}-${file.lastModified}`;
    if (pdfDocCache.has(fileKey)) {
        return pdfDocCache.get(fileKey);
    }
    const arrayBuffer = await fileToArrayBuffer(file);
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    
    if (onProgress) {
        loadingTask.onProgress = (data: { loaded: number, total: number }) => {
            if (data.total > 0) {
                const progress = Math.round((data.loaded / data.total) * 100);
                onProgress(progress);
            }
        };
    }

    const pdfDoc = await loadingTask.promise;
    pdfDocCache.set(fileKey, pdfDoc);
    return pdfDoc;
}

export async function renderPdfPageAsImage(
    file: File, 
    pageNumber: number, 
    canvasElement?: HTMLCanvasElement, 
    onProgress?: (progress: number) => void,
    scale: number = 1.0
) {
    const pdf = await getPdfJsDoc(file, onProgress);
    const page = await pdf.getPage(pageNumber);
    
    const viewport = page.getViewport({ scale });
    const canvas = canvasElement || document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
        throw new Error('Could not get canvas context');
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    return { canvas, totalPages: pdf.numPages };
}


export async function splitPdfAndZip(file: File, splitPoints: number[], fileNames: string[], onProgress?: (progress: number) => void) {
    const arrayBuffer = await fileToArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const zip = new JSZip();

    const sortedPoints = [...splitPoints].sort((a, b) => a - b);

    const totalFiles = sortedPoints.length + 1;
    let fileIndex = 0;

    const ranges = [];
    let lastPoint = 0;
    sortedPoints.forEach(point => {
        ranges.push({ start: lastPoint, end: point });
        lastPoint = point;
    });
    ranges.push({ start: lastPoint, end: pdfDoc.getPagesCount() });

    for (const range of ranges) {
        if (range.start >= range.end) continue;

        const newDoc = await PDFDocument.create();
        const pagesToCopy = Array.from({ length: range.end - range.start }, (_, k) => range.start + k);
        const copiedPages = await (newDoc as any).copyPages(pdfDoc, pagesToCopy);
        copiedPages.forEach((page: any) => (newDoc as any).addPage(page));

        const newPdfBytes = await newDoc.save();
        const fileName = fileNames[fileIndex]?.trim() || `part-${fileIndex + 1}.pdf`;
        zip.file(fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`, newPdfBytes);
        
        fileIndex++;
        if (onProgress) {
            const progress = Math.round((fileIndex / totalFiles) * 80);
            onProgress(progress);
        }
    }

    if (onProgress) onProgress(90);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    if (onProgress) onProgress(100);

    download(zipBlob, `${file.name.replace(/\.pdf$/i, '')}_split.zip`, 'application/zip');
}

export async function splitPdfByRangesAndZip(file: File, ranges: {start: number, end: number}[], onProgress?: (progress: number) => void) {
    const arrayBuffer = await fileToArrayBuffer(file);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const zip = new JSZip();

    const totalFiles = ranges.length;
    let fileIndex = 0;
    const baseName = file.name.replace(/\.pdf$/i, '');

    for (const range of ranges) {
        // Ranges are 1-based, inclusive. PDF-lib uses 0-based indices.
        const pagesToCopy = Array.from({ length: range.end - range.start + 1 }, (_, k) => range.start - 1 + k);
        
        if (pagesToCopy.some(p => p < 0 || p >= pdfDoc.getPagesCount())) {
            throw new Error(`Invalid page range specified: ${range.start}-${range.end}`);
        }

        const newDoc = await PDFDocument.create();
        const copiedPages = await (newDoc as any).copyPages(pdfDoc, pagesToCopy);
        copiedPages.forEach((page: any) => (newDoc as any).addPage(page));

        const newPdfBytes = await newDoc.save();
        
        let fileName;
        if (range.start === range.end) {
            fileName = `${baseName}_page_${range.start}.pdf`;
        } else {
            fileName = `${baseName}_pages_${range.start}-${range.end}.pdf`;
        }
        
        zip.file(fileName, newPdfBytes);
        
        fileIndex++;
        if (onProgress) {
            const progress = Math.round((fileIndex / totalFiles) * 80);
            onProgress(progress);
        }
    }

    if (onProgress) onProgress(90);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    if (onProgress) onProgress(100);

    download(zipBlob, `${baseName}_split_by_range.zip`, 'application/zip');
}

export async function mergePdfs(files: File[], outputFilename: string, onProgress?: (progress: number) => void) {
    const mergedPdf = await PDFDocument.create();
    const totalFiles = files.length;

    for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const arrayBuffer = await fileToArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = pdfDoc.getPagesCount();
        const pageIndices = Array.from({ length: totalPages }, (_, k) => k);
        const copiedPages = await (mergedPdf as any).copyPages(pdfDoc, pageIndices);
        copiedPages.forEach((page: any) => (mergedPdf as any).addPage(page));

        if (onProgress) {
            const progress = Math.round(((i + 1) / totalFiles) * 90);
            onProgress(progress);
        }
    }
    
    if (onProgress) onProgress(95);
    const mergedPdfBytes = await mergedPdf.save();
    if (onProgress) onProgress(100);

    download(mergedPdfBytes, outputFilename, "application/pdf");
}

export async function compressPdf(file: File, onProgress?: (progress: number) => void) {
    onProgress?.(10);
    const arrayBuffer = await fileToArrayBuffer(file);
    onProgress?.(30);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    onProgress?.(70);
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    onProgress?.(100);
    const filename = file.name.replace(/\.pdf$/i, '-compressed.pdf');
    download(pdfBytes, filename, "application/pdf");
}

export async function rotatePdf(file: File, rotations: { [page: number]: number }, onProgress?: (progress: number) => void) {
    onProgress?.(10);
    const arrayBuffer = await fileToArrayBuffer(file);
    onProgress?.(30);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const totalPages = pdfDoc.getPagesCount();
    
    const pages = pdfDoc.getPages();
    for (let i = 0; i < totalPages; i++) {
        const pageNumber = i + 1;
        if (rotations[pageNumber]) {
            const page = pages[i];
            const currentRotation = page.getRotation() as any;
            // Rotation is {angle: number, type?: 'degrees' | 'radians'}.
            // Convert to degrees if needed.
            const currentAngle = currentRotation.type === 'radians'
                ? (currentRotation.angle * 180) / Math.PI
                : currentRotation.angle;
            page.setRotation(degrees(currentAngle + rotations[pageNumber]) as any);
        }
    }
    onProgress?.(90);

    const pdfBytes = await pdfDoc.save();
    onProgress?.(100);
    const filename = file.name.replace(/\.pdf$/i, '-rotated.pdf');
    download(pdfBytes, filename, "application/pdf");
}

export async function convertPdfToJpgAndZip(file: File, selectedPages: number[], onProgress?: (progress: number) => void) {
    const zip = new JSZip();
    const totalPagesToConvert = selectedPages.length;

    for (let i = 0; i < totalPagesToConvert; i++) {
        const pageNumber = selectedPages[i];
        const { canvas } = await renderPdfPageAsImage(file, pageNumber, undefined, undefined, 2.0);
        
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        
        if (blob) {
            const baseName = file.name.replace(/\.pdf$/i, '');
            zip.file(`${baseName}-page-${pageNumber}.jpg`, blob);
        }
        onProgress?.(Math.round(((i + 1) / totalPagesToConvert) * 90));
    }
    
    onProgress?.(95);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    onProgress?.(100);
    download(zipBlob, `${file.name.replace(/\.pdf$/i, '')}-images.zip`, 'application/zip');
}

export async function extractTextFromPdf(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const pdf = await getPdfJsDoc(file);
    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // The `str` property is the correct one for pdf.js text items
        const pageText = textContent.items.map((item: { str: string }) => item.str).join(' ');
        fullText += pageText + '\n\n';
        
        if (onProgress) {
            onProgress(Math.round((i / numPages) * 100));
        }
    }
    return fullText;
}