import { NextRequest } from 'next/server';
import { LlmChatController, LlmChatRepository, getDbConnection } from '@/lib';

// Initialize dependencies
const db = getDbConnection();
const llmChatRepository = new LlmChatRepository(db);
const llmChatController = new LlmChatController(llmChatRepository);

export async function GET(request: NextRequest) {
  return await llmChatController.getAll(request);
}

export async function POST(request: NextRequest) {
  return await llmChatController.create(request);
}
