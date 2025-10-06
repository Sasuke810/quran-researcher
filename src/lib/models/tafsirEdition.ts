import { BaseModel } from './types';

export interface TafsirEdition extends BaseModel {
  id: number;
  name_ar: string;
  name_en?: string;
  author_ar?: string;
  author_en?: string;
  description?: string;
  language: string; // Default 'ar'
  is_active: boolean;
}

export interface CreateTafsirEditionData {
  name_ar: string;
  name_en?: string;
  author_ar?: string;
  author_en?: string;
  description?: string;
  language?: string;
  is_active?: boolean;
}

export interface UpdateTafsirEditionData {
  name_ar?: string;
  name_en?: string;
  author_ar?: string;
  author_en?: string;
  description?: string;
  language?: string;
  is_active?: boolean;
}
