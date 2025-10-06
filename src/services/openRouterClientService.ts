import { 
  OpenRouterModel, 
  OpenRouterChatRequest, 
  OpenRouterChatResponse,
  OpenRouterMessage 
} from './openRouterService';

const API_BASE_URL = '/api/openrouter';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class OpenRouterClientService {
  /**
   * Fetch available models
   */
  static async getModels(popularOnly: boolean = false): Promise<OpenRouterModel[]> {
    const url = `${API_BASE_URL}/models${popularOnly ? '?popular=true' : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const result: ApiResponse<OpenRouterModel[]> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to fetch models');
    }

    return result.data;
  }

  /**
   * Get popular models only
   */
  static async getPopularModels(): Promise<OpenRouterModel[]> {
    return this.getModels(true);
  }

  /**
   * Create a chat completion
   */
  static async createChatCompletion(request: OpenRouterChatRequest): Promise<OpenRouterChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create chat completion: ${response.statusText}`);
    }

    const result: ApiResponse<OpenRouterChatResponse> = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to create chat completion');
    }

    return result.data;
  }

  /**
   * Create a streaming chat completion
   */
  static async createStreamingChatCompletion(
    request: OpenRouterChatRequest,
    onChunk: (content: string) => void,
    onComplete: (response: OpenRouterChatResponse) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to create streaming chat completion: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              switch (parsed.type) {
                case 'chunk':
                  onChunk(parsed.content);
                  break;
                case 'complete':
                  onComplete(parsed.response);
                  return;
                case 'error':
                  onError(parsed.error);
                  return;
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown streaming error');
    }
  }

  /**
   * Helper method to create a simple chat message
   */
  static createMessage(role: 'system' | 'user' | 'assistant', content: string): OpenRouterMessage {
    return { role, content };
  }

  /**
   * Helper method to create a basic chat request
   */
  static createChatRequest(
    model: string,
    messages: OpenRouterMessage[],
    options?: Partial<OpenRouterChatRequest>
  ): OpenRouterChatRequest {
    return {
      model,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      ...options,
    };
  }

  /**
   * Quick method to send a single message and get a response
   */
  static async sendMessage(
    model: string,
    message: string,
    systemPrompt?: string,
    options?: Partial<OpenRouterChatRequest>
  ): Promise<string> {
    const messages: OpenRouterMessage[] = [];
    
    if (systemPrompt) {
      messages.push(this.createMessage('system', systemPrompt));
    }
    
    messages.push(this.createMessage('user', message));

    const request = this.createChatRequest(model, messages, options);
    const response = await this.createChatCompletion(request);

    return response.choices[0]?.message?.content || '';
  }

  /**
   * Quick method to send a message with streaming response
   */
  static async sendMessageStream(
    model: string,
    message: string,
    onChunk: (content: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: string) => void,
    systemPrompt?: string,
    options?: Partial<OpenRouterChatRequest>
  ): Promise<void> {
    const messages: OpenRouterMessage[] = [];
    
    if (systemPrompt) {
      messages.push(this.createMessage('system', systemPrompt));
    }
    
    messages.push(this.createMessage('user', message));

    const request = this.createChatRequest(model, messages, options);
    
    let fullResponse = '';
    
    await this.createStreamingChatCompletion(
      request,
      (chunk) => {
        fullResponse += chunk;
        onChunk(chunk);
      },
      (response) => {
        onComplete(fullResponse);
      },
      onError
    );
  }
}

// Export commonly used model IDs for convenience
export const POPULAR_MODELS = {
  GPT_4O: 'openai/gpt-4o',
  GPT_4O_MINI: 'openai/gpt-4o-mini',
  CLAUDE_3_5_SONNET: 'anthropic/claude-3.5-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  GEMINI_PRO: 'google/gemini-pro-1.5',
  LLAMA_3_1_8B: 'meta-llama/llama-3.1-8b-instruct',
  MISTRAL_7B: 'mistralai/mistral-7b-instruct',
} as const;
