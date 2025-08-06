// // routes/ocrRoutes.js
// const express = require('express');
// const router = express.Router();
// const vision = require('@google-cloud/vision');
// const path = require('path');

// // ✅ Initialize Vision client with proper path
// const client = new vision.ImageAnnotatorClient({
//   keyFilename: path.join(__dirname, '..', 'visionServiceKey.json'),
// });

// // ✅ OCR Route
// router.post('/ocr-process', async (req, res) => {
//   const { data, type } = req.body;

//   try {
//     if (!data || !type) {
//       return res.status(400).json({ message: 'Missing data or file type.' });
//     }

//     let base64Content = data;

//     // ✅ Remove base64 prefix if it exists
//     if (data.startsWith('data:image')) {
//       base64Content = data.replace(/^data:image\/\w+;base64,/, '');
//     }

//     const buffer = Buffer.from(base64Content, 'base64');

//     // ✅ Only process image types (pdf support can be added later)
//     if (type !== 'image') {
//       return res.status(400).json({ message: 'Only image OCR is supported right now.' });
//     }
//     console.log("📨 OCR request received with type:", type);
//     console.log("📨 Base64 data length:", data.length);
    
//     // ✅ Call Google Vision OCR
//     try {
//       const [result] = await client.textDetection({ image: { content: buffer } });
//       console.log("✅ OCR result:", result);
//     } catch (err) {
//       console.error("❌ Error calling Google Vision API:", err);
//       return res.status(500).json({ message: 'Vision API call failed', error: err.message });
//     }
//         const detections = result.textAnnotations;
//     const extractedText = detections.length > 0 ? detections[0].description : '';

//     res.json({ extractedText });
//   } catch (err) {
//     console.error('❌ OCR Error:', err.message);
//     res.status(500).json({ message: 'OCR processing failed.', error: err.message });
//   }
// });

// module.exports = router;
