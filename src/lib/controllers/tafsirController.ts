import { NextRequest } from 'next/server';
import { BaseController } from './baseController';
import { TafsirRepository } from '../repositories/tafsirRepository';

export class TafsirController extends BaseController {
  constructor(private tafsirRepository: TafsirRepository) {
    super();
  }

  async getAll(request: NextRequest) {
    const pagination = this.extractPaginationFromRequest(request);

    try {
      const tafsirs = await this.tafsirRepository.findAll(pagination);
      const total = await this.tafsirRepository.count();

      return this.createPaginatedResponse(tafsirs, {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total
      });
    } catch (error) {
      console.error('Failed to fetch tafsirs', error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch tafsirs',
        500
      );
    }
  }

  async getByAyahKey(ayahKey: string) {
    try {
      const tafsirs = await this.tafsirRepository.findByAyahKey(ayahKey);
      return this.createSuccessResponse(tafsirs);
    } catch (error) {
      console.error(`Failed to fetch tafsir for ayah ${ayahKey}`, error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : `Failed to fetch tafsir for ayah ${ayahKey}`,
        500
      );
    }
  }
}
