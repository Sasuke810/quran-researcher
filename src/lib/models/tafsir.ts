// Raw tafsir dump table model
export interface Tafsir {
  ayah_key?: string;
  group_ayah_key?: string;
  from_ayah?: string;
  to_ayah?: string;
  ayah_keys?: string;
  text?: string;
}

export interface CreateTafsirData {
  ayah_key?: string;
  group_ayah_key?: string;
  from_ayah?: string;
  to_ayah?: string;
  ayah_keys?: string;
  text?: string;
}

export interface UpdateTafsirData {
  ayah_key?: string;
  group_ayah_key?: string;
  from_ayah?: string;
  to_ayah?: string;
  ayah_keys?: string;
  text?: string;
}
