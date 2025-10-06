import {NextRequest} from 'next/server';
import {BaseController} from './baseController';
import {embedderService, EmbedderService, type EmbeddingConfig} from '@/services';

// Request/Response Types
export interface EmbedTextRequest {
    text: string;
    model?: string;
    dimensions?: number;
    normalize?: boolean;
}

export interface EmbedTextsRequest {
    texts: string[];
    model?: string;
    dimensions?: number;
    normalize?: boolean;
    batchSize?: number;
}

export interface EmbedTextResponse {
    embedding: number[];
    tokens: number;
    model: string;
    dimensions: number;
    normalizedText?: string;
}

export interface EmbedTextsResponse {
    embeddings: number[][];
    totalTokens: number;
    model: string;
    dimensions: number;
    normalizedTexts?: string[];
}

export interface EmbedderInfoResponse {
    availableModels: string[];
    modelDimensions: Record<string, number>;
    defaultConfig: {
        model: string;
        dimensions: number;
        batchSize: number;
        normalize: boolean;
    };
    normalizationRules: string;
}

export class EmbedderController extends BaseController {
    private embedderService: EmbedderService;

    constructor() {
        super();
        this.embedderService = embedderService;
    }

    /**
     * POST /api/embeddings/text
     * Embed a single text string
     */
    async embedText(request: NextRequest) {

        try {

            return this.handleRequest(async () => {
                const data: EmbedTextRequest = await request.json();

                // Validate required fields
                const validationError = this.validateRequiredFields(data, ['text']);
                if (validationError) {
                    return this.createErrorResponse(validationError);
                }

                // Validate text length (reasonable limit)
                if (data.text.length > 50000) {
                    return this.createErrorResponse('Text too long. Maximum length is 50,000 characters.');
                }

                // Prepare configuration - filter out undefined values
                const config: Partial<EmbeddingConfig> = {};
                if (data.model !== undefined) config.model = data.model;
                if (data.dimensions !== undefined) config.dimensions = data.dimensions;
                if (data.normalize !== undefined) config.normalize = data.normalize;

                // Get normalized text if normalization is enabled (default: true)
                const shouldNormalize = data.normalize!==false;
                const normalizedText = shouldNormalize
                        ? this.embedderService.getNormalizer().normalize(data.text)
                        :undefined;

                // Generate embedding
                const result = await this.embedderService.embedText(data.text, config);

                const response: EmbedTextResponse = {
                    embedding: result.embedding,
                    tokens: result.tokens,
                    model: result.model,
                    dimensions: result.dimensions,
                    ...(normalizedText && normalizedText!==data.text && {normalizedText})
                };

                return response;
            }, 'Failed to generate text embedding');


        } catch (e) {
            console.error('Failed to generate text embedding', e);
            return this.createErrorResponse(
                    e instanceof Error ? e.message:'Failed to generate text embedding',
                    500
            );
        }

    }

    /**
     * POST /api/embeddings/texts
     * Embed multiple text strings in batch
     */
    async embedTexts(request: NextRequest) {
        return this.handleRequest(async () => {
            const data: EmbedTextsRequest = await request.json();

            // Validate required fields
            const validationError = this.validateRequiredFields(data, ['texts']);
            if (validationError) {
                return this.createErrorResponse(validationError);
            }

            // Validate texts array
            if (!Array.isArray(data.texts)) {
                return this.createErrorResponse('texts must be an array');
            }

            if (data.texts.length===0) {
                return this.createErrorResponse('texts array cannot be empty');
            }

            if (data.texts.length > 1000) {
                return this.createErrorResponse('Maximum 1000 texts allowed per request');
            }

            // Validate each text
            for (let i = 0; i < data.texts.length; i++) {
                const text = data.texts[i];

                if (text.length > 50000) {
                    return this.createErrorResponse(`Text at index ${i} is too long. Maximum length is 50,000 characters.`);
                }
            }

            // Prepare configuration - filter out undefined values
            const config: Partial<EmbeddingConfig> = {};
            if (data.model !== undefined) config.model = data.model;
            if (data.dimensions !== undefined) config.dimensions = data.dimensions;
            if (data.normalize !== undefined) config.normalize = data.normalize;
            if (data.batchSize !== undefined) config.batchSize = data.batchSize;

            // Get normalized texts if normalization is enabled (default: true)
            const shouldNormalize = data.normalize!==false;
            const normalizedTexts = shouldNormalize
                    ? data.texts.map(text => this.embedderService.getNormalizer().normalize(text))
                    :undefined;

            // Generate embeddings
            const result = await this.embedderService.embedTexts(data.texts, config);

            const response: EmbedTextsResponse = {
                embeddings: result.embeddings,
                totalTokens: result.totalTokens,
                model: result.model,
                dimensions: result.dimensions,
                ...(normalizedTexts && {normalizedTexts})
            };

            return response;
        }, 'Failed to generate text embeddings');
    }

    /**
     * POST /api/embeddings/normalize
     * Normalize Arabic text without embedding
     */
    async normalizeText(request: NextRequest) {
        return this.handleRequest(async () => {
            const data: { text: string } = await request.json();

            // Validate required fields
            const validationError = this.validateRequiredFields(data, ['text']);
            if (validationError) {
                return this.createErrorResponse(validationError);
            }

            const normalizer = this.embedderService.getNormalizer();
            const normalized = normalizer.normalize(data.text);

            return {
                originalText: data.text,
                normalizedText: normalized,
                changed: data.text!==normalized,
                rules: normalizer.getRulesSummary()
            };
        }, 'Failed to normalize text');
    }

    /**
     * POST /api/embeddings/similarity
     * Calculate cosine similarity between two texts
     */
    async calculateSimilarity(request: NextRequest) {
        return this.handleRequest(async () => {
            const data: { text1: string; text2: string; model?: string; normalize?: boolean } = await request.json();

            // Validate required fields
            const validationError = this.validateRequiredFields(data, ['text1', 'text2']);
            if (validationError) {
                return this.createErrorResponse(validationError);
            }

            // Validate text lengths
            if (data.text1.length > 50000 || data.text2.length > 50000) {
                return this.createErrorResponse('Text too long. Maximum length is 50,000 characters.');
            }

            // Prepare configuration - filter out undefined values
            const config: Partial<EmbeddingConfig> = {};
            if (data.model !== undefined) config.model = data.model;
            if (data.normalize !== undefined) config.normalize = data.normalize;

            // Generate embeddings for both texts
            const [result1, result2] = await Promise.all([
                this.embedderService.embedText(data.text1, config),
                this.embedderService.embedText(data.text2, config)
            ]);

            // Calculate cosine similarity
            const similarity = this.cosineSimilarity(result1.embedding, result2.embedding);

            return {
                text1: data.text1,
                text2: data.text2,
                similarity,
                model: result1.model,
                tokens: result1.tokens + result2.tokens
            };
        }, 'Failed to calculate similarity');
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length!==b.length) {
            throw new Error('Vectors must have the same length');
        }

        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

        return dotProduct / (magnitudeA * magnitudeB);
    }
}
