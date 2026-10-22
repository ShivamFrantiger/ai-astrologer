/**
 * @fileOverview Astrology Knowledge Ingestion Pipeline
 * Operates 100% standalone with persistent Vector DB (lib/rag/vectorStore.ts).
 * Zero MongoDB dependency.
 *
 * Supports:
 * 1. Astrology Books (PDF with OCR, Markdown, TXT)
 * 2. Astrology Blogs & Articles
 * 3. Astrological Sutras & Raw Text
 * 4. Q&A Training Pairs (for exact model grounding)
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generateBatchEmbeddings, generateEmbedding } from './embeddings';
import {
  AstrologyCategory,
  AstrologyChunk,
  AstrologyDocumentMeta,
  KnowledgeRecord,
  KnowledgeType,
} from './types';
import {
  upsertChunksToStore,
  saveRecord,
  listRecords,
  deleteRecord,
  countChunks,
  getVectorStoreStats,
} from './vectorStore';

export interface ChunkOptions {
  maxChunkSize?: number; // Characters per chunk (default 850)
  overlap?: number; // Character overlap (default 150)
}

/**
 * Computes a SHA-256 hash for deduplication.
 */
export function computeHash(content: string): string {
  return crypto.createHash('sha256').update(content.trim()).digest('hex');
}

/**
 * Splits document text into overlapping chunks, respecting paragraphs and structural headings.
 */
export function chunkDocument(
  text: string,
  meta: AstrologyDocumentMeta,
  options: ChunkOptions = {}
): Omit<AstrologyChunk, 'embedding' | 'createdAt' | 'updatedAt'>[] {
  const { maxChunkSize = 850, overlap = 150 } = options;

  // Normalize line breaks
  const cleaned = text.replace(/\r\n/g, '\n').trim();

  // Split by double newline (paragraphs / sections)
  const paragraphs = cleaned.split(/\n\s*\n/);
  const rawChunks: string[] = [];

  let currentChunk = '';
  let activeHeading = meta.chapter || meta.title;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect markdown headings to maintain context
    if (trimmed.startsWith('#')) {
      activeHeading = trimmed.replace(/^#+\s*/, '').trim();
    }

    if (currentChunk.length + trimmed.length <= maxChunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
    } else {
      if (currentChunk) {
        rawChunks.push(currentChunk);
        // Retain overlap from end of previous chunk
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = `${overlapText}\n\n${trimmed}`;
      } else {
        // Paragraph itself exceeds maxChunkSize: split by sentence
        const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed];
        let subChunk = '';
        for (const s of sentences) {
          if (subChunk.length + s.length <= maxChunkSize) {
            subChunk = subChunk ? `${subChunk} ${s.trim()}` : s.trim();
          } else {
            if (subChunk) rawChunks.push(subChunk);
            subChunk = s.trim();
          }
        }
        if (subChunk) {
          currentChunk = subChunk;
        }
      }
    }
  }

  if (currentChunk.trim()) {
    rawChunks.push(currentChunk.trim());
  }

  // Create chunk objects with metadata
  return rawChunks.map((chunkText, idx) => {
    const chunkMeta: AstrologyDocumentMeta = {
      ...meta,
      section: activeHeading,
    };
    const hash = computeHash(`${meta.id}:${idx}:${chunkText}`);

    return {
      id: `${meta.id}_chunk_${idx}`,
      documentId: meta.id,
      chunkIndex: idx,
      text: chunkText,
      metadata: chunkMeta,
      hash,
    };
  });
}

/**
 * Ingests a generic document into the standalone vector store.
 */
export async function ingestDocument(
  text: string,
  meta: AstrologyDocumentMeta,
  options: ChunkOptions = {}
): Promise<{ totalChunks: number; newlyEmbedded: number; skipped: number }> {
  const rawChunks = chunkDocument(text, meta, options);
  if (rawChunks.length === 0) {
    return { totalChunks: 0, newlyEmbedded: 0, skipped: 0 };
  }

  const texts = rawChunks.map((c) => c.text);
  const embeddings = await generateBatchEmbeddings(texts);
  const now = new Date().toISOString();

  const chunks: AstrologyChunk[] = rawChunks.map((chunk, idx) => ({
    ...chunk,
    embedding: embeddings[idx],
    createdAt: now,
    updatedAt: now,
  }));

  const res = await upsertChunksToStore(chunks);

  return {
    totalChunks: rawChunks.length,
    newlyEmbedded: res.inserted + res.updated,
    skipped: 0,
  };
}

/**
 * Ingests a custom astrology book with page-by-page chunking, deduplication, and registry tracking.
 */
