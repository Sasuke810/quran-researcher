import { BaseRepository, DatabaseConnection } from './baseRepository';
import { Surah, CreateSurahData, UpdateSurahData } from '../models/surah';
import { PaginationOptions } from '../models/types';

export class SurahRepository extends BaseRepository<Surah, CreateSurahData, UpdateSurahData> {
  constructor(db: DatabaseConnection) {
    super(db, 'surahs');
  }

  async findById(id: number): Promise<Surah | null> {
    const query = 'SELECT * FROM surahs WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll(options?: PaginationOptions): Promise<Surah[]> {
    const baseQuery = 'SELECT * FROM surahs ORDER BY id';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query);
    return result.rows;
  }

  async findByRevelation(revelation: 'makki' | 'madani', options?: PaginationOptions): Promise<Surah[]> {
    const baseQuery = 'SELECT * FROM surahs WHERE revelation = $1 ORDER BY id';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query, [revelation]);
    return result.rows;
  }
}
