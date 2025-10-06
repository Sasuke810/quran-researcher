import { BaseModel } from './types';

export interface LlmRequest extends BaseModel {
  id: number;
  chat_id: number;
  prompt: string;
  response?: string;
  model: string;
}

export interface CreateLlmRequestData {
  chat_id: number;
  prompt: string;
  response?: string;
  model: string;
}

export interface UpdateLlmRequestData {
  prompt?: string;
  response?: string;
  model?: string;
}

export interface LlmRequestWithChat extends LlmRequest {
  chat?: {
    id: number;
    user_id: string;
    created_at?: Date;
    updated_at?: Date;
  };
}