export async function ingestCustomBook(
  extracted: {
    title: string;
    author?: string;
    totalPages: number;
    pages: Array<{ pageNumber: number; text: string; chapter?: string }>;
    isScanned?: boolean;
  },
  meta: AstrologyDocumentMeta,
  options: ChunkOptions = {}
): Promise<{ totalChunks: number; newlyEmbedded: number; skipped: number; bookId: string }> {
  const { maxChunkSize = 850, overlap = 150 } = options;
  const rawChunks: Omit<AstrologyChunk, 'embedding' | 'createdAt' | 'updatedAt'>[] = [];

  let globalChunkIndex = 0;

  for (const page of extracted.pages) {
    const pageText = page.text.trim();
    if (!pageText) continue;

    const pageMeta: AstrologyDocumentMeta = {
      ...meta,
      page: page.pageNumber,
      chapter: page.chapter || meta.chapter,
      isCustomBook: true,
      knowledgeType: 'book',
      source: meta.source || extracted.title,
      author: meta.author || extracted.author,
    };

    if (pageText.length <= maxChunkSize) {
      const hash = computeHash(`${meta.id}:p${page.pageNumber}:${globalChunkIndex}:${pageText}`);
      rawChunks.push({
        id: `${meta.id}_p${page.pageNumber}_c${globalChunkIndex}`,
        documentId: meta.id,
        chunkIndex: globalChunkIndex++,
        text: pageText,
        metadata: pageMeta,
        hash,
      });
    } else {
      const paragraphs = pageText.split(/\n\s*\n/);
      let currentChunk = '';

      for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;

        if (currentChunk.length + trimmed.length <= maxChunkSize) {
          currentChunk = currentChunk ? `${currentChunk}\n\n${trimmed}` : trimmed;
        } else {
          if (currentChunk) {
            const hash = computeHash(`${meta.id}:p${page.pageNumber}:${globalChunkIndex}:${currentChunk}`);
            rawChunks.push({
              id: `${meta.id}_p${page.pageNumber}_c${globalChunkIndex}`,
              documentId: meta.id,
              chunkIndex: globalChunkIndex++,
              text: currentChunk,
              metadata: pageMeta,
              hash,
            });
            const overlapText = currentChunk.slice(-overlap);
            currentChunk = `${overlapText}\n\n${trimmed}`;
          } else {
            currentChunk = trimmed;
          }
        }
      }

      if (currentChunk.trim()) {
        const hash = computeHash(`${meta.id}:p${page.pageNumber}:${globalChunkIndex}:${currentChunk}`);
        rawChunks.push({
          id: `${meta.id}_p${page.pageNumber}_c${globalChunkIndex}`,
          documentId: meta.id,
          chunkIndex: globalChunkIndex++,
          text: currentChunk.trim(),
          metadata: pageMeta,
          hash,
        });
      }
    }
  }

  let newlyEmbedded = 0;
  if (rawChunks.length > 0) {
    const texts = rawChunks.map((c) => c.text);
    const embeddings = await generateBatchEmbeddings(texts);
    const now = new Date().toISOString();

    const fullChunks: AstrologyChunk[] = rawChunks.map((chunk, idx) => ({
      ...chunk,
      embedding: embeddings[idx],
      createdAt: now,
      updatedAt: now,
    }));

    const res = await upsertChunksToStore(fullChunks);
    newlyEmbedded = res.inserted + res.updated;
  }

  // Save Book Record in Vector Store
  const now = new Date().toISOString();
  const record: KnowledgeRecord = {
    id: meta.id,
    type: 'book',
    title: meta.title,
    author: meta.author || 'Author',
    category: meta.category,
    fileName: meta.fileName || `${meta.id}.pdf`,
    fileType: meta.fileType || 'pdf',
    totalPages: extracted.totalPages,
    totalChunks: rawChunks.length,
    isScanned: extracted.isScanned || false,
    summarySnippet: rawChunks[0]?.text.slice(0, 200) || '',
    uploadedAt: now,
    updatedAt: now,
  };

  await saveRecord(record);

  return {
    totalChunks: rawChunks.length,
    newlyEmbedded,
    skipped: 0,
    bookId: meta.id,
  };
}

/**
 * Ingests an Astrology Blog or Article into the Vector Store.
 */
