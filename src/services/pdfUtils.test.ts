import { beforeEach, describe, expect, it, vi } from 'vitest';
import download from 'downloadjs';
import { PDFDocument } from 'pdf-lib';
import { compressPdf, rotatePdf } from './pdfUtils';

vi.mock('downloadjs', () => ({ default: vi.fn() }));

async function samplePdf(): Promise<File> {
  const document = await PDFDocument.create();
  document.addPage([200, 300]);
  const bytes = await document.save();
  return new File([bytes], 'sample.pdf', { type: 'application/pdf' });
}

describe('client-side PDF transformations', () => {
  beforeEach(() => vi.mocked(download).mockClear());

  it('serializes a compressed PDF without uploading it', async () => {
    await compressPdf(await samplePdf());
    expect(download).toHaveBeenCalledOnce();
    expect(vi.mocked(download).mock.calls[0][1]).toBe('sample-compressed.pdf');
  });

  it('rotates a selected page and downloads a valid PDF', async () => {
    await rotatePdf(await samplePdf(), { 1: 90 });
    expect(download).toHaveBeenCalledOnce();
    const output = vi.mocked(download).mock.calls[0][0] as Uint8Array;
    const parsed = await PDFDocument.load(output);
    expect(parsed.getPage(0).getRotation().angle).toBe(90);
  });
});
