import { LlmChat, CreateLlmChatData, LlmChatWithRequests } from '@/lib/models/llmChat';
import { LlmRequest, CreateLlmRequestData } from '@/lib/models/llmRequest';

const API_BASE_URL = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ChatService {
  /**
   * Fetch all chats for the current user
   */
  static async getAllChats(): Promise<LlmChatWithRequests[]> {
    const response = await fetch(`${API_BASE_URL}/llm-chats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chats: ${response.statusText}`);
    }

    const result: ApiResponse<LlmChatWithRequests[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch chats');
    }

    return result.data;
  }

  /**
   * Fetch a specific chat by ID
   */
  static async getChatById(id: number): Promise<LlmChatWithRequests> {
    const response = await fetch(`${API_BASE_URL}/llm-chats/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat: ${response.statusText}`);
    }

    const result: ApiResponse<LlmChatWithRequests> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch chat');
    }

    return result.data;
  }

  /**
   * Create a new chat
   */
  static async createChat(data: CreateLlmChatData): Promise<LlmChat> {
    const response = await fetch(`${API_BASE_URL}/llm-chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create chat: ${response.statusText}`);
    }

    const result: ApiResponse<LlmChat> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create chat');
    }

    return result.data;
  }

  /**
   * Delete a chat
   */
  static async deleteChat(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/llm-chats/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.statusText}`);
    }

    const result: ApiResponse<any> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete chat');
    }
  }

  /**
   * Fetch all requests for a specific chat
   */
  static async getRequestsByChatId(chatId: number): Promise<LlmRequest[]> {
    const response = await fetch(`${API_BASE_URL}/llm-requests?chat_id=${chatId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch requests: ${response.statusText}`);
    }

    const result: ApiResponse<LlmRequest[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch requests');
    }

    return result.data;
  }

  /**
   * Create a new request (send a message)
   */
  static async createRequest(data: CreateLlmRequestData): Promise<LlmRequest> {
    const response = await fetch(`${API_BASE_URL}/llm-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create request: ${response.statusText}`);
    }

    const result: ApiResponse<LlmRequest> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create request');
    }

    return result.data;
  }

  /**
   * Update a request (e.g., add response)
   */
  static async updateRequest(id: number, data: Partial<LlmRequest>): Promise<LlmRequest> {
    const response = await fetch(`${API_BASE_URL}/llm-requests/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update request: ${response.statusText}`);
    }

    const result: ApiResponse<LlmRequest> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update request');
    }

    return result.data;
  }

  /**
   * Delete a request
   */
  static async deleteRequest(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/llm-requests/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete request: ${response.statusText}`);
    }

    const result: ApiResponse<any> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete request');
    }
  }
}
