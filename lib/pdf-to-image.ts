/**
 * PDF to Image Converter
 * Converts PDF pages to PNG images for Mistral OCR
 *
 * Uses pdf.js (pdfjs-dist) to render PDF pages to canvas
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

// Configure pdf.js worker
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/legacy/build/pdf.worker.entry.js');

export interface PDFPageImage {
  pageNumber: number;
  imageBuffer: Buffer;
  width: number;
  height: number;
}

/**
 * Convert a single PDF page to PNG image
 */
async function convertPageToImage(
  page: any,
  pageNumber: number,
  scale: number = 2.0
): Promise<PDFPageImage> {
  // Get page viewport
  const viewport = page.getViewport({ scale });

  // Create canvas
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  // Render PDF page to canvas
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  // Convert canvas to PNG buffer
  const imageBuffer = canvas.toBuffer('image/png');

  return {
    pageNumber,
    imageBuffer,
    width: viewport.width,
    height: viewport.height,
  };
}

/**
 * Convert all pages of a PDF to PNG images
 */
export async function convertPDFToImages(
  pdfBuffer: Buffer,
  options: {
    maxPages?: number; // Limit number of pages (for cost control)
    scale?: number; // Higher = better quality but larger files (default: 2.0)
  } = {}
): Promise<PDFPageImage[]> {
  const { maxPages = 10, scale = 2.0 } = options;

  try {
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = Math.min(pdfDoc.numPages, maxPages);

    console.log(`[PDF→Image] Converting ${numPages} pages (out of ${pdfDoc.numPages} total)`);

    // Convert each page
    const images: PDFPageImage[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const image = await convertPageToImage(page, pageNum, scale);
      images.push(image);

      console.log(`[PDF→Image] Converted page ${pageNum}/${numPages} (${image.width}×${image.height})`);
    }

    return images;
  } catch (error: any) {
    console.error('[PDF→Image] Conversion error:', error);
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }
}

/**
 * Convert a single page of a PDF to image
 */
export async function convertPDFPageToImage(
  pdfBuffer: Buffer,
  pageNumber: number = 1,
  scale: number = 2.0
): Promise<PDFPageImage> {
  try {
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
    });

    const pdfDoc = await loadingTask.promise;

    if (pageNumber < 1 || pageNumber > pdfDoc.numPages) {
      throw new Error(`Page ${pageNumber} out of range (1-${pdfDoc.numPages})`);
    }

    const page = await pdfDoc.getPage(pageNumber);
    return await convertPageToImage(page, pageNumber, scale);
  } catch (error: any) {
    console.error('[PDF→Image] Conversion error:', error);
    throw new Error(`Failed to convert PDF page to image: ${error.message}`);
  }
}

/**
 * Get PDF page count without converting
 */
export async function getPDFPageCount(pdfBuffer: Buffer): Promise<number> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
    });

    const pdfDoc = await loadingTask.promise;
    return pdfDoc.numPages;
  } catch (error: any) {
    console.error('[PDF→Image] Error reading PDF:', error);
    throw new Error(`Failed to read PDF: ${error.message}`);
  }
}
