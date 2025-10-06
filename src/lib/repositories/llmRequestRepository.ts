import { BaseRepository, DatabaseConnection } from './baseRepository';
import { LlmRequest, CreateLlmRequestData, UpdateLlmRequestData } from '../models/llmRequest';
import { PaginationOptions } from '../models/types';

export class LlmRequestRepository extends BaseRepository<LlmRequest, CreateLlmRequestData, UpdateLlmRequestData> {
  constructor(db: DatabaseConnection) {
    super(db, 'llm_requests');
  }

  async findById(id: number): Promise<LlmRequest | null> {
    const query = 'SELECT * FROM llm_requests WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findAll(options?: PaginationOptions): Promise<LlmRequest[]> {
    const baseQuery = 'SELECT * FROM llm_requests ORDER BY created_at DESC';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query);
    return result.rows;
  }

  async findByChatId(chatId: number, options?: PaginationOptions): Promise<LlmRequest[]> {
    const baseQuery = 'SELECT * FROM llm_requests WHERE chat_id = $1 ORDER BY created_at ASC';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query, [chatId]);
    return result.rows;
  }

  async create(data: CreateLlmRequestData): Promise<LlmRequest> {
    const query = `
      INSERT INTO llm_requests (chat_id, prompt, response)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.db.query(query, [
      data.chat_id,
      data.prompt,
      data.response
    ]);
    return result.rows[0];
  }

  async update(id: number, data: UpdateLlmRequestData): Promise<LlmRequest | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `
      UPDATE llm_requests 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM llm_requests WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }
}
