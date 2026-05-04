# PDF Toolkit Pro

A powerful and beautiful web application to split, merge, compress, rotate, and convert PDF files with ease. Upload your files to get started with a suite of useful PDF tools.

## ✨ Features

PDF Toolkit Pro provides a range of tools to manage your PDF documents directly in your browser. All processing is done client-side, ensuring your files remain private and secure.

-   **Split PDF**:
    -   **Visual Split**: Click between pages to set split points visually.
    -   **Split by Range**: Define custom page ranges (e.g., `1-5, 8, 10-12`) to extract specific sections.
-   **Merge PDF**: Combine multiple PDF documents into a single file. Reorder files easily with drag-and-drop.
-   **Compress PDF**: Reduce the file size of your PDFs with basic compression.
-   **Rotate PDF**: Rotate individual pages or all pages at once by 90, 180, or 270 degrees.
-   **PDF to JPG**: Convert selected pages of your PDF into high-quality JPG images.
-   **PDF to Text**: Extract all text content from a PDF document for easy copying and editing.

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 🛠️ Built With

-   [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
-   [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript that compiles to plain JavaScript.
-   [Vite](https://vitejs.dev/) - Next generation frontend tooling.
-   [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
-   [pdf-lib](https://pdf-lib.js.org/) - A JavaScript library for creating and modifying PDF documents.
-   [pdf.js](https://mozilla.github.io/pdf.js/) - A Portable Document Format (PDF) viewer that is built with HTML5.
-   [JSZip](https://stuk.github.io/jszip/) - A JavaScript library for creating, reading and editing .zip files.

## 📁 Project Structure

```
src/
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
├── components/          # React components
│   ├── Splitter.tsx     # PDF splitting tool
│   ├── Merger.tsx       # PDF merging tool
│   ├── Compressor.tsx   # PDF compression tool
│   ├── Rotator.tsx      # PDF rotation tool
│   ├── PdfToJpg.tsx    # PDF to JPG conversion
│   ├── PdfToText.tsx   # PDF to text extraction
│   └── ...
├── services/
│   └── pdfUtils.ts     # PDF processing utilities
└── hooks/
    └── usePdfHandler.ts # PDF handling React hook
```

## 🌐 Deployment

This project is configured for automatic deployment via GitHub Actions to GitHub Pages.

### GitHub Pages Deployment

1. Push this project to a GitHub repository.
2. Go to repository **Settings** → **Pages**.
3. Under **Source**, select **GitHub Actions**.
4. Push to `main` branch - deployment starts automatically.

Or trigger manually from **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**.

The live site will be available at: `https://[username].github.io/[repo-name]/`

## 📝 License

MIT License