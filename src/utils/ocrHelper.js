// src/utils/ocrHelper.js
import Tesseract from 'tesseract.js';

/**
 * Loads a base64 image onto a canvas and returns it as a Blob.
 * This is useful for ensuring consistent image input format for OCR,
 * or for any image manipulation before OCR.
 *
 * @param {string} base64Image - The base64 data URL of the image (e.g., data:image/png;base64,...).
 * @returns {Promise<Blob>} A Promise that resolves with the image data as a Blob.
 */
export function loadImageToCanvas(base64Image) {
  return new Promise((resolve, reject) => {
    try {
      if (!base64Image || typeof base64Image !== 'string' || !base64Image.startsWith('data:image/')) {
        return reject(new Error("Invalid or non-image base64 input for loadImageToCanvas."));
      }

      const img = new Image();
      img.src = base64Image; // Expects a correctly formatted image data URL

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        // Convert the canvas content to a Blob, which is a reliable format for Tesseract.js
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas."));
          }
        }, 'image/png'); // Always convert to PNG Blob for consistency
      };

      img.onerror = (e) => {
        console.error("loadImageToCanvas: Image failed to load.", e);
        reject(new Error("Image failed to load for canvas."));
      };
    } catch (err) {
      console.error("loadImageToCanvas: Caught an error.", err);
      reject(new Error("Error in loadImageToCanvas(): " + err.message));
    }
  });
}

/**
 * Extracts text from base64 encoded image or PDF data using Tesseract.js.
 *
 * @param {string} base64Data - The base64 data URL of the file (image or PDF).
 * @param {'image' | 'pdf'} fileType - The type of the file ('image' or 'pdf').
 * @returns {Promise<string>} A Promise that resolves with the extracted text.
 */
export const extractTextFromBase64Data = async (base64Data, fileType) => {
  let worker; // Declare worker outside try block for finally access
  try {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new Error("Invalid base64 data provided for OCR.");
    }
    if (!fileType || (fileType !== 'image' && fileType !== 'pdf')) {
      throw new Error("File type ('image' or 'pdf') is required and must be valid for OCR processing.");
    }

    // Create a Tesseract worker
    worker = await Tesseract.createWorker('eng', 1, {
      logger: m => console.log(m), // Log Tesseract's progress messages
    });

    let ocrInput;
    if (fileType === 'image') {
      // For images, convert the data URL to a Blob via canvas for robust Tesseract input.
      // This step ensures Tesseract receives a consistent image format.
      ocrInput = await loadImageToCanvas(base64Data);
    } else if (fileType === 'pdf') {
      // For PDFs, Tesseract.js can directly process the base64 data URL.
      // No need to load into canvas as Image object cannot handle PDFs.
      ocrInput = base64Data;
    }

    // Perform OCR recognition
    const { data: { text } } = await worker.recognize(ocrInput);

    console.log("✅ OCR Extracted Text:", text);
    return text;
  } catch (error) {
    console.error("❌ OCR Failed:", error); // Log the full error object for debugging
    return ''; // Return empty string on error to prevent app crash
  } finally {
    // Ensure the Tesseract worker is terminated to free up resources
    if (worker) {
      await worker.terminate();
    }
  }
};
