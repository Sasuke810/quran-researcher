import { NextRequest } from 'next/server';
import { EmbedderController } from '@/lib';

// Initialize controller
const embedderController = new EmbedderController();

/**
 * POST /api/embeddings/normalize
 * Normalize Arabic text without embedding
 * 
 * Request body:
 * {
 *   "text": "Arabic text to normalize"
 * }
 */
export async function POST(request: NextRequest) {
  return await embedderController.normalizeText(request);
}
