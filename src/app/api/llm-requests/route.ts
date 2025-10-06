import { NextRequest } from 'next/server';
import { LlmRequestController, LlmRequestRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const llmRequestRepository = new LlmRequestRepository(db);
const llmRequestController = new LlmRequestController(llmRequestRepository);

export async function GET(request: NextRequest) {
  return await llmRequestController.getAll(request);
}

export async function POST(request: NextRequest) {
  return await llmRequestController.create(request);
}
