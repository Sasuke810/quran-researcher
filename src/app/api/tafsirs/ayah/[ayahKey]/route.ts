import { NextRequest } from 'next/server';
import { TafsirController, TafsirRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const tafsirRepository = new TafsirRepository(db);
const tafsirController = new TafsirController(tafsirRepository);

export async function GET(
  request: NextRequest,
  { params }: { params: { ayahKey: string } }
) {
  return await tafsirController.getByAyahKey(decodeURIComponent(params.ayahKey));
}
