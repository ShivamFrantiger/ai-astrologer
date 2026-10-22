/**
 * @fileOverview Astrology Knowledge Retriever
 * High-speed semantic search using persistent Vector Database (`lib/rag/vectorStore.ts`).
 * Zero MongoDB dependency.
 */

import { generateEmbedding } from './embeddings';
import {
  AstrologyCategory,
  AstrologyChunk,
  RetrievalOptions,
  RetrievalResult,
  SourceCitation,
} from './types';
import { searchVectorStore } from './vectorStore';

// Maps frontend chat service topics to knowledge base categories
export function mapTopicToCategories(topic?: string): AstrologyCategory[] {
  if (!topic) return [];
  switch (topic) {
    case 'business_career':
      return ['career_finance', 'bhavas', 'grahas', 'dasha_timing', 'yogas_doshas'];
    case 'marriage':
      return ['marriage_compatibility', 'bhavas', 'grahas', 'dasha_timing', 'yogas_doshas'];
    case 'finance':
      return ['career_finance', 'bhavas', 'grahas', 'yogas_doshas'];
    case 'education':
      return ['bhavas', 'grahas', 'yogas_doshas'];
    case 'health_general':
      return ['remedies_safety', 'bhavas', 'grahas', 'general_vedic'];
    case 'general':
    default:
      return [];
  }
}

export async function retrieveAstrologyKnowledge(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult> {
  const { topK = 4, minScore = 0.45, category, topic, knowledgeType } = options;

  if (!query || !query.trim()) {
    return { chunks: [], citations: [], formattedContext: '', totalFound: 0 };
  }

  // Generate 768-dim query embedding using Gemini REST API
  const queryEmbedding = await generateEmbedding(query);

  // Target categories
  let targetCategories: AstrologyCategory[] | undefined = undefined;
  if (category) {
    targetCategories = Array.isArray(category) ? category : [category];
  } else if (topic) {
    targetCategories = mapTopicToCategories(topic);
  }

  // Execute vector search directly against high-speed in-memory/persistent vector store
  const scoredResults = await searchVectorStore(queryEmbedding, {
    topK,
    minScore,
    category: targetCategories && targetCategories.length > 0 ? targetCategories : undefined,
    preferCustomBook: true,
    knowledgeType,
  });

  // Build citations and formatted context
  const citations: SourceCitation[] = scoredResults.map((item) => {
    const meta = item.metadata;
    const cleanSnippet = item.text
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180) + '...';

    return {
      title: meta.title,
      source: meta.source,
      author: meta.author,
      chapter: meta.chapter,
      section: meta.section,
      page: meta.page,
      category: meta.category,
      score: Number(item.score.toFixed(3)),
      snippet: cleanSnippet,
      isCustomBook: meta.isCustomBook || false,
      knowledgeType: meta.knowledgeType,
    };
  });

  const formattedContext = scoredResults
    .map((item, idx) => {
      const m = item.metadata;
      let citationHeader = '';

      if (m.knowledgeType === 'qa_pair') {
        citationHeader = `[PRIMARY DIRECT INSTRUCTION - TRAINED Q&A RULE #${idx + 1}: "${m.title}"]`;
      } else if (m.knowledgeType === 'blog') {
        citationHeader = `[AUTHORITATIVE BLOG / ARTICLE: "${m.title}" by ${m.author || 'Expert'} | Category: ${m.category}]`;
      } else if (m.knowledgeType === 'text') {
        citationHeader = `[ASTROLOGICAL SUTRA / RULE: "${m.title}" | Category: ${m.category}]`;
      } else if (m.isCustomBook) {
        citationHeader = `[PRIMARY REFERENCE - CUSTOM ASTROLOGY BOOK: "${m.source || m.title}" by ${m.author || 'Author'} | Chapter: "${m.chapter || 'N/A'}" | Page: ${m.page || 'N/A'}]`;
      } else {
        citationHeader = `[Reference #${idx + 1} | Source: "${m.source}" (${m.author || 'Classical Shastra'}) | Chapter/Topic: "${m.chapter || m.title}" | Category: ${m.category}]`;
      }

      return `${citationHeader}\n${item.text.trim()}`;
    })
    .join('\n\n---\n\n');

  return {
    chunks: scoredResults,
    citations,
    formattedContext,
    totalFound: scoredResults.length,
  };
}
