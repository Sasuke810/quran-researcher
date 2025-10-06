import { RevelationType } from './types';

export interface Surah {
  id: number; // 1..114
  name_ar: string;
  name_en?: string;
  ayah_count: number;
  revelation: RevelationType;
  page_start?: number;
  page_end?: number;
}

export interface CreateSurahData {
  id: number;
  name_ar: string;
  name_en?: string;
  ayah_count: number;
  revelation: RevelationType;
  page_start?: number;
  page_end?: number;
}

export interface UpdateSurahData {
  name_ar?: string;
  name_en?: string;
  ayah_count?: number;
  revelation?: RevelationType;
  page_start?: number;
  page_end?: number;
}
