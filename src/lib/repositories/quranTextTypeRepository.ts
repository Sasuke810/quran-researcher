import { BaseRepository, DatabaseConnection } from './baseRepository';
import { QuranTextType, CreateQuranTextTypeData, UpdateQuranTextTypeData } from '../models/quranTextType';
import { PaginationOptions } from '../models/types';

export class QuranTextTypeRepository extends BaseRepository<QuranTextType, CreateQuranTextTypeData, UpdateQuranTextTypeData> {
  constructor(db: DatabaseConnection) {
    super(db, 'quran_text_types');
  }

  async findById(id: number): Promise<QuranTextType | null> {
    const query = 'SELECT * FROM quran_text_types WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByName(name: string): Promise<QuranTextType | null> {
    const query = 'SELECT * FROM quran_text_types WHERE name = $1';
    const result = await this.db.query(query, [name]);
    return result.rows[0] || null;
  }

  async findAll(options?: PaginationOptions): Promise<QuranTextType[]> {
    const baseQuery = 'SELECT * FROM quran_text_types ORDER BY id';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query);
    return result.rows;
  }
}
