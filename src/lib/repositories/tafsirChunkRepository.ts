import { BaseRepository, DatabaseConnection } from './baseRepository';
import { TafsirChunk, CreateTafsirChunkData, UpdateTafsirChunkData } from '../models/tafsirChunk';
import { PaginationOptions } from '../models/types';

export class TafsirChunkRepository extends BaseRepository<TafsirChunk, CreateTafsirChunkData, UpdateTafsirChunkData> {
  constructor(db: DatabaseConnection) {
    super(db, 'tafsir_chunks');
  }

  async findById(id: number): Promise<TafsirChunk | null> {
    const query = 'SELECT * FROM tafsir_chunks WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll(options?: PaginationOptions): Promise<TafsirChunk[]> {
    const baseQuery = 'SELECT * FROM tafsir_chunks ORDER BY edition_id, sura, aya, chunk_idx';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query);
    return result.rows;
  }

  async findByEdition(editionId: number, options?: PaginationOptions): Promise<TafsirChunk[]> {
    const baseQuery = 'SELECT * FROM tafsir_chunks WHERE edition_id = $1 ORDER BY sura, aya, chunk_idx';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query, [editionId]);
    return result.rows;
  }
}
