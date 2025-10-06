import { BaseRepository, DatabaseConnection } from './baseRepository';
import { TafsirEdition, CreateTafsirEditionData, UpdateTafsirEditionData } from '../models/tafsirEdition';
import { PaginationOptions } from '../models/types';

export class TafsirEditionRepository extends BaseRepository<TafsirEdition, CreateTafsirEditionData, UpdateTafsirEditionData> {
  constructor(db: DatabaseConnection) {
    super(db, 'tafsir_editions');
  }

  async findById(id: number): Promise<TafsirEdition | null> {
    const query = 'SELECT * FROM tafsir_editions WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll(options?: PaginationOptions): Promise<TafsirEdition[]> {
    const baseQuery = 'SELECT * FROM tafsir_editions ORDER BY id';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query);
    return result.rows;
  }

  async findActive(options?: PaginationOptions): Promise<TafsirEdition[]> {
    const baseQuery = 'SELECT * FROM tafsir_editions WHERE is_active = true ORDER BY id';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query);
    return result.rows;
  }
}
