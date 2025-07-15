// backend/index.js (ESM syntax)
import express from 'express';
import cors from 'cors';
import { createUploadthingExpressHandler } from 'uploadthing/express';

// ✅ Use import for your local files too
import { uploadRouter } from '../src/uploadthing/router.js'; // Note the .js extension is crucial for ESM local imports

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/uploadthing', createUploadthingExpressHandler({
  router: uploadRouter,
}));

app.listen(4000, () => {
  console.log('🚀 Server running on http://localhost:4000');
});