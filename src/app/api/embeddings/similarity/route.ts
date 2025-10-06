import { NextRequest } from 'next/server';
import { EmbedderController } from '@/lib';

// Initialize controller
const embedderController = new EmbedderController();

/**
 * POST /api/embeddings/similarity
 * Calculate cosine similarity between two texts
 * 
 * Request body:
 * {
 *   "text1": "First text",
 *   "text2": "Second text",
 *   "model": "text-embedding-3-small", // optional
 *   "normalize": true // optional, default: true
 * }
 */
export async function POST(request: NextRequest) {
  return await embedderController.calculateSimilarity(request);
}
