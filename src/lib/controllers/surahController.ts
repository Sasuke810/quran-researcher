import { NextRequest } from 'next/server';
import { BaseController } from './baseController';
import { SurahRepository } from '../repositories/surahRepository';

export class SurahController extends BaseController {
  constructor(private surahRepository: SurahRepository) {
    super();
  }

  async getAll(request: NextRequest) {
    const pagination = this.extractPaginationFromRequest(request);
    const url = new URL(request.url);
    const revelation = url.searchParams.get('revelation') as 'makki' | 'madani' | null;

    try {
      let surahs;
      if (revelation) {
        surahs = await this.surahRepository.findByRevelation(revelation, pagination);
      } else {
        surahs = await this.surahRepository.findAll(pagination);
      }

      const total = await this.surahRepository.count(
        revelation ? 'revelation = $1' : undefined,
        revelation ? [revelation] : undefined
      );

      return this.createPaginatedResponse(surahs, {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total
      });
    } catch (error) {
      console.error('Failed to fetch surahs', error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch surahs',
        500
      );
    }
  }

  async getById(id: number) {
    try {
      const surah = await this.surahRepository.findById(id);
      if (!surah) {
        return this.createErrorResponse('Surah not found', 404);
      }
      return this.createSuccessResponse(surah);
    } catch (error) {
      console.error(`Failed to fetch surah with id ${id}`, error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : `Failed to fetch surah with id ${id}`,
        500
      );
    }
  }


}