export async function ingestBlogOrArticle(params: {
  title: string;
  content: string;
  author?: string;
  category?: AstrologyCategory;
  tags?: string[];
  sourceUrl?: string;
}): Promise<{ recordId: string; totalChunks: number; newlyEmbedded: number }> {
  const {
    title,
    content,
    author = 'Astrology Expert',
    category = 'general_vedic',
    tags = [],
    sourceUrl,
  } = params;

  const docId = 'blog_' + title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 35) + '_' + Date.now().toString(36);

  const meta: AstrologyDocumentMeta = {
    id: docId,
    title,
    source: sourceUrl ? `Blog (${sourceUrl})` : `Article: ${title}`,
    author,
    category,
    isCustomBook: true,
    knowledgeType: 'blog',
    tags,
    lastUpdated: new Date().toISOString(),
  };

  const rawChunks = chunkDocument(content, meta, { maxChunkSize: 850, overlap: 150 });
  if (rawChunks.length === 0) {
    throw new Error('Article content is empty.');
  }

  const texts = rawChunks.map((c) => c.text);
  const embeddings = await generateBatchEmbeddings(texts);
  const now = new Date().toISOString();

  const fullChunks: AstrologyChunk[] = rawChunks.map((chunk, idx) => ({
    ...chunk,
    embedding: embeddings[idx],
    createdAt: now,
    updatedAt: now,
  }));

  const res = await upsertChunksToStore(fullChunks);

  const record: KnowledgeRecord = {
    id: docId,
    type: 'blog',
    title,
    author,
    category,
    fileType: 'md',
    totalChunks: rawChunks.length,
    tags,
    summarySnippet: content.slice(0, 200).replace(/\s+/g, ' ').trim(),
    uploadedAt: now,
    updatedAt: now,
  };

  await saveRecord(record);

  return {
    recordId: docId,
    totalChunks: rawChunks.length,
    newlyEmbedded: res.inserted + res.updated,
  };
}

/**
 * Ingests Raw Astrological Text / Sutras / Rules directly into the Vector Store.
 */
export async function ingestRawTextOrSutra(params: {
  title: string;
  content: string;
  author?: string;
  category?: AstrologyCategory;
  tags?: string[];
}): Promise<{ recordId: string; totalChunks: number; newlyEmbedded: number }> {
  const {
    title,
    content,
    author = 'Classical Vedic Shastra',
    category = 'general_vedic',
    tags = [],
  } = params;

  const docId = 'text_' + title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 35) + '_' + Date.now().toString(36);

  const meta: AstrologyDocumentMeta = {
    id: docId,
    title,
    source: `Sutra / Rule: ${title}`,
    author,
    category,
    isCustomBook: true,
    knowledgeType: 'text',
    tags,
    lastUpdated: new Date().toISOString(),
  };

  const rawChunks = chunkDocument(content, meta, { maxChunkSize: 750, overlap: 120 });
  if (rawChunks.length === 0) {
    throw new Error('Text content is empty.');
  }

  const texts = rawChunks.map((c) => c.text);
  const embeddings = await generateBatchEmbeddings(texts);
  const now = new Date().toISOString();

  const fullChunks: AstrologyChunk[] = rawChunks.map((chunk, idx) => ({
    ...chunk,
    embedding: embeddings[idx],
    createdAt: now,
    updatedAt: now,
  }));

  const res = await upsertChunksToStore(fullChunks);

  const record: KnowledgeRecord = {
    id: docId,
    type: 'text',
    title,
    author,
    category,
    fileType: 'txt',
    totalChunks: rawChunks.length,
    tags,
    summarySnippet: content.slice(0, 200).replace(/\s+/g, ' ').trim(),
    uploadedAt: now,
    updatedAt: now,
  };

  await saveRecord(record);

  return {
    recordId: docId,
    totalChunks: rawChunks.length,
    newlyEmbedded: res.inserted + res.updated,
  };
}

/**
 * Ingests a Q&A Training Pair to directly ground Gemini's answers to specific user questions.
 */
export async function ingestQAPair(params: {
  question: string;
  answer: string;
  category?: AstrologyCategory;
  tags?: string[];
}): Promise<{ recordId: string; totalChunks: number }> {
  const {
    question,
    answer,
    category = 'general_vedic',
    tags = [],
  } = params;

  const cleanQ = question.trim();
  const cleanA = answer.trim();

  if (!cleanQ || !cleanA) {
    throw new Error('Both Question and Answer are required for Q&A training pair.');
  }

  const docId = 'qa_' + cleanQ.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 35) + '_' + Date.now().toString(36);

  const meta: AstrologyDocumentMeta = {
    id: docId,
    title: `Q&A: ${cleanQ.slice(0, 60)}...`,
    source: 'Authoritative Astrological Q&A Training',
    author: 'Chief Astrologer',
    category,
    isCustomBook: true,
    knowledgeType: 'qa_pair',
    question: cleanQ,
    answer: cleanA,
    tags,
    lastUpdated: new Date().toISOString(),
  };

  // The text chunk includes question and answer for high-fidelity retrieval
  const chunkContent = `[ASTROLOGICAL INSTRUCTION & ANSWER PAIR]\nQUESTION / TOPIC:\n${cleanQ}\n\nAUTHORITATIVE ASTROLOGICAL ANSWER / RULE:\n${cleanA}`;

  // Generate embedding for the question + answer pair
  const embedding = await generateEmbedding(`${cleanQ}\n${cleanA}`);
  const now = new Date().toISOString();

  const chunk: AstrologyChunk = {
    id: `${docId}_c0`,
    documentId: docId,
    chunkIndex: 0,
    text: chunkContent,
    embedding,
    metadata: meta,
    hash: computeHash(`${docId}:${cleanQ}:${cleanA}`),
    createdAt: now,
    updatedAt: now,
  };

  await upsertChunksToStore([chunk]);

  const record: KnowledgeRecord = {
    id: docId,
    type: 'qa_pair',
    title: cleanQ.length > 70 ? cleanQ.slice(0, 67) + '...' : cleanQ,
    author: 'Astrology Trainer',
    category,
    fileType: 'json',
    totalChunks: 1,
    question: cleanQ,
    tags,
    summarySnippet: cleanA.slice(0, 180) + '...',
    uploadedAt: now,
    updatedAt: now,
  };

  await saveRecord(record);

  return {
    recordId: docId,
    totalChunks: 1,
  };
}

