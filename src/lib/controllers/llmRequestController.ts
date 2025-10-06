import { NextRequest } from 'next/server';
import { BaseController } from './baseController';
import { LlmRequestRepository } from '../repositories/llmRequestRepository';
import { CreateLlmRequestData, UpdateLlmRequestData } from '../models/llmRequest';

export class LlmRequestController extends BaseController {
  constructor(private llmRequestRepository: LlmRequestRepository) {
    super();
  }

  async getAll(request: NextRequest) {
    return this.handleRequest(async () => {
      const pagination = this.extractPaginationFromRequest(request);
      const url = new URL(request.url);
      const chatId = url.searchParams.get('chat_id');

      let requests;
      if (chatId) {
        requests = await this.llmRequestRepository.findByChatId(parseInt(chatId), pagination);
      } else {
        requests = await this.llmRequestRepository.findAll(pagination);
      }

      const total = await this.llmRequestRepository.count(
        chatId ? 'chat_id = $1' : undefined,
        chatId ? [parseInt(chatId)] : undefined
      );

      return this.createPaginatedResponse(requests, {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total
      });
    }, 'Failed to fetch LLM requests');
  }

  async getById(id: number) {
    return this.handleRequest(async () => {
      const request = await this.llmRequestRepository.findById(id);
      if (!request) {
        return this.createErrorResponse('LLM request not found', 404);
      }
      return request;
    }, `Failed to fetch LLM request with id ${id}`);
  }

  async create(request: NextRequest) {
    return this.handleRequest(async () => {
      const data: CreateLlmRequestData = await request.json();
      
      const validationError = this.validateRequiredFields(data, ['chat_id', 'prompt', 'model']);
      if (validationError) {
        return this.createErrorResponse(validationError);
      }

      const llmRequest = await this.llmRequestRepository.create(data);
      return llmRequest;
    }, 'Failed to create LLM request');
  }

  async update(id: number, request: NextRequest) {
    return this.handleRequest(async () => {
      const data: UpdateLlmRequestData = await request.json();
      const llmRequest = await this.llmRequestRepository.update(id, data);
      
      if (!llmRequest) {
        return this.createErrorResponse('LLM request not found', 404);
      }
      
      return llmRequest;
    }, `Failed to update LLM request with id ${id}`);
  }

  async delete(id: number) {
    return this.handleRequest(async () => {
      const deleted = await this.llmRequestRepository.delete(id);
      if (!deleted) {
        return this.createErrorResponse('LLM request not found', 404);
      }
      return { message: 'LLM request deleted successfully' };
    }, `Failed to delete LLM request with id ${id}`);
  }
}
