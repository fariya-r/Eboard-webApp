// src/services/ocrService.js

// IMPORTANT: For production, NEVER expose your API key directly in frontend code.
// Instead, create a backend endpoint (e.g., in your Laravel app) that acts as a proxy
// to call the Google Cloud Vision API.

const OCR_BACKEND_ENDPOINT = 'http://localhost:5000/api/ocr-process'; // Your Laravel endpoint

/**
 * Sends file data (base64) to the backend for OCR processing.
 * @param {string} base64Data - Base64 string of the file.
 * @param {string} fileType - 'image' or 'pdf'.
 * @returns {Promise<string>} Recognized text.
 */
export const extractTextFromImageOrPdf = async (base64Data, fileType) => {
  try {
    const response = await fetch(OCR_BACKEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization headers if your Laravel backend requires it
      },
      body: JSON.stringify({
        data: base64Data,
        type: fileType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OCR failed: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const result = await response.json();
    return result.extractedText || '';
  } catch (error) {
    console.error("Error during OCR process:", error);
    throw error;
  }
};