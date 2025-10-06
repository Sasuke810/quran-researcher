import { BaseModel } from './types';

export interface QuranTextType extends BaseModel {
  id: number;
  name: string; // 'uthmani', 'simple', 'en_sahih', etc.
  description?: string;
}

export interface CreateQuranTextTypeData {
  name: string;
  description?: string;
}

export interface UpdateQuranTextTypeData {
  name?: string;
  description?: string;
}
