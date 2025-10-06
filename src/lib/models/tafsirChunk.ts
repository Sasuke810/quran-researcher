import { BaseModel, Vector } from './types';

export interface TafsirChunk extends BaseModel {
  id: number;
  edition_id: number;
  sura: number;
  aya: number;
  to_sura?: number;
  to_aya?: number;
  ayah_keys?: string[];
  chunk_idx: number;
  text: string;
  text_norm?: string;
  embedding?: Vector;
}

export interface CreateTafsirChunkData {
  edition_id: number;
  sura: number;
  aya: number;
  to_sura?: number;
  to_aya?: number;
  ayah_keys?: string[];
  chunk_idx?: number;
  text: string;
  text_norm?: string;
  embedding?: Vector;
}

export interface UpdateTafsirChunkData {
  text?: string;
  text_norm?: string;
  embedding?: Vector;
  chunk_idx?: number;
}

export interface TafsirChunkWithRelations extends TafsirChunk {
  edition?: {
    id: number;
    name_ar: string;
    name_en?: string;
    author_ar?: string;
    author_en?: string;
  };
  surah?: {
    id: number;
    name_ar: string;
    name_en?: string;
  };
}
