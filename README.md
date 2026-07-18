# PDF Toolkit Pro

> **Status: Active — Public browser utility**  
> Build/privacy baseline last verified: 2026-07-18

Live site: **https://luckycat133.github.io/PDF-Toolkit-Pro/**

PDF Toolkit Pro splits, merges, rotates, performs basic reserialization-based compression, converts pages to JPG, and extracts text in the browser.

## Privacy boundary

PDF bytes are processed by browser JavaScript and Web Workers. The application does not intentionally upload documents to an application backend.

This statement does not mean the page is “offline”:

- the site and dependencies must still be downloaded;
- browser extensions and a compromised hosting origin remain part of the threat model;
- users should verify the deployed origin before opening sensitive documents.

The PDF.js worker is bundled with the application rather than loaded from a third-party CDN.

## Compression limitation

“Compress” currently re-saves the document with PDF object streams. It does not perform full image downsampling, font optimization, OCR, or the advanced transformations of a desktop PDF optimizer. Some files may shrink only slightly or can become larger.

## Features

- visual and range-based splitting;
- multi-file merge and reordering;
- page rotation;
- basic object-stream reserialization;
- PDF page to JPG conversion;
- text extraction for text-based PDFs.

Scanned documents require OCR, which this project does not provide.

## Development

```bash
npm ci
npm test
npm run build
```

A read-only CI workflow runs tests and a production build on pull requests; the GitHub Pages workflow repeats those checks before deployment.

## Current test scope

Automated smoke tests create PDFs in memory and verify compression serialization and rotation without uploading files. Additional browser coverage for encrypted, damaged, very large, Chinese, scanned, and high-page-count PDFs remains planned.

## Built with

React, TypeScript, Vite, pdf-lib, PDF.js, JSZip, and downloadjs.

## License

MIT
