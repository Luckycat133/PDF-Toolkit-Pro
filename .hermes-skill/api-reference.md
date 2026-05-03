# PDF Toolkit Pro - API Reference

Complete API reference for Hermes skill integration.

## Core Functions

All functions are exported from `services/pdfUtils.ts`.

### File Conversion

```typescript
const fileToArrayBuffer(file: File): Promise<ArrayBuffer>
```

### PDF Rendering (pdf.js)

```typescript
renderPdfPageAsImage(
  file: File, 
  pageNumber: number, 
  canvasElement?: HTMLCanvasElement, 
  onProgress?: (progress: number) => void,
  scale: number = 1.0
): Promise<{ canvas: HTMLCanvasElement, totalPages: number }>
```

### PDF Manipulation (pdf-lib)

```typescript
// Split by visual click points
splitPdfAndZip(
  file: File, 
  splitPoints: number[],      // Page indices to split at (0-based)
  fileNames: string[],        // Custom names for each split part
  onProgress?: (progress: number) => void
): Promise<void>  // Downloads zip file

// Split by page ranges
splitPdfByRangesAndZip(
  file: File, 
  ranges: { start: number, end: number }[],  // 1-based, inclusive
  onProgress?: (progress: number) => void
): Promise<void>  // Downloads zip file

// Merge multiple PDFs
mergePdfs(
  files: File[], 
  outputFilename: string,
  onProgress?: (progress: number) => void
): Promise<void>  // Downloads merged PDF

// Basic compression
compressPdf(
  file: File,
  onProgress?: (progress: number) => void
): Promise<void>  // Downloads compressed PDF

// Rotate pages
rotatePdf(
  file: File, 
  rotations: { [page: number]: number },  // page: 1-based, angle: 0/90/180/270
  onProgress?: (progress: number) => void
): Promise<void>  // Downloads rotated PDF
```

### Conversion Functions

```typescript
// Convert PDF pages to JPG
convertPdfToJpgAndZip(
  file: File, 
  selectedPages: number[],    // 1-based page numbers
  onProgress?: (progress: number) => void
): Promise<void>  // Downloads zip file

// Extract text content
extractTextFromPdf(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string>  // Returns extracted text
```

### Cache Management

```typescript
clearPdfCache(): void  // Clear pdf.js document cache
```

## Component Architecture

```
App.tsx
├── Header.tsx              # Tool selection tabs
├── Splitter.tsx            # Visual + range splitting
├── Merger.tsx              # Multi-file merge with drag-drop
├── Compressor.tsx          # Basic compression
├── Rotator.tsx             # Page rotation controls
├── PdfToJpg.tsx            # Page selection + JPG export
├── PdfToText.tsx           # Text extraction display
│
├── FileDropzone.tsx        # Upload component
├── PdfPageGrid.tsx         # Page thumbnail grid
├── PdfPagePreview.tsx      # Single page preview
├── PdfPageZoomView.tsx     # Zoom viewer
├── Modal.tsx               # Modal dialogs
└── Spinner.tsx             # Loading indicator
```

## State Management (usePdfHandler hook)

```typescript
const {
  file,           // Current PDF File object
  totalPages,     // Number of pages in PDF
  isAnalyzing,    // Loading state
  progress,       // Progress percentage (0-100)
  error,          // Error message or null
  handleFileChange,  // (files: FileList) => void
  resetState,        // () => void - clears all state
} = usePdfHandler()
```

## Data Flow

```
User uploads PDF
       ↓
FileDropzone detects file
       ↓
usePdfHandler.handleFileChange()
       ↓
renderPdfPageAsImage() loads PDF
       ↓
Component renders page grid/preview
       ↓
User selects tool action
       ↓
Tool component calls appropriate pdfUtils function
       ↓
Browser downloads result (zip/pdf/jpg/txt)
```

## Hermes Integration Points

### Tool Detection

Tools are defined in `App.tsx`:
```typescript
type Tool = 'split' | 'merge' | 'compress' | 'rotate' | 'pdf-to-jpg' | 'pdf-to-text';
```

### Progress Tracking

All async functions accept optional `onProgress` callbacks:
```typescript
(passed_progress: number) => void  // 0-100
```

### Error Handling

Each function throws descriptive errors:
- "Could not get canvas context"
- "Invalid page range specified: {start}-{end}"
- "Could not read PDF file. It may be corrupted or protected."

### Output Formats

| Operation | Output | File Type |
|-----------|--------|-----------|
| splitPdfAndZip | ZIP | application/zip |
| splitPdfByRangesAndZip | ZIP | application/zip |
| mergePdfs | Single PDF | application/pdf |
| compressPdf | Single PDF | application/pdf |
| rotatePdf | Single PDF | application/pdf |
| convertPdfToJpgAndZip | ZIP | application/zip |
| extractTextFromPdf | String | text/plain |
