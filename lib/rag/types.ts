export type AstrologyCategory =
  | 'rashis'
  | 'bhavas'
  | 'grahas'
  | 'nakshatras'
  | 'dasha_timing'
  | 'yogas_doshas'
  | 'kundli_reading'
  | 'marriage_compatibility'
  | 'career_finance'
  | 'remedies_safety'
  | 'general_vedic';

export type KnowledgeType = 'book' | 'blog' | 'text' | 'qa_pair';

export interface AstrologyDocumentMeta {
  id: string;
  title: string;
  source: string; // e.g. "My Custom Astrology Book", "Brihat Parashara Hora Shastra"
  author?: string; // e.g. "Sage Parashara", "Traditional"
  category: AstrologyCategory;
  chapter?: string;
  section?: string;
  page?: number | string;
  tags?: string[];
  lastUpdated?: string;
  isCustomBook?: boolean;
  fileType?: 'pdf' | 'md' | 'txt' | 'json';
  fileName?: string;
  knowledgeType?: KnowledgeType;
  question?: string;
  answer?: string;
}

export interface AstrologyChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata: AstrologyDocumentMeta;
  hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceCitation {
  title: string;
  source: string;
  author?: string;
  chapter?: string;
  section?: string;
  page?: number | string;
  category: AstrologyCategory;
  score: number;
  snippet: string;
  isCustomBook?: boolean;
  knowledgeType?: KnowledgeType;
}

export interface RetrievalResult {
  chunks: AstrologyChunk[];
  citations: SourceCitation[];
  formattedContext: string;
  totalFound: number;
}

export interface RetrievalOptions {
  topK?: number;
  minScore?: number;
  category?: AstrologyCategory | AstrologyCategory[];
  topic?: string;
  preferCustomBook?: boolean;
  knowledgeType?: KnowledgeType | KnowledgeType[];
}

export interface KnowledgeRecord {
  id: string;
  type: KnowledgeType;
  title: string;
  author?: string;
  category: AstrologyCategory;
  fileName?: string;
  fileType?: 'pdf' | 'md' | 'txt' | 'json';
  totalPages?: number;
  totalChunks: number;
  isScanned?: boolean;
  question?: string;
  tags?: string[];
  summarySnippet?: string;
  uploadedAt: string;
  updatedAt: string;
}

// Backward compatibility alias for BookRecord
export type BookRecord = KnowledgeRecord;
