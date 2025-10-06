import { NextRequest } from 'next/server';
import { LlmRequestController, LlmRequestRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const llmRequestRepository = new LlmRequestRepository(db);
const llmRequestController = new LlmRequestController(llmRequestRepository);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return await llmRequestController.getById(id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return await llmRequestController.update(id, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return await llmRequestController.delete(id);
}
