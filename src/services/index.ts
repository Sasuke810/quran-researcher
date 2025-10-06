// Chat Service
export { ChatService } from './chatService';

// OpenRouter Services
export { 
  OpenRouterService, 
  openRouterService,
  type OpenRouterModel,
  type OpenRouterMessage,
  type OpenRouterChatRequest,
  type OpenRouterChatResponse,
  type OpenRouterChoice,
  type OpenRouterError
} from './openRouterService';

export {
  OpenRouterClientService,
  POPULAR_MODELS
} from './openRouterClientService';

// Embedder Service
export {
  EmbedderService,
  embedderService,
  ArabicNormalizer,
  type OpenAIEmbeddingRequest,
  type OpenAIEmbeddingResponse,
  type OpenAIEmbeddingData,
  type OpenAIError,
  type EmbeddingConfig,
  type EmbeddingResult,
  type BatchEmbeddingResult
} from './embedderService';

// Agent Services
export {
  AgentService,
  agentService,
  type AgentMessage,
  type ToolCall,
  type ToolResult
} from './agentService';

export {
  AgentToolsService,
  AGENT_TOOLS
} from './agentToolsService';
