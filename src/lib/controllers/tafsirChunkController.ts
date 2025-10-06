import { NextRequest } from 'next/server';
import { BaseController } from './baseController';
import { TafsirChunkRepository } from '../repositories/tafsirChunkRepository';

export class TafsirChunkController extends BaseController {
  constructor(private tafsirChunkRepository: TafsirChunkRepository) {
    super();
  }

  async getAll(request: NextRequest) {
    const pagination = this.extractPaginationFromRequest(request);
    const url = new URL(request.url);
    const editionId = url.searchParams.get('edition_id');

    try {
      let chunks;
      if (editionId) {
        chunks = await this.tafsirChunkRepository.findByEdition(parseInt(editionId), pagination);
      } else {
        chunks = await this.tafsirChunkRepository.findAll(pagination);
      }

      const total = await this.tafsirChunkRepository.count(
        editionId ? 'edition_id = $1' : undefined,
        editionId ? [parseInt(editionId)] : undefined
      );

      return this.createPaginatedResponse(chunks, {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total
      });
    } catch (error) {
      console.error('Failed to fetch tafsir chunks', error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch tafsir chunks',
        500
      );
    }
  }

  async getById(id: number) {
    try {
      const chunk = await this.tafsirChunkRepository.findById(id);
      if (!chunk) {
        return this.createErrorResponse('Tafsir chunk not found', 404);
      }
      return this.createSuccessResponse(chunk);
    } catch (error) {
      console.error(`Failed to fetch tafsir chunk with id ${id}`, error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : `Failed to fetch tafsir chunk with id ${id}`,
        500
      );
    }
  }
}
