import { BaseModel, Vector } from './types';

export interface QuranText extends BaseModel {
  sura: number;
  aya: number;
  text: string;
  text_norm?: string;
  text_type_id: number;
  embedding?: Vector;
  ayah_key: string; // Generated: sura:aya
}

export interface CreateQuranTextData {
  sura: number;
  aya: number;
  text: string;
  text_norm?: string;
  text_type_id: number;
  embedding?: Vector;
}

export interface UpdateQuranTextData {
  text?: string;
  text_norm?: string;
  embedding?: Vector;
}

export interface QuranTextWithRelations extends QuranText {
  surah?: {
    id: number;
    name_ar: string;
    name_en?: string;
  };
  text_type?: {
    id: number;
    name: string;
    description?: string;
  };
}
