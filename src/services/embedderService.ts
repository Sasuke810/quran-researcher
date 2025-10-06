// OpenAI Embedding API Types
export interface OpenAIEmbeddingRequest {
  input: string | string[];
  model: string;
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
  user?: string;
}

export interface OpenAIEmbeddingData {
  object: 'embedding';
  embedding: number[];
  index: number;
}

export interface OpenAIEmbeddingResponse {
  object: 'list';
  data: OpenAIEmbeddingData[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

// Embedding Configuration
export interface EmbeddingConfig {
  model?: string;
  dimensions?: number;
  batchSize?: number;
  normalize?: boolean;
}

// Embedding Result
export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
  dimensions: number;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  totalTokens: number;
  model: string;
  dimensions: number;
}

// Arabic Text Normalizer
export class ArabicNormalizer {
  private readonly normalizationRules: Array<[RegExp, string]> = [
    // Remove diacritics (tashkeel)
    [/[\u064B-\u065F\u0670\u0640]/g, ''], // Remove diacritics and tatweel
    // Normalize Alef variants
    [/[آأإ]/g, 'ا'], // Normalize Alef variants to plain Alef
    // Normalize Teh Marbuta
    [/ة/g, 'ه'], // Normalize Teh Marbuta to Heh
    // Normalize Yeh variants
    [/[يى]/g, 'ي'], // Normalize Yeh variants
    // Remove extra whitespace
    [/\s+/g, ' '], // Multiple spaces to single space
  ];

  normalize(text: string): string {
    let normalized = text.trim();
    for (const [pattern, replacement] of this.normalizationRules) {
      normalized = normalized.replace(pattern, replacement);
    }
    return normalized.trim();
  }

  getRulesSummary(): string {
    return "Remove diacritics, normalize Alef/Teh/Yeh variants, clean whitespace";
  }
}

// Embedder Service Class
export class EmbedderService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly normalizer: ArabicNormalizer;
  private readonly defaultConfig: Required<EmbeddingConfig>;

  constructor(config?: Partial<EmbeddingConfig>) {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
    
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.defaultHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    this.normalizer = new ArabicNormalizer();
    
    this.defaultConfig = {
      model: config?.model || 'text-embedding-3-large',
      dimensions: config?.dimensions || 3072,
      batchSize: config?.batchSize || 100,
      normalize: config?.normalize ?? true,
    };
  }

  /**
   * Embed a single text string
   */
  async embedText(
    text: string, 
    config?: Partial<EmbeddingConfig>
  ): Promise<EmbeddingResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Normalize text if requested
    const processedText = finalConfig.normalize ? this.normalizer.normalize(text) : text;
    
    try {
      const request: OpenAIEmbeddingRequest = {
        input: processedText,
        model: finalConfig.model,
        encoding_format: 'float',
      };

      // Add dimensions if supported by model
      if (this.supportsCustomDimensions(finalConfig.model) && finalConfig.dimensions) {
        request.dimensions = finalConfig.dimensions;
      }

      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData: OpenAIError = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error.message}`);
      }

      const data: OpenAIEmbeddingResponse = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No embedding data returned from OpenAI API');
      }

      const embeddingData = data.data[0];
      let embedding = embeddingData.embedding;

      // L2 normalize for cosine similarity if requested
      if (finalConfig.normalize) {
        embedding = this.normalizeVector(embedding);
      }

      return {
        embedding,
        tokens: data.usage.total_tokens,
        model: data.model,
        dimensions: embedding.length,
      };
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  /**
   * Embed multiple texts in batches
   */
  async embedTexts(
    texts: string[], 
    config?: Partial<EmbeddingConfig>
  ): Promise<BatchEmbeddingResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Normalize texts if requested
    const processedTexts = finalConfig.normalize 
      ? texts.map(text => this.normalizer.normalize(text))
      : texts;

    const allEmbeddings: number[][] = [];
    let totalTokens = 0;
    let model = '';
    let dimensions = 0;

    // Process in batches
    for (let i = 0; i < processedTexts.length; i += finalConfig.batchSize) {
      const batch = processedTexts.slice(i, i + finalConfig.batchSize);
      
      try {
        const request: OpenAIEmbeddingRequest = {
          input: batch,
          model: finalConfig.model,
          encoding_format: 'float',
        };

        // Add dimensions if supported by model
        if (this.supportsCustomDimensions(finalConfig.model) && finalConfig.dimensions) {
          request.dimensions = finalConfig.dimensions;
        }

        const response = await fetch(`${this.baseUrl}/embeddings`, {
          method: 'POST',
          headers: this.defaultHeaders,
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          const errorData: OpenAIError = await response.json();
          throw new Error(`OpenAI API error: ${errorData.error.message}`);
        }

        const data: OpenAIEmbeddingResponse = await response.json();
        
        if (!data.data || data.data.length === 0) {
          throw new Error('No embedding data returned from OpenAI API');
        }

        // Process embeddings from this batch
        for (const embeddingData of data.data) {
          let embedding = embeddingData.embedding;
          
          // L2 normalize for cosine similarity if requested
          if (finalConfig.normalize) {
            embedding = this.normalizeVector(embedding);
          }
          
          allEmbeddings.push(embedding);
        }

        totalTokens += data.usage.total_tokens;
        model = data.model;
        dimensions = data.data[0].embedding.length;

        // Small delay between batches to be respectful to API
        if (i + finalConfig.batchSize < processedTexts.length) {
          await this.delay(100);
        }
      } catch (error) {
        console.error(`Error processing batch ${Math.floor(i / finalConfig.batchSize) + 1}:`, error);
        throw error;
      }
    }

    return {
      embeddings: allEmbeddings,
      totalTokens,
      model,
      dimensions,
    };
  }

  /**
   * Check if a model supports custom dimensions
   */
  private supportsCustomDimensions(model: string): boolean {
    const modelsWithCustomDimensions = [
      'text-embedding-3-small',
      'text-embedding-3-large',
    ];
    return modelsWithCustomDimensions.includes(model);
  }

  /**
   * L2 normalize a vector for cosine similarity
   */
  private normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return norm > 0 ? vector.map(val => val / norm) : vector;
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get available embedding models
   */
  getAvailableModels(): string[] {
    return [
      'text-embedding-3-large', // This was used for embedding the Ayat
    ];
  }

  /**
   * Get model dimensions
   */
  getModelDimensions(model: string): number {
    const modelDimensions: Record<string, number> = {
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
      'text-embedding-ada-002': 1536,
    };
    return modelDimensions[model] || 1536;
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.embedText('test', { normalize: false });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the normalizer instance
   */
  getNormalizer(): ArabicNormalizer {
    return this.normalizer;
  }
}

// Export a singleton instance
export const embedderService = new EmbedderService();
