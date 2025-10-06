import { NextRequest } from 'next/server';
import { BaseController } from './baseController';
import { QuranTextRepository } from '../repositories/quranTextRepository';
import { embedderService } from '@/services/embedderService';

export class QuranTextController extends BaseController {
  constructor(private quranTextRepository: QuranTextRepository) {
    super();
  }

  async getAll(request: NextRequest) {
    const pagination = this.extractPaginationFromRequest(request);
    const url = new URL(request.url);
    const sura = url.searchParams.get('sura');
    const textTypeId = url.searchParams.get('text_type_id');

    try {
      let quranTexts;
      if (sura) {
        quranTexts = await this.quranTextRepository.findBySurah(
          parseInt(sura),
          textTypeId ? parseInt(textTypeId) : undefined,
          pagination
        );
      } else {
        quranTexts = await this.quranTextRepository.findAll(pagination);
      }

      const total = await this.quranTextRepository.count();
      return this.createPaginatedResponse(quranTexts, {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total
      });
    } catch (error) {
      console.error('Failed to fetch Quran texts', error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch Quran texts',
        500
      );
    }
  }

  async getByAyahKey(ayahKey: string, request: NextRequest) {
    try {
      const url = new URL(request.url);
      const textTypeId = url.searchParams.get('text_type_id');

      const quranTexts = await this.quranTextRepository.findByAyahKey(
        ayahKey,
        textTypeId ? parseInt(textTypeId) : undefined
      );

      return this.createSuccessResponse(quranTexts);
    } catch (error) {
      console.error(`Failed to fetch Quran text for ayah ${ayahKey}`, error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : `Failed to fetch Quran text for ayah ${ayahKey}`,
        500
      );
    }
  }

  async search(request: NextRequest) {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('q');
      const textTypeId = url.searchParams.get('text_type_id');

      if (!query) {
        return this.createErrorResponse('Search query is required');
      }

      const pagination = this.extractPaginationFromRequest(request);
      const results = await this.quranTextRepository.searchByText(
        query,
        textTypeId ? parseInt(textTypeId) : undefined,
        pagination
      );

      const total = await this.quranTextRepository.countSearchResults(
        query,
        textTypeId ? parseInt(textTypeId) : undefined
      );

      return this.createPaginatedResponse(results, {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total
      });
    } catch (error) {
      console.error('Failed to search Quran texts', error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to search Quran texts',
        500
      );
    }
  }

  async semanticSearch(request: NextRequest) {
    try {
      const url = new URL(request.url);
      const query = url.searchParams.get('q');
      const textTypeId = url.searchParams.get('text_type_id');
      const similarityThresholdParam = url.searchParams.get('similarity_threshold');
      const maxResultsParam = url.searchParams.get('max_results');

      // Default similarity threshold of -1.0 means return all results (no filtering)
      // You can set higher values like 0.7 for more relevant results
      const similarityThreshold = similarityThresholdParam ? parseFloat(similarityThresholdParam) : -1.0;

      // Default max results to limit the search space for better performance
      const maxResults = maxResultsParam ? parseInt(maxResultsParam) : 1000;

      if (!query) {
        return this.createErrorResponse('Search query is required');
      }

      if (similarityThreshold < -1 || similarityThreshold > 1) {
        return this.createErrorResponse('Similarity threshold must be between -1 and 1 (-1 means no filtering)');
      }

      // Generate embedding for the search query
      const embeddingResult = await embedderService.embedText(query);

      const pagination = this.extractPaginationFromRequest(request);
      const results = await this.quranTextRepository.searchByEmbedding(
        embeddingResult.embedding,
        textTypeId ? parseInt(textTypeId) : undefined,
        pagination,
        similarityThreshold,
        maxResults
      );

      const total = await this.quranTextRepository.countSemanticSearchResults(
        embeddingResult.embedding,
        textTypeId ? parseInt(textTypeId) : undefined,
        similarityThreshold,
        maxResults
      );

      return this.createPaginatedResponse(results, {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total,
        meta: {
          embedding_model: embeddingResult.model,
          embedding_dimensions: embeddingResult.dimensions,
          tokens_used: embeddingResult.tokens,
          similarity_threshold: similarityThreshold,
          max_results: maxResults
        }
      });
    } catch (error) {
      console.error('Failed to perform semantic search', error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to perform semantic search',
        500
      );
    }
  }


}
