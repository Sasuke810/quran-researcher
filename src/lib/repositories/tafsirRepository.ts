import { BaseRepository, DatabaseConnection } from './baseRepository';
import { Tafsir, CreateTafsirData, UpdateTafsirData } from '../models/tafsir';
import { PaginationOptions } from '../models/types';

export class TafsirRepository extends BaseRepository<Tafsir, CreateTafsirData, UpdateTafsirData> {
  constructor(db: DatabaseConnection) {
    super(db, 'tafsir');
  }

  async findById(id: string): Promise<Tafsir | null> {
    // This table doesn't have a primary key, so we'll use ayah_key as identifier
    const query = 'SELECT * FROM tafsir WHERE ayah_key = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll(options?: PaginationOptions): Promise<Tafsir[]> {
    const baseQuery = 'SELECT * FROM tafsir ORDER BY ayah_key';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query);
    return result.rows;
  }

  async findByAyahKey(ayahKey: string): Promise<Tafsir[]> {
    const query = 'SELECT * FROM tafsir WHERE ayah_key = $1';
    const result = await this.db.query(query, [ayahKey]);
    return result.rows;
  }
}
