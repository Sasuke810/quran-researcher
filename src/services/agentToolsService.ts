import { getDbConnection } from '@/lib/database';
import { QuranTextRepository } from '@/lib/repositories/quranTextRepository';
import { TafsirRepository } from '@/lib/repositories/tafsirRepository';
import { TafsirChunkRepository } from '@/lib/repositories/tafsirChunkRepository';
import { SurahRepository } from '@/lib/repositories/surahRepository';
import { embedderService } from './embedderService';

// Initialize database connection and repositories
const db = getDbConnection();
const quranTextRepository = new QuranTextRepository(db);
const tafsirRepository = new TafsirRepository(db);
const tafsirChunkRepository = new TafsirChunkRepository(db);
const surahRepository = new SurahRepository(db);

/**
 * Tool definitions for the agent
 */
export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_quran_by_keywords',
      description: 'البحث في القرآن الكريم باستخدام الكلمات المفتاحية. يستخدم البحث النصي (trigram similarity) للعثور على الآيات التي تحتوي على الكلمات المطلوبة أو مشابهة لها.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'النص أو الكلمات المفتاحية للبحث عنها في القرآن (يفضل استخدام النص العربي المنقى)',
          },
          text_type_id: {
            type: 'integer',
            description: 'معرف نوع النص القرآني (1 = النص البسيط، افتراضي)',
            default: 1,
          },
          limit: {
            type: 'integer',
            description: 'عدد النتائج المطلوبة (افتراضي: 10، أقصى: 50)',
            default: 10,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_quran_by_meaning',
      description: 'البحث الدلالي في القرآن الكريم باستخدام المعنى. يستخدم embeddings للعثور على الآيات المشابهة في المعنى حتى لو لم تحتوي على نفس الكلمات.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'السؤال أو الموضوع للبحث عن آيات مشابهة في المعنى',
          },
          text_type_id: {
            type: 'integer',
            description: 'معرف نوع النص القرآني (1 = النص البسيط، افتراضي)',
            default: 1,
          },
          limit: {
            type: 'integer',
            description: 'عدد النتائج المطلوبة (افتراضي: 10، أقصى: 30)',
            default: 10,
          },
          similarity_threshold: {
            type: 'number',
            description: 'الحد الأدنى للتشابه (0.0 - 1.0، افتراضي: 0.7)',
            default: 0.7,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_ayah_by_reference',
      description: 'الحصول على آية محددة بالمرجع (رقم السورة:رقم الآية). مثال: "2:255" للحصول على آية الكرسي.',
      parameters: {
        type: 'object',
        properties: {
          ayah_key: {
            type: 'string',
            description: 'مرجع الآية بصيغة "رقم_السورة:رقم_الآية" (مثال: "2:255")',
          },
          text_type_id: {
            type: 'integer',
            description: 'معرف نوع النص القرآني (1 = النص البسيط، افتراضي)',
            default: 1,
          },
        },
        required: ['ayah_key'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_surah_ayahs',
      description: 'الحصول على آيات سورة كاملة أو جزء منها.',
      parameters: {
        type: 'object',
        properties: {
          surah_number: {
            type: 'integer',
            description: 'رقم السورة (1-114)',
          },
          text_type_id: {
            type: 'integer',
            description: 'معرف نوع النص القرآني (1 = النص البسيط، افتراضي)',
            default: 1,
          },
          limit: {
            type: 'integer',
            description: 'عدد الآيات المطلوبة (اختياري، افتراضي: جميع الآيات)',
          },
        },
        required: ['surah_number'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_tafsir',
      description: 'البحث في التفسير باستخدام الكلمات المفتاحية.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'النص أو الكلمات المفتاحية للبحث في التفسير',
          },
          edition_id: {
            type: 'integer',
            description: 'معرف نسخة التفسير (اختياري)',
          },
          limit: {
            type: 'integer',
            description: 'عدد النتائج المطلوبة (افتراضي: 10)',
            default: 10,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tafsir_for_ayah',
      description: 'الحصول على التفسير لآية محددة.',
      parameters: {
        type: 'object',
        properties: {
          ayah_key: {
            type: 'string',
            description: 'مرجع الآية بصيغة "رقم_السورة:رقم_الآية" (مثال: "2:255")',
          },
          edition_id: {
            type: 'integer',
            description: 'معرف نسخة التفسير (اختياري)',
          },
        },
        required: ['ayah_key'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_surah_info',
      description: 'الحصول على معلومات عن سورة (الاسم، عدد الآيات، مكية/مدنية، إلخ).',
      parameters: {
        type: 'object',
        properties: {
          surah_number: {
            type: 'integer',
            description: 'رقم السورة (1-114)',
          },
        },
        required: ['surah_number'],
      },
    },
  },
];

/**
 * Tool execution functions
 */
export class AgentToolsService {
  /**
   * Search Quran by keywords using trigram similarity
   */
  static async searchQuranByKeywords(
    query: string,
    textTypeId: number = 1,
    limit: number = 10
  ): Promise<any> {
    console.log(`[AgentTools] Searching Quran by keywords: "${query}", text_type_id: ${textTypeId}, limit: ${limit}`);
    
    try {
      // Normalize the search query for better matching
      const normalizer = embedderService.getNormalizer();
      const normalizedQuery = normalizer.normalize(query);
      console.log(`[AgentTools] Normalized query: "${normalizedQuery}"`);

      const results = await quranTextRepository.searchByText(normalizedQuery, textTypeId, {
        page: 1,
        limit: Math.min(limit, 50),
      });

      console.log(`[AgentTools] Found ${results.length} results for keyword search`);
      
      // If no results found, try searching for individual words
      if (results.length === 0 && normalizedQuery.includes(' ')) {
        console.log('[AgentTools] No results found, trying individual words...');
        const words = normalizedQuery.split(' ').filter(w => w.length > 2);
        console.log(`[AgentTools] Searching for words: ${words.join(', ')}`);
        
        // Try the first word
        if (words.length > 0) {
          const wordResults = await quranTextRepository.searchByText(words[0], textTypeId, {
            page: 1,
            limit: Math.min(limit, 50),
          });
          console.log(`[AgentTools] Found ${wordResults.length} results for word "${words[0]}"`);
          
          return wordResults.map((r: any) => ({
            ayah_key: r.ayah_key,
            surah: r.sura,
            ayah: r.aya,
            text: r.text,
            similarity_score: r.sim_score,
          }));
        }
      }
      
      return results.map((r: any) => ({
        ayah_key: r.ayah_key,
        surah: r.sura,
        ayah: r.aya,
        text: r.text,
        similarity_score: r.sim_score,
      }));
    } catch (error) {
      console.error('[AgentTools] Error in searchQuranByKeywords:', error);
      throw error;
    }
  }

  /**
   * Search Quran by meaning using semantic embeddings
   */
  static async searchQuranByMeaning(
    query: string,
    textTypeId: number = 1,
    limit: number = 10,
    similarityThreshold: number = 0.7
  ): Promise<any> {
    console.log(`[AgentTools] Searching Quran by meaning: "${query}", text_type_id: ${textTypeId}, limit: ${limit}, threshold: ${similarityThreshold}`);
    
    try {
      // Generate embedding for the query
      console.log('[AgentTools] Generating embedding for query...');
      const embeddingResult = await embedderService.embedText(query);
      console.log(`[AgentTools] Generated embedding with ${embeddingResult.dimensions} dimensions`);

      // Format embedding as PostgreSQL vector string
      const embeddingStr = `[${embeddingResult.embedding.join(',')}]`;

      // Search using cosine similarity with the halfvec index
      const sqlQuery = `
        SELECT 
          sura, aya, text, text_norm, text_type_id, ayah_key,
          1 - (embedding::halfvec(3072) <=> $1::vector::halfvec(3072)) as similarity
        FROM quran_text
        WHERE text_type_id = $2
          AND embedding IS NOT NULL
          AND 1 - (embedding::halfvec(3072) <=> $1::vector::halfvec(3072)) >= $3
        ORDER BY similarity DESC
        LIMIT $4
      `;

      console.log('[AgentTools] Executing semantic search query...');
      const result = await db.query(sqlQuery, [
        embeddingStr,
        textTypeId,
        similarityThreshold,
        Math.min(limit, 30),
      ]);

      console.log(`[AgentTools] Found ${result.rows.length} results for semantic search`);

      return result.rows.map((r: any) => ({
        ayah_key: r.ayah_key,
        surah: r.sura,
        ayah: r.aya,
        text: r.text,
        similarity_score: r.similarity,
      }));
    } catch (error) {
      console.error('[AgentTools] Error in searchQuranByMeaning:', error);
      throw error;
    }
  }

  /**
   * Get a specific ayah by reference
   */
  static async getAyahByReference(
    ayahKey: string,
    textTypeId: number = 1
  ): Promise<any> {
    console.log(`[AgentTools] Getting ayah by reference: ${ayahKey}, text_type_id: ${textTypeId}`);
    
    try {
      const results = await quranTextRepository.findByAyahKey(ayahKey, textTypeId);
      
      if (results.length === 0) {
        console.log(`[AgentTools] No ayah found for reference: ${ayahKey}`);
        return null;
      }

      console.log(`[AgentTools] Found ayah: ${ayahKey}`);
      const ayah = results[0];
      
      return {
        ayah_key: ayah.ayah_key,
        surah: ayah.sura,
        ayah: ayah.aya,
        text: ayah.text,
      };
    } catch (error) {
      console.error('[AgentTools] Error in getAyahByReference:', error);
      throw error;
    }
  }

  /**
   * Get ayahs from a surah
   */
  static async getSurahAyahs(
    surahNumber: number,
    textTypeId: number = 1,
    limit?: number
  ): Promise<any> {
    console.log(`[AgentTools] Getting ayahs for surah: ${surahNumber}, text_type_id: ${textTypeId}, limit: ${limit || 'all'}`);
    
    try {
      const results = await quranTextRepository.findBySurah(surahNumber, textTypeId, {
        page: 1,
        limit: limit,
      });

      console.log(`[AgentTools] Found ${results.length} ayahs for surah ${surahNumber}`);

      return results.map((r: any) => ({
        ayah_key: r.ayah_key,
        surah: r.sura,
        ayah: r.aya,
        text: r.text,
      }));
    } catch (error) {
      console.error('[AgentTools] Error in getSurahAyahs:', error);
      throw error;
    }
  }

  /**
   * Search tafsir by keywords
   */
  static async searchTafsir(
    query: string,
    editionId?: number,
    limit: number = 10
  ): Promise<any> {
    console.log(`[AgentTools] Searching tafsir: "${query}", edition_id: ${editionId || 'all'}, limit: ${limit}`);
    
    try {
      // Search in tafsir_chunks using trigram similarity
      let sqlQuery = `
        SELECT 
          id, edition_id, sura, aya, to_sura, to_aya, 
          ayah_keys, chunk_idx, text, text_norm,
          similarity(text_norm, $1) as sim_score
        FROM tafsir_chunks
        WHERE (text_norm % $1 OR text_norm LIKE '%' || $1 || '%')
      `;
      
      const params: any[] = [query];
      
      if (editionId) {
        sqlQuery += ' AND edition_id = $2';
        params.push(editionId);
      }
      
      sqlQuery += ' ORDER BY sim_score DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const result = await db.query(sqlQuery, params);
      
      console.log(`[AgentTools] Found ${result.rows.length} tafsir results`);

      return result.rows.map((r: any) => ({
        id: r.id,
        edition_id: r.edition_id,
        surah: r.sura,
        ayah: r.aya,
        ayah_keys: r.ayah_keys,
        text: r.text,
        similarity_score: r.sim_score,
      }));
    } catch (error) {
      console.error('[AgentTools] Error in searchTafsir:', error);
      throw error;
    }
  }

  /**
   * Get tafsir for a specific ayah
   */
  static async getTafsirForAyah(
    ayahKey: string,
    editionId?: number
  ): Promise<any> {
    console.log(`[AgentTools] Getting tafsir for ayah: ${ayahKey}, edition_id: ${editionId || 'all'}`);
    
    try {
      const [sura, aya] = ayahKey.split(':').map(Number);
      
      let sqlQuery = `
        SELECT 
          id, edition_id, sura, aya, to_sura, to_aya,
          ayah_keys, chunk_idx, text
        FROM tafsir_chunks
        WHERE sura = $1 AND aya = $2
      `;
      
      const params: any[] = [sura, aya];
      
      if (editionId) {
        sqlQuery += ' AND edition_id = $3';
        params.push(editionId);
      }
      
      sqlQuery += ' ORDER BY edition_id, chunk_idx';

      const result = await db.query(sqlQuery, params);
      
      console.log(`[AgentTools] Found ${result.rows.length} tafsir chunks for ayah ${ayahKey}`);

      return result.rows.map((r: any) => ({
        id: r.id,
        edition_id: r.edition_id,
        surah: r.sura,
        ayah: r.aya,
        ayah_keys: r.ayah_keys,
        text: r.text,
      }));
    } catch (error) {
      console.error('[AgentTools] Error in getTafsirForAyah:', error);
      throw error;
    }
  }

  /**
   * Get surah information
   */
  static async getSurahInfo(surahNumber: number): Promise<any> {
    console.log(`[AgentTools] Getting info for surah: ${surahNumber}`);
    
    try {
      const surah = await surahRepository.findById(surahNumber);
      
      if (!surah) {
        console.log(`[AgentTools] Surah not found: ${surahNumber}`);
        return null;
      }

      console.log(`[AgentTools] Found surah: ${surah.name_ar} (${surah.name_en})`);

      return {
        id: surah.id,
        name_ar: surah.name_ar,
        name_en: surah.name_en,
        revelation: surah.revelation,
        ayah_count: surah.ayah_count,
        page_start: surah.page_start,
        page_end: surah.page_end,
      };
    } catch (error) {
      console.error('[AgentTools] Error in getSurahInfo:', error);
      throw error;
    }
  }

  /**
   * Execute a tool by name with parameters
   */
  static async executeTool(toolName: string, parameters: any): Promise<any> {
    console.log(`[AgentTools] Executing tool: ${toolName}`);
    console.log(`[AgentTools] Parameters:`, JSON.stringify(parameters, null, 2));

    switch (toolName) {
      case 'search_quran_by_keywords':
        return await this.searchQuranByKeywords(
          parameters.query,
          parameters.text_type_id,
          parameters.limit
        );

      case 'search_quran_by_meaning':
        return await this.searchQuranByMeaning(
          parameters.query,
          parameters.text_type_id,
          parameters.limit,
          parameters.similarity_threshold
        );

      case 'get_ayah_by_reference':
        return await this.getAyahByReference(
          parameters.ayah_key,
          parameters.text_type_id
        );

      case 'get_surah_ayahs':
        return await this.getSurahAyahs(
          parameters.surah_number,
          parameters.text_type_id,
          parameters.limit
        );

      case 'search_tafsir':
        return await this.searchTafsir(
          parameters.query,
          parameters.edition_id,
          parameters.limit
        );

      case 'get_tafsir_for_ayah':
        return await this.getTafsirForAyah(
          parameters.ayah_key,
          parameters.edition_id
        );

      case 'get_surah_info':
        return await this.getSurahInfo(parameters.surah_number);

      default:
        console.error(`[AgentTools] Unknown tool: ${toolName}`);
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
