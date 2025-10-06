import { NextRequest } from 'next/server';
import { TafsirEditionController, TafsirEditionRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const tafsirEditionRepository = new TafsirEditionRepository(db);
const tafsirEditionController = new TafsirEditionController(tafsirEditionRepository);

export async function GET(request: NextRequest) {
  return await tafsirEditionController.getAll(request);
}
