import { BaseRepository, DatabaseConnection } from './baseRepository';
import { LlmChat, CreateLlmChatData, UpdateLlmChatData, LlmChatWithRequests } from '../models/llmChat';
import { PaginationOptions } from '../models/types';

export class LlmChatRepository extends BaseRepository<LlmChat, CreateLlmChatData, UpdateLlmChatData> {
  constructor(db: DatabaseConnection) {
    super(db, 'llm_chats');
  }

  async findById(id: number): Promise<LlmChat | null> {
    const query = 'SELECT * FROM llm_chats WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByIdWithRequests(id: number): Promise<LlmChatWithRequests | null> {
    const chatQuery = 'SELECT * FROM llm_chats WHERE id = $1';
    const chatResult = await this.db.query(chatQuery, [id]);
    
    if (chatResult.rows.length === 0) return null;
    
    const chat = chatResult.rows[0];
    
    // Fetch associated requests
    const requestsQuery = `
      SELECT id, chat_id, prompt, response, created_at, updated_at
      FROM llm_requests 
      WHERE chat_id = $1 
      ORDER BY created_at ASC
    `;
    const requestsResult = await this.db.query(requestsQuery, [id]);
    
    return {
      ...chat,
      requests: requestsResult.rows
    };
  }

  async findAll(options?: PaginationOptions): Promise<LlmChat[]> {
    const baseQuery = 'SELECT * FROM llm_chats ORDER BY updated_at DESC';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query);
    return result.rows;
  }

  async findAllWithRequests(options?: PaginationOptions): Promise<LlmChatWithRequests[]> {
    const baseQuery = 'SELECT * FROM llm_chats ORDER BY updated_at DESC';
    const query = this.buildPaginationQuery(baseQuery, options);
    const chatsResult = await this.db.query(query);
    
    if (chatsResult.rows.length === 0) return [];
    
    // Fetch all requests for these chats
    const chatIds = chatsResult.rows.map(chat => chat.id);
    const requestsQuery = `
      SELECT id, chat_id, prompt, response, created_at, updated_at
      FROM llm_requests 
      WHERE chat_id = ANY($1)
      ORDER BY created_at ASC
    `;
    const requestsResult = await this.db.query(requestsQuery, [chatIds]);
    
    // Group requests by chat_id
    const requestsByChat: { [key: number]: any[] } = {};
    requestsResult.rows.forEach(req => {
      if (!requestsByChat[req.chat_id]) {
        requestsByChat[req.chat_id] = [];
      }
      requestsByChat[req.chat_id].push(req);
    });
    
    // Combine chats with their requests
    return chatsResult.rows.map(chat => ({
      ...chat,
      requests: requestsByChat[chat.id] || []
    }));
  }

  async findByUserId(userId: string, options?: PaginationOptions): Promise<LlmChat[]> {
    const baseQuery = 'SELECT * FROM llm_chats WHERE user_id = $1 ORDER BY updated_at DESC';
    const query = this.buildPaginationQuery(baseQuery, options);
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }

  async findByUserIdWithRequests(userId: string, options?: PaginationOptions): Promise<LlmChatWithRequests[]> {
    const baseQuery = 'SELECT * FROM llm_chats WHERE user_id = $1 ORDER BY updated_at DESC';
    const query = this.buildPaginationQuery(baseQuery, options);
    const chatsResult = await this.db.query(query, [userId]);
    
    if (chatsResult.rows.length === 0) return [];
    
    // Fetch all requests for these chats
    const chatIds = chatsResult.rows.map(chat => chat.id);
    const requestsQuery = `
      SELECT id, chat_id, prompt, response, created_at, updated_at
      FROM llm_requests 
      WHERE chat_id = ANY($1)
      ORDER BY created_at ASC
    `;
    const requestsResult = await this.db.query(requestsQuery, [chatIds]);
    
    // Group requests by chat_id
    const requestsByChat: { [key: number]: any[] } = {};
    requestsResult.rows.forEach(req => {
      if (!requestsByChat[req.chat_id]) {
        requestsByChat[req.chat_id] = [];
      }
      requestsByChat[req.chat_id].push(req);
    });
    
    // Combine chats with their requests
    return chatsResult.rows.map(chat => ({
      ...chat,
      requests: requestsByChat[chat.id] || []
    }));
  }

  async create(data: CreateLlmChatData): Promise<LlmChat> {
    const query = `
      INSERT INTO llm_chats (user_id)
      VALUES ($1)
      RETURNING *
    `;
    const result = await this.db.query(query, [data.user_id]);
    return result.rows[0];
  }

  async update(id: number, data: UpdateLlmChatData): Promise<LlmChat | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.user_id !== undefined) {
      fields.push(`user_id = $${paramCount++}`);
      values.push(data.user_id);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);
    
    const query = `
      UPDATE llm_chats 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM llm_chats WHERE id = $1';
    const result = await this.db.query(query, [id]);
    return result.rowCount > 0;
  }
}
