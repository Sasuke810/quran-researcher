import { NextRequest } from 'next/server';
import { BaseController } from './baseController';
import { QuranTextTypeRepository } from '../repositories/quranTextTypeRepository';
import { CreateQuranTextTypeData, UpdateQuranTextTypeData } from '../models/quranTextType';

export class QuranTextTypeController extends BaseController {
  constructor(private quranTextTypeRepository: QuranTextTypeRepository) {
    super();
  }

  async getAll(request: NextRequest) {
    const pagination = this.extractPaginationFromRequest(request);

    try {
      const textTypes = await this.quranTextTypeRepository.findAll(pagination);
      const total = await this.quranTextTypeRepository.count();

      return this.createPaginatedResponse(textTypes, {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total
      });
    } catch (error) {
      console.error('Failed to fetch Quran text types', error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch Quran text types',
        500
      );
    }
  }

  async getById(id: number) {
    try {
      const textType = await this.quranTextTypeRepository.findById(id);
      if (!textType) {
        return this.createErrorResponse('Quran text type not found', 404);
      }
      return this.createSuccessResponse(textType);
    } catch (error) {
      console.error(`Failed to fetch Quran text type with id ${id}`, error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : `Failed to fetch Quran text type with id ${id}`,
        500
      );
    }
  }

  async getByName(name: string) {
    try {
      const textType = await this.quranTextTypeRepository.findByName(name);
      if (!textType) {
        return this.createErrorResponse('Quran text type not found', 404);
      }
      return this.createSuccessResponse(textType);
    } catch (error) {
      console.error(`Failed to fetch Quran text type with name ${name}`, error);
      return this.createErrorResponse(
        error instanceof Error ? error.message : `Failed to fetch Quran text type with name ${name}`,
        500
      );
    }
  }


}
