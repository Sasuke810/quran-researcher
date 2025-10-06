import { NextRequest } from 'next/server';
import { EmbedderController } from '@/lib';

// Initialize controller
const embedderController = new EmbedderController();

/**
 * POST /api/embeddings/texts
 * Embed multiple text strings in batch
 * 
 * Request body:
 * {
 *   "texts": ["Text 1", "Text 2", "Text 3"],
 *   "model": "text-embedding-3-large", // optional, default: text-embedding-3-large
 *   "dimensions": 3072, // optional, default: 3072
 *   "normalize": true, // optional, default: true
 *   "batchSize": 100 // optional, default: 100
 * }
 */
export async function POST(request: NextRequest) {
  return await embedderController.embedTexts(request);
}
