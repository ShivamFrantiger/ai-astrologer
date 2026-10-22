/**
 * @fileOverview High-Performance Persistent Vector Database for Astrology RAG
 * Operates independently of MongoDB, using persistent disk storage and in-memory cosine indexing.
 */

import fs from 'fs';
import path from 'path';
import { AstrologyChunk, KnowledgeRecord, KnowledgeType, RetrievalOptions } from './types';

interface VectorStoreData {
  version: number;
  updatedAt: string;
  chunks: AstrologyChunk[];
  records: KnowledgeRecord[];
}

const STORE_PATH = path.join(process.cwd(), 'knowledge', 'vector_store.json');

// In-memory cache
let inMemoryStore: VectorStoreData | null = null;

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadStore(): VectorStoreData {
  if (inMemoryStore) {
    return inMemoryStore;
  }

  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      // Ensure backwards compatibility with old books field
      if (parsed.books && !parsed.records) {
        parsed.records = parsed.books.map((b: any) => ({
          ...b,
          type: b.type || 'book',
        }));
      }
      inMemoryStore = {
        version: parsed.version || 2,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        chunks: parsed.chunks || [],
        records: parsed.records || [],
      };
      return inMemoryStore!;
    }
  } catch (err) {
    console.warn('Failed to load existing vector store file, initializing fresh store:', err);
  }

  inMemoryStore = {
    version: 2,
    updatedAt: new Date().toISOString(),
    chunks: [],
    records: [],
  };

  saveStore();
  return inMemoryStore;
}

export function saveStore(): void {
  if (!inMemoryStore) return;
  try {
    ensureDirectoryExists(STORE_PATH);
    inMemoryStore.updatedAt = new Date().toISOString();
    fs.writeFileSync(STORE_PATH, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write vector store to disk:', err);
  }
}

/**
 * Cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search vectors with semantic cosine similarity, category filtering, and custom priority
 */
export async function searchVectorStore(
  queryVector: number[],
  options: RetrievalOptions = {}
): Promise<Array<AstrologyChunk & { score: number }>> {
  const { topK = 5, minScore = 0.40, category, preferCustomBook = true, knowledgeType } = options;
  const store = loadStore();

  const categories = category
    ? Array.isArray(category)
      ? category
      : [category]
    : null;

  const allowedTypes = knowledgeType
    ? Array.isArray(knowledgeType)
      ? knowledgeType
      : [knowledgeType]
    : null;

  const scored: Array<AstrologyChunk & { score: number }> = [];

  for (const chunk of store.chunks) {
    if (categories && !categories.includes(chunk.metadata.category) && !chunk.metadata.isCustomBook) {
      continue;
    }

    if (allowedTypes && chunk.metadata.knowledgeType && !allowedTypes.includes(chunk.metadata.knowledgeType)) {
      continue;
    }

    let score = cosineSimilarity(queryVector, chunk.embedding);

    // Apply priority boost for custom books, blogs, and custom text inputs
    if (preferCustomBook && chunk.metadata.isCustomBook) {
      score += 0.12;
    }

    // High boost for Q&A training pairs if relevant
    if (chunk.metadata.knowledgeType === 'qa_pair') {
      score += 0.18;
    }

    if (score >= minScore) {
      scored.push({
        ...chunk,
        score,
      });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

/**
 * Upsert chunks into the vector store (deduplicated by chunk hash or ID)
 */
export async function upsertChunksToStore(
  chunks: AstrologyChunk[]
): Promise<{ inserted: number; updated: number }> {
  const store = loadStore();
  let inserted = 0;
  let updated = 0;

  const chunkMap = new Map<string, AstrologyChunk>();
  for (const existing of store.chunks) {
    chunkMap.set(existing.id, existing);
  }

  for (const newChunk of chunks) {
    if (chunkMap.has(newChunk.id)) {
      chunkMap.set(newChunk.id, newChunk);
      updated++;
    } else {
      chunkMap.set(newChunk.id, newChunk);
      inserted++;
    }
  }

  store.chunks = Array.from(chunkMap.values());
  saveStore();

  return { inserted, updated };
}

/**
 * Delete all chunks belonging to a document ID
 */
export async function deleteChunksByDocumentId(documentId: string): Promise<number> {
  const store = loadStore();
  const initialCount = store.chunks.length;
  store.chunks = store.chunks.filter((c) => c.documentId !== documentId);
  const deleted = initialCount - store.chunks.length;
  saveStore();
  return deleted;
}

/**
 * Save or update knowledge record
 */
export async function saveRecord(record: KnowledgeRecord): Promise<void> {
  const store = loadStore();
  const existingIndex = store.records.findIndex((b) => b.id === record.id);
  if (existingIndex >= 0) {
    store.records[existingIndex] = record;
  } else {
    store.records.push(record);
  }
  saveStore();
}

/**
 * List all registered books and knowledge items
 */
export async function listRecords(typeFilter?: KnowledgeType): Promise<KnowledgeRecord[]> {
  const store = loadStore();
  let list = [...store.records];
  if (typeFilter) {
    list = list.filter((r) => r.type === typeFilter);
  }
  return list.sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

/**
 * Get single record by ID
 */
export async function getRecord(recordId: string): Promise<KnowledgeRecord | undefined> {
  const store = loadStore();
  return store.records.find((r) => r.id === recordId);
}

/**
 * Delete a knowledge record and all its chunk vectors
 */
export async function deleteRecord(recordId: string): Promise<boolean> {
  const store = loadStore();
  const existing = store.records.find((b) => b.id === recordId);
  if (!existing) return false;

  store.records = store.records.filter((b) => b.id !== recordId);
  store.chunks = store.chunks.filter((c) => c.documentId !== recordId);
  saveStore();
  return true;
}

/**
 * Get total count of indexed chunks
 */
export async function countChunks(): Promise<number> {
  const store = loadStore();
  return store.chunks.length;
}

/**
 * Get all chunks
 */
export async function getAllChunks(): Promise<AstrologyChunk[]> {
  const store = loadStore();
  return store.chunks;
}

/**
 * Knowledge stats breakdown
 */
export async function getVectorStoreStats(): Promise<{
  totalChunks: number;
  totalRecords: number;
  distinctDocuments: number;
  byType: Record<KnowledgeType, number>;
  byCategory: Record<string, number>;
  categories: Record<string, number>;
}> {
  const store = loadStore();
  const byType: Record<KnowledgeType, number> = {
    book: 0,
    blog: 0,
    text: 0,
    qa_pair: 0,
  };
  const byCategory: Record<string, number> = {};

  for (const rec of store.records) {
    if (rec.type && byType[rec.type] !== undefined) {
      byType[rec.type]++;
    } else {
      byType.book++;
    }
  }

  for (const chunk of store.chunks) {
    const cat = chunk.metadata.category || 'general_vedic';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  const distinctDocs = new Set(store.chunks.map((c) => c.documentId)).size;

  return {
    totalChunks: store.chunks.length,
    totalRecords: store.records.length,
    distinctDocuments: distinctDocs,
    byType,
    byCategory,
    categories: byCategory,
  };
}
