import { PaginationOptions, SearchOptions } from '../models/types';

export interface DatabaseConnection {
  query(text: string, params?: any[]): Promise<any>;
  transaction<T>(callback: (client: DatabaseConnection) => Promise<T>): Promise<T>;
}

export abstract class BaseRepository<T, CreateData, UpdateData> {
  protected db: DatabaseConnection;
  protected tableName: string;

  constructor(db: DatabaseConnection, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  abstract findById(id: number | string): Promise<T | null>;
  abstract findAll(options?: PaginationOptions): Promise<T[]>;

  protected buildPaginationQuery(baseQuery: string, options?: PaginationOptions): string {
    let query = baseQuery;
    
    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    
    if (options?.offset) {
      query += ` OFFSET ${options.offset}`;
    } else if (options?.page && options?.limit) {
      const offset = (options.page - 1) * options.limit;
      query += ` OFFSET ${offset}`;
    }
    
    return query;
  }

  async count(whereClause?: string, params?: any[]): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM ${this.tableName}${whereClause ? ` WHERE ${whereClause}` : ''}`;
    const result = await this.db.query(query, params);
    return parseInt(result.rows[0].count);
  }
}
