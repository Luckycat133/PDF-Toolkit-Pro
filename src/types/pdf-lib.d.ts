// PDF lib type declarations
declare module 'pdf-lib' {
  export interface PDFDocumentOptions {
    ignoreEncryption?: boolean;
    updateMetadata?: boolean;
  }

  export interface SaveOptions {
    useObjectStreams?: boolean;
    addDefaultPage?: boolean;
    objectsPerTick?: number;
    onProgress?: (progress: SaveProgress) => void;
  }

  export interface SaveProgress {
    phase: string;
    percent: number;
  }

  export class PDFDocument {
    static load(data: Uint8Array | ArrayBuffer, options?: PDFDocumentOptions): Promise<PDFDocument>;
    static create(options?: PDFDocumentOptions): Promise<PDFDocument>;

    getPage(index: number): PDFPage;
    getPages(): PDFPage[];
    addPage(size?: [number, number]): PDFPage;
    removePage(index: number): void;
    insertPage(index: number, page: PDFPage): void;
    getPageCount(): number;

    save(options?: SaveOptions): Promise<Uint8Array>;
    saveBase64(): string;

    setTitle(title: string): void;
    setAuthor(author: string): void;
    setSubject(subject: string): void;
    setKeywords(keywords: string[]): void;
    setProducer(producer: string): void;
    setCreator(creator: string): void;
    setCreationDate(date: Date): void;
    setModificationDate(date: Date): void;

    copyPages(source: PDFDocument, pageIndices: number[]): Promise<PDFPage[]>;
    register(encoder: unknown): void;
  }

  export interface PDFPageOptions {
    width?: number;
    height?: number;
  }

  export class PDFPage {
    setSize(width: number, height: number): void;
    getWidth(): number;
    getHeight(): number;
    setRotation(degrees: number): void;
    getRotation(): { angle: number };
    getMediaBox(): { x: number; y: number; width: number; height: number };
    setMediaBox(options: { x?: number; y?: number; width?: number; height?: number }): void;
    drawText(text: string, options?: DrawTextOptions): void;
    drawImage(image: PDFImage, options?: DrawImageOptions): void;
    drawPage(page: PDFPage, options?: DrawPageOptions): void;
  }

  export interface DrawTextOptions {
    x: number;
    y: number;
    size?: number;
    color?: Uint8Array;
    font?: PDFFont;
    rotate?: { angle: number };
    opacity?: number;
  }

  export interface DrawImageOptions {
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotate?: { angle: number };
    opacity?: number;
  }

  export interface DrawPageOptions {
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotate?: { angle: number };
    opacity?: number;
  }

  export class PDFImage {}
  export class PDFFont {}

  export const degrees: (angle: number) => { angle: number };
  export const PDFName: { of: (name: string) => PDFName };
  export const PDFDict: {};
  export const PDFArray: {};
}
