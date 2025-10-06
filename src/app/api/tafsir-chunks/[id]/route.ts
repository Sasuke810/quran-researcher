import { NextRequest } from 'next/server';
import { TafsirChunkController, TafsirChunkRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const tafsirChunkRepository = new TafsirChunkRepository(db);
const tafsirChunkController = new TafsirChunkController(tafsirChunkRepository);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return await tafsirChunkController.getById(id);
}
