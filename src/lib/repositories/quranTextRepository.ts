import { BaseRepository, DatabaseConnection } from './baseRepository';
import { QuranText, CreateQuranTextData, UpdateQuranTextData, QuranTextWithRelations } from '../models/quranText';
import { PaginationOptions, SearchOptions } from '../models/types';

export class QuranTextRepository extends BaseRepository<QuranText, CreateQuranTextData, UpdateQuranTextData> {
  constructor(db: DatabaseConnection) {
    super(db, 'quran_text');
  }

  async findById(sura: number, aya: number, textTypeId: number): Promise<QuranText | null> {
    const query = 'SELECT * FROM quran_text WHERE sura = $1 AND aya = $2 AND text_type_id = $3';
    const result = await this.db.query(query, [sura, aya, textTypeId]);
    return result.rows[0] || null;
  }

  async findByAyahKey(ayahKey: string, textTypeId?: number): Promise<QuranText[]> {
    const [sura, aya] = ayahKey.split(':').map(Number);
    // Exclude embedding from results to reduce response size
    let query = 'SELECT sura, aya, text, text_norm, text_type_id, ayah_key, created_at, updated_at FROM quran_text WHERE sura = $1 AND aya = $2';
    const params = [sura, aya];

    if (textTypeId) {
      query += ' AND text_type_id = $3';
      params.push(textTypeId);
    }

    query += ' ORDER BY text_type_id';
    const result = await this.db.query(query, params);
    return result.rows;
  }

