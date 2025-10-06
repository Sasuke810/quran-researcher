import { NextRequest } from 'next/server';
import { QuranTextController, QuranTextRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const quranTextRepository = new QuranTextRepository(db);
const quranTextController = new QuranTextController(quranTextRepository);

export async function GET(request: NextRequest) {
  return await quranTextController.search(request);
}
