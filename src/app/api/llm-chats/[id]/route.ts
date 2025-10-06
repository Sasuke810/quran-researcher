import { NextRequest } from 'next/server';
import { LlmChatController, LlmChatRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const llmChatRepository = new LlmChatRepository(db);
const llmChatController = new LlmChatController(llmChatRepository);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return await llmChatController.getById(id);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return await llmChatController.update(id, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  return await llmChatController.delete(id);
}
