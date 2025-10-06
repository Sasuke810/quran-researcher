import { BaseModel } from './types';

export interface LlmChat extends BaseModel {
  id: number;
  user_id: string;
}

export interface CreateLlmChatData {
  user_id: string;
}

export interface UpdateLlmChatData {
  user_id?: string;
}

export interface LlmChatWithRequests extends LlmChat {
  requests?: {
    id: number;
    prompt: string;
    response?: string;
    created_at?: Date;
    updated_at?: Date;
  }[];
}
