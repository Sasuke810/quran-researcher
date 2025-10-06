import { NextRequest } from 'next/server';
import { SurahController, SurahRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const surahRepository = new SurahRepository(db);
const surahController = new SurahController(surahRepository);

export async function GET(request: NextRequest) {
  return await surahController.getAll(request);
}
