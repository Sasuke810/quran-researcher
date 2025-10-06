import { NextRequest } from 'next/server';
import { BaseController } from './baseController';
import { TafsirEditionRepository } from '../repositories/tafsirEditionRepository';

export class TafsirEditionController extends BaseController {
  constructor(private tafsirEditionRepository: TafsirEditionRepository) {
    super();
  }

  async getAll(request: NextRequest) {
    const pagination = this.extractPaginationFromRequest(request);
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';

    try {
      let editions;
      if (activeOnly) {
        editions = await this.tafsirEditionRepository.findActive(pagination);
      } else {
        editions = await this.tafsirEditionRepository.findAll(pagination);
      }

      const total = await this.tafsirEditionRepository.count(
        activeOnly ? 'is_active = true' : undefined
      );

      return this.createPaginatedResponse(editions, {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total
      });
    } catch (error) {
      console.error('Failed to fetch tafsir editions', error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch tafsir editions',
        500
      );
    }
  }

  async getById(id: number) {
    try {
      const edition = await this.tafsirEditionRepository.findById(id);
      if (!edition) {
        return this.createErrorResponse('Tafsir edition not found', 404);
      }
      return this.createSuccessResponse(edition);
    } catch (error) {
      console.error(`Failed to fetch tafsir edition with id ${id}`, error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : `Failed to fetch tafsir edition with id ${id}`,
        500
      );
    }
  }
}
