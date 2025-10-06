import { NextRequest } from 'next/server';
import { QuranTextController, QuranTextRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const quranTextRepository = new QuranTextRepository(db);
const quranTextController = new QuranTextController(quranTextRepository);

/**
 * GET /api/quran-texts/semantic-search
 * Perform semantic search on Quran texts using vector embeddings
 *
 * Query parameters:
 * - q: Search query text (required)
 * - text_type_id: Filter by text type ID (optional)
 * - similarity_threshold: Minimum similarity score (0-1, optional, default: -1 = no filtering)
 * - max_results: Maximum number of results to consider (optional, default: 1000)
 * - page: Page number for pagination (optional, default: 1)
 * - limit: Number of results per page (optional, default: 10)
 *
 * Examples:
 * - /api/quran-texts/semantic-search?q=mercy&text_type_id=1&page=1&limit=20
 * - /api/quran-texts/semantic-search?q=mercy&similarity_threshold=0.7&max_results=500&limit=10
 */
export async function GET(request: NextRequest) {
  return await quranTextController.semanticSearch(request);
}