  async findBySurah(sura: number, textTypeId?: number, options?: PaginationOptions): Promise<QuranText[]> {
    // Exclude embedding from results to reduce response size
    let baseQuery = 'SELECT sura, aya, text, text_norm, text_type_id, ayah_key, created_at, updated_at FROM quran_text WHERE sura = $1';
    const params = [sura];

    if (textTypeId) {
      baseQuery += ' AND text_type_id = $2';
      params.push(textTypeId);
    }

    baseQuery += ' ORDER BY aya';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query, params);
    return result.rows;
  }

  async searchByText(searchQuery: string, textTypeId?: number, options?: SearchOptions): Promise<QuranText[]> {
    // Use both trigram similarity (%) and LIKE for better results
    // Trigram is good for fuzzy matching, LIKE is good for exact substring matches
    // Exclude embedding from results to reduce response size
    let baseQuery = `
      SELECT 
        sura, aya, text, text_norm, text_type_id, ayah_key, 
        created_at, updated_at,
        similarity(text_norm, $1) as sim_score
      FROM quran_text 
      WHERE (text_norm % $1 OR text_norm LIKE '%' || $1 || '%')
    `;
    const params = [searchQuery];

    if (textTypeId) {
      baseQuery += ' AND text_type_id = $2';
      params.push(textTypeId);
    }

    baseQuery += ' ORDER BY sim_score DESC, sura, aya';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query, params);
    return result.rows;
  }

  async countSearchResults(searchQuery: string, textTypeId?: number): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM quran_text 
      WHERE (text_norm % $1 OR text_norm LIKE '%' || $1 || '%')
    `;
    const params = [searchQuery];

    if (textTypeId) {
      query += ' AND text_type_id = $2';
      params.push(textTypeId);
    }

    const result = await this.db.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async findWithRelations(sura: number, aya: number, textTypeId: number): Promise<QuranTextWithRelations | null> {
    const query = `
      SELECT 
        qt.*,
        s.id as surah_id, s.name_ar as surah_name_ar, s.name_en as surah_name_en,
        qtt.id as text_type_id, qtt.name as text_type_name, qtt.description as text_type_description
      FROM quran_text qt
      LEFT JOIN surahs s ON qt.sura = s.id
      LEFT JOIN quran_text_types qtt ON qt.text_type_id = qtt.id
      WHERE qt.sura = $1 AND qt.aya = $2 AND qt.text_type_id = $3
    `;
    
    const result = await this.db.query(query, [sura, aya, textTypeId]);
    const row = result.rows[0];
    
    if (!row) return null;

    return {
      sura: row.sura,
      aya: row.aya,
      text: row.text,
      text_norm: row.text_norm,
      text_type_id: row.text_type_id,
      embedding: row.embedding,
      ayah_key: row.ayah_key,
      created_at: row.created_at,
      updated_at: row.updated_at,
      surah: {
        id: row.surah_id,
        name_ar: row.surah_name_ar,
        name_en: row.surah_name_en
      },
      text_type: {
        id: row.text_type_id,
        name: row.text_type_name,
        description: row.text_type_description
      }
    };
  }

  async findAll(options?: PaginationOptions): Promise<QuranText[]> {
    // Exclude embedding from results to reduce response size
    const baseQuery = 'SELECT sura, aya, text, text_norm, text_type_id, ayah_key, created_at, updated_at FROM quran_text ORDER BY sura, aya, text_type_id';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query);
    return result.rows;
  }

  async searchByEmbedding(
    queryEmbedding: number[],
    textTypeId?: number,
    options?: SearchOptions,
    similarityThreshold: number = -1.0,
    maxResults: number = 1000
  ): Promise<(QuranText & { similarity_score: number; distance: number })[]> {
    // Improve recall with more probes for IVFFlat index
    await this.db.query('SET ivfflat.probes = 10');

    // Use optimized pgvector search with halfvec for better performance
    // Exclude embedding from results to reduce response size
    let baseQuery = `
      WITH q AS (
        SELECT $1::vector AS v
      ),
      ranked_results AS (
        SELECT
          sura, aya, text, text_norm, text_type_id, ayah_key,
          created_at, updated_at,
          embedding <-> q.v AS distance,
          1.0 - (embedding <-> q.v) AS similarity_score,
          ROW_NUMBER() OVER (ORDER BY (1.0 - (embedding <-> q.v)) DESC) as rn
        FROM quran_text, q
        WHERE embedding IS NOT NULL
    `;
    const params: any[] = [JSON.stringify(queryEmbedding)];

    if (textTypeId) {
      baseQuery += ' AND text_type_id = $2';
      params.push(textTypeId);
    }

    // Close the ranked_results CTE and add the main query
    baseQuery += `
      )
      SELECT
        sura, aya, text, text_norm, text_type_id, ayah_key,
        created_at, updated_at, distance, similarity_score
      FROM ranked_results
      WHERE rn <= ${maxResults}
    `;

    // Only add similarity threshold filter if it's >= 0
    if (similarityThreshold >= 0) {
      baseQuery += ` AND similarity_score >= ${similarityThreshold}`;
    }

    baseQuery += ' ORDER BY similarity_score DESC';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query, params);
    return result.rows;
  }

  async countSemanticSearchResults(
    queryEmbedding: number[],
    textTypeId?: number,
    similarityThreshold: number = -1.0,
    maxResults: number = 1000
  ): Promise<number> {
    // Improve recall with more probes for IVFFlat index
    await this.db.query('SET ivfflat.probes = 10');

    // Count the actual results that would be returned by the search
    let query = `
      WITH q AS (
        SELECT $1::vector AS v
      ),
      ranked_results AS (
        SELECT
          1.0 - (embedding <-> q.v) AS similarity_score,
          ROW_NUMBER() OVER (ORDER BY (1.0 - (embedding <-> q.v)) DESC) as rn
        FROM quran_text, q
        WHERE embedding IS NOT NULL
    `;
    const params: any[] = [JSON.stringify(queryEmbedding)];

    if (textTypeId) {
      query += ' AND text_type_id = $2';
      params.push(textTypeId);
    }

    // Close the ranked_results CTE and add the count query
    query += `
      )
      SELECT COUNT(*) as count
      FROM ranked_results
      WHERE rn <= ${maxResults}
    `;

    // Only add similarity threshold filter if it's >= 0
    if (similarityThreshold >= 0) {
      query += ` AND similarity_score >= ${similarityThreshold}`;
    }

    const result = await this.db.query(query, params);
    return parseInt(result.rows[0].count);
  }
}
