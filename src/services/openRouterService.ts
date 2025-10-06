// OpenRouter API Types
export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  architecture: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  pricing: {
    prompt: string;
    completion: string;
    image?: string;
    request?: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: string;
    completion_tokens: string;
  };
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface OpenRouterChatRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  min_p?: number;
  top_a?: number;
  seed?: number;
  logit_bias?: Record<string, number>;
  logprobs?: boolean;
  top_logprobs?: number;
  response_format?: {
    type: 'text' | 'json_object';
  };
  stop?: string | string[];
  stream?: boolean;
  tools?: any[];
  tool_choice?: string | object;
  transforms?: string[];
}

export interface OpenRouterChoice {
  index: number;
  message: {
    role: string;
    content: string;
    refusal?: string;
  };
  logprobs?: {
    content: Array<{
      token: string;
      logprob: number;
      bytes: number[];
      top_logprobs: Array<{
        token: string;
        logprob: number;
        bytes: number[];
      }>;
    }>;
  };
  finish_reason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | 'function_call';
}

export interface OpenRouterChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenRouterChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint?: string;
}

export interface OpenRouterError {
  error: {
    type: string;
    code: string;
    message: string;
    metadata?: Record<string, any>;
  };
}

// OpenRouter Service Class
export class OpenRouterService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    this.defaultHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Quran Arabic Tech',
    };
  }

  /**
   * Get available models from OpenRouter
   */
  async getModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: this.defaultHeaders,
      });

      if (!response.ok) {
        const errorData: OpenRouterError = await response.json();
        throw new Error(`OpenRouter API error: ${errorData.error.message}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      throw error;
    }
  }

  /**
   * Send a chat completion request to OpenRouter
   */
  async createChatCompletion(request: OpenRouterChatRequest): Promise<OpenRouterChatResponse> {
    try {
      console.log('[OpenRouter] Sending request to:', `${this.baseUrl}/chat/completions`);
      console.log('[OpenRouter] Request model:', request.model);
      console.log('[OpenRouter] Message count:', request.messages.length);
      console.log('[OpenRouter] Has tools:', !!request.tools);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        console.error('[OpenRouter] Request failed with status:', response.status);
        let errorMessage = `OpenRouter API error (${response.status})`;
        try {
          const errorData: OpenRouterError = await response.json();
          console.error('[OpenRouter] Error response:', JSON.stringify(errorData, null, 2));
          errorMessage = `OpenRouter API error: ${errorData.error.message || errorData.error.code || 'Unknown error'}`;
          if (errorData.error.metadata) {
            console.error('[OpenRouter] Error metadata:', errorData.error.metadata);
          }
        } catch (parseError) {
          // If we can't parse the error, use the status text
          const responseText = await response.text();
          console.error('[OpenRouter] Raw error response:', responseText);
          errorMessage = `OpenRouter API error: ${response.statusText} (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating chat completion:', error);
      throw error;
    }
  }

  /**
   * Stream a chat completion request to OpenRouter
   */
  async createChatCompletionStream(
    request: OpenRouterChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: (response: OpenRouterChatResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const streamRequest = { ...request, stream: true };
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(streamRequest),
      });

      if (!response.ok) {
        const errorData: OpenRouterError = await response.json();
        throw new Error(`OpenRouter API error: ${errorData.error.message}`);
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
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                onChunk(parsed.choices[0].delta.content);
              }
              
              if (parsed.choices?.[0]?.finish_reason) {
                onComplete(parsed);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming chat completion:', error);
      onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    }
  }

  /**
   * Get a specific model by ID
   */
  async getModel(modelId: string): Promise<OpenRouterModel | null> {
    try {
      const models = await this.getModels();
      return models.find(model => model.id === modelId) || null;
    } catch (error) {
      console.error('Error fetching specific model:', error);
      throw error;
    }
  }

  /**
   * Get popular/recommended models
   */
  async getPopularModels(): Promise<OpenRouterModel[]> {
    try {
      const models = await this.getModels();
      // Filter for popular models (you can customize this logic)
      const popularModelIds = [
        'openai/gpt-4o',
        'openai/gpt-4o-mini',
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3-haiku',
        'google/gemini-pro-1.5',
        'meta-llama/llama-3.1-8b-instruct',
        'mistralai/mistral-7b-instruct',
      ];
      
      return models.filter(model => popularModelIds.includes(model.id));
    } catch (error) {
      console.error('Error fetching popular models:', error);
      throw error;
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.getModels();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export a singleton instance
export const openRouterService = new OpenRouterService();
