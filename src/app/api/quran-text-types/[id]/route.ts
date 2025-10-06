import { NextRequest } from 'next/server';
import { QuranTextTypeController, QuranTextTypeRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const quranTextTypeRepository = new QuranTextTypeRepository(db);
const quranTextTypeController = new QuranTextTypeController(quranTextTypeRepository);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return await quranTextTypeController.getById(id);
}