/**
 * Lists all registered knowledge items (books, blogs, texts, Q&A pairs).
 */
export async function listKnowledgeRecords(typeFilter?: KnowledgeType): Promise<KnowledgeRecord[]> {
  return listRecords(typeFilter);
}

// Backwards compatibility alias
export const listCustomBooks = async () => listRecords('book');

/**
 * Deletes a knowledge record and all its associated vector chunks.
 */
export async function deleteKnowledgeRecord(recordId: string): Promise<{ deletedChunks: number; success: boolean }> {
  const success = await deleteRecord(recordId);
  return {
    deletedChunks: success ? 1 : 0,
    success,
  };
}

// Backwards compatibility alias
export const deleteCustomBook = async (bookId: string) => {
  const res = await deleteKnowledgeRecord(bookId);
  return {
    deletedChunks: res.deletedChunks,
    bookDeleted: res.success,
  };
};

export const deleteDocument = async (documentId: string): Promise<number> => {
  const res = await deleteKnowledgeRecord(documentId);
  return res.deletedChunks;
};

/**
 * Retrieves knowledge base stats.
 */
export async function getKnowledgeStats() {
  return getVectorStoreStats();
}

/**
 * Seeds baseline Vedic astrology knowledge from local Markdown files if vector store is empty.
 */
export async function seedBaselineKnowledge(): Promise<{ seededFiles: number; totalChunks: number }> {
  const currentCount = await countChunks();
  if (currentCount > 0) {
    return { seededFiles: 0, totalChunks: currentCount };
  }

  const knowledgeDir = path.join(process.cwd(), 'knowledge', 'astrology');
  if (!fs.existsSync(knowledgeDir)) {
    return { seededFiles: 0, totalChunks: 0 };
  }

  const files = fs.readdirSync(knowledgeDir).filter((f) => f.endsWith('.md'));
  let seededFiles = 0;
  let totalChunks = 0;

  for (const file of files) {
    try {
      const filePath = path.join(knowledgeDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const title = file.replace(/^\d+_/, '').replace(/\.md$/, '').replace(/_/g, ' ');

      let category: AstrologyCategory = 'general_vedic';
      if (file.includes('rashi')) category = 'rashis';
      else if (file.includes('bhava')) category = 'bhavas';
      else if (file.includes('graha')) category = 'grahas';
      else if (file.includes('nakshatra')) category = 'nakshatras';
      else if (file.includes('dasha')) category = 'dasha_timing';
      else if (file.includes('yoga')) category = 'yogas_doshas';
      else if (file.includes('marriage')) category = 'marriage_compatibility';
      else if (file.includes('career')) category = 'career_finance';
      else if (file.includes('remed')) category = 'remedies_safety';

      const docId = 'baseline_' + file.replace(/\.md$/, '');
      const meta: AstrologyDocumentMeta = {
        id: docId,
        title: title.charAt(0).toUpperCase() + title.slice(1),
        source: 'Classical Vedic Astrology Foundations',
        author: 'Sage Parashara & Classical Shastra',
        category,
        isCustomBook: false,
        knowledgeType: 'text',
        fileName: file,
        fileType: 'md',
        lastUpdated: new Date().toISOString(),
      };

      const result = await ingestDocument(content, meta, { maxChunkSize: 850, overlap: 150 });
      totalChunks += result.totalChunks;
      seededFiles++;

      await saveRecord({
        id: docId,
        type: 'text',
        title: meta.title,
        author: meta.author,
        category,
        fileName: file,
        fileType: 'md',
        totalChunks: result.totalChunks,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`Failed to seed ${file}:`, err);
    }
  }

  return { seededFiles, totalChunks };
}
