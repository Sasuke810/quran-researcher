import {NextRequest} from 'next/server';
import {BaseController} from './baseController';
import {LlmChatRepository} from '../repositories/llmChatRepository';
import {CreateLlmChatData, UpdateLlmChatData} from '../models/llmChat';

export class LlmChatController extends BaseController {
  constructor(private llmChatRepository: LlmChatRepository) {
    super();
  }

  async getAll(request: NextRequest) {
    try {
      const pagination = this.extractPaginationFromRequest(request);
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');

      let chats;
      if (userId) {
        chats = await this.llmChatRepository.findByUserIdWithRequests(userId, pagination);
      } else {
        chats = await this.llmChatRepository.findAllWithRequests(pagination);
      }

      const total = await this.llmChatRepository.count(
        userId ? 'user_id = $1' : undefined,
        userId ? [userId] : undefined
      );

      return this.createPaginatedResponse(chats, {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total
      });
    } catch (error) {
      console.error('Failed to fetch LLM chats', error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch LLM chats',
        500
      );
    }
  }

  async getById(id: number) {
    return this.handleRequest(async () => {
      const chat = await this.llmChatRepository.findByIdWithRequests(id);
      if (!chat) {
        return this.createErrorResponse('LLM chat not found', 404);
      }
      return chat;
    }, `Failed to fetch LLM chat with id ${id}`);
  }

  async create(request: NextRequest) {
    return this.handleRequest(async () => {
      const data: CreateLlmChatData = await request.json();
      
      const validationError = this.validateRequiredFields(data, ['user_id']);
      if (validationError) {
        return this.createErrorResponse(validationError);
      }

      return await this.llmChatRepository.create(data);
    }, 'Failed to create LLM chat');
  }

  async update(id: number, request: NextRequest) {
    return this.handleRequest(async () => {
      const data: UpdateLlmChatData = await request.json();
      const chat = await this.llmChatRepository.update(id, data);
      
      if (!chat) {
        return this.createErrorResponse('LLM chat not found', 404);
      }
      
      return chat;
    }, `Failed to update LLM chat with id ${id}`);
  }

  async delete(id: number) {
    return this.handleRequest(async () => {
      const deleted = await this.llmChatRepository.delete(id);
      if (!deleted) {
        return this.createErrorResponse('LLM chat not found', 404);
      }
      return { message: 'LLM chat deleted successfully' };
    }, `Failed to delete LLM chat with id ${id}`);
  }
}
