# PDF Toolkit Pro - Hermes Skill

Hermes Skill integration for PDF Toolkit Pro, a client-side PDF manipulation web application.

## Overview

This Hermes Skill provides capabilities for PDF file manipulation including splitting, merging, compressing, rotating, and converting PDFs to JPG/Text formats. All processing is done client-side for privacy.

## Features

| Feature | Description |
|---------|-------------|
| **Split PDF** | Visual split (click between pages) or split by custom page ranges (e.g., `1-5, 8, 10-12`) |
| **Merge PDF** | Combine multiple PDFs into one with drag-and-drop reordering |
| **Compress PDF** | Reduce file size using basic compression |
| **Rotate PDF** | Rotate pages individually or all at once by 90/180/270 degrees |
| **PDF to JPG** | Convert selected pages to high-quality JPG images |
| **PDF to Text** | Extract text content from PDF documents |

## Architecture

```
src/
├── services/
│   └── pdfUtils.ts      # Core PDF operations (pdf-lib + pdf.js)
├── components/
│   ├── Splitter.tsx    # PDF split UI
│   ├── Merger.tsx      # PDF merge UI
│   ├── Compressor.tsx  # PDF compression UI
│   ├── Rotator.tsx     # PDF rotation UI
│   ├── PdfToJpg.tsx    # PDF to JPG conversion UI
│   └── PdfToText.tsx   # Text extraction UI
└── hooks/
    └── usePdfHandler.ts  # PDF state management
```

## Core Technologies

- **pdf-lib**: PDF creation and modification
- **pdf.js**: PDF rendering and text extraction
- **JSZip**: ZIP file generation for batch exports
- **React + TypeScript**: Frontend framework
- **Tailwind CSS**: Styling

## Key Functions (services/pdfUtils.ts)

```typescript
// Rendering
renderPdfPageAsImage(file, pageNumber, canvas?, scale?)

// Split Operations
splitPdfAndZip(file, splitPoints, fileNames)  // Visual split
splitPdfByRangesAndZip(file, ranges)           // Range split

// Merge Operations  
mergePdfs(files, outputFilename)

// Compress
compressPdf(file)

// Rotate
rotatePdf(file, rotations)

// Convert
convertPdfToJpgAndZip(file, selectedPages)
extractTextFromPdf(file)
```

## Usage

### Local Development

```bash
# Serve with Python
python -m http.server

# Or with Node serve
npx serve .

# Open http://localhost:8000
```

### Hermes Integration

To integrate with Hermes:

1. Copy the `.hermes-skill/` directory to your Hermes skills directory
2. Reference the skill in your Hermes configuration
3. The skill provides PDF manipulation capabilities for Hermes agents

## Privacy

All PDF processing happens entirely in the browser using JavaScript:
- Files are processed client-side via FileReader API
- No backend server required
- Files never leave the user's device

## License

UNLICENSED (private)
