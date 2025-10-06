import { NextRequest } from 'next/server';
import { EmbedderController } from '@/lib';

// Initialize controller
const embedderController = new EmbedderController();

/**
 * POST /api/embeddings/text
 * Embed a single text string
 * 
 * Request body:
 * {
 *   "text": "Text to embed",
 *   "model": "text-embedding-3-large", // optional, default: text-embedding-3-large
 *   "dimensions": 3072, // optional, default: 3072
 *   "normalize": true // optional, default: true
 * }
 */
export async function POST(request: NextRequest) {
  return await embedderController.embedText(request);
}
