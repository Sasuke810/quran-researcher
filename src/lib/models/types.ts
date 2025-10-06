// Common types used across models

export type RevelationType = 'makki' | 'madani';

export interface BaseModel {
  created_at?: Date;
  updated_at?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SearchOptions extends PaginationOptions {
  query?: string;
  filters?: Record<string, any>;
}

// Vector embedding type for pgvector
export type Vector = number[];

// Database connection types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}
