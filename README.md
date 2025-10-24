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

## 🚀 Getting Started

This is a client-side application and requires no backend. To run it locally, you can serve the project directory with any static file server.

1.  **Download the project files.**
2.  **Serve the files.** A simple way is to use a VS Code extension like "Live Server" or a simple command-line server:
    ```bash
    # If you have Python 3
    python -m http.server

    # If you have Node.js and the 'serve' package installed
    # npm install -g serve
    # serve .
    ```
3.  **Open your browser** and navigate to the local server address (e.g., `http://localhost:8000`).

## 🛠️ Built With

-   [React](https://reactjs.org/) - A JavaScript library for building user interfaces.
-   [TypeScript](https://www.typescriptlang.org/) - A typed superset of JavaScript that compiles to plain JavaScript.
-   [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework for rapid UI development.
-   [pdf-lib](https://pdf-lib.js.org/) - A JavaScript library for creating and modifying PDF documents.
-   [pdf.js](https://mozilla.github.io/pdf.js/) - A Portable Document Format (PDF) viewer that is built with HTML5.
-   [JSZip](https://stuk.github.io/jszip/) - A JavaScript library for creating, reading and editing .zip files.
