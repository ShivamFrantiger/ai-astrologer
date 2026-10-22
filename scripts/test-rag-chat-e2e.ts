/**
 * @fileOverview End-to-end test for Custom Astrology Book Integration and RAG Chat
 * Run with: npx tsx scripts/test-rag-chat-e2e.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { extractFromTextOrMarkdown } from '../lib/rag/bookExtractor';
import { ingestCustomBook, listCustomBooks, deleteCustomBook } from '../lib/rag/ingestion';
import { retrieveAstrologyKnowledge } from '../lib/rag/retriever';
import { AstrologyDocumentMeta } from '../lib/rag/types';

async function runTest() {
  console.log('🧪 Starting End-to-End Test for Custom Astrology Book Integration & RAG...\n');

  // Step 1: Create sample custom astrology book content
  const sampleBookText = `--- Page 1 ---
# Chapter 1: The Modern Vedic Career Guide
In this manual, we explore 21st-century vocations and their planetary signatures.
When Rahu is situated in the 10th house from the Lagna in an airy or fiery sign, the native thrives exceptionally in modern technology, artificial intelligence, software architecture, and international remote enterprises.
Such natives experience rapid non-linear promotion around the age of 30 to 33.

--- Page 2 ---
# Chapter 2: Timing Marriage in Difficult Placements
For natives with Saturn or Mars aspecting the 7th house, marriage is delayed until after age 28. 
However, this delay is highly protective: it ensures emotional maturity and karmic stabilization.
The most favorable window occurs when Jupiter enters trine to the 7th house or natal Venus, initiating deep harmonious bonds.
`;

  console.log('1️⃣ Extracting book structure and pages...');
  const extracted = extractFromTextOrMarkdown(sampleBookText, {
    title: 'Modern Vedic Astrology Guide',
    author: 'Acharya Sharma',
    fileType: 'md',
  });

  console.log(`   ↳ Extracted Pages: ${extracted.totalPages}`);
  extracted.pages.forEach((p) => {
    console.log(`     • Page ${p.pageNumber}: "${p.chapter}" (${p.text.length} chars)`);
  });

  // Step 2: Ingest the custom book
  console.log('\n2️⃣ Ingesting custom book into MongoDB with Gemini embeddings...');
  const meta: AstrologyDocumentMeta = {
    id: 'test_book_modern_vedic_guide',
    title: 'Modern Vedic Astrology Guide',
    source: 'Modern Vedic Astrology Guide',
    author: 'Acharya Sharma',
    category: 'career_finance',
    isCustomBook: true,
    fileType: 'md',
    fileName: 'modern_vedic_guide.md',
    lastUpdated: new Date().toISOString(),
  };

  const ingestRes = await ingestCustomBook(extracted, meta);
  console.log('   ↳ Ingestion result:', ingestRes);

  // Step 3: Verify book listing in registry
  console.log('\n3️⃣ Verifying book registry in MongoDB...');
  const books = await listCustomBooks();
  console.log(`   ↳ Total registered custom books: ${books.length}`);
  const found = books.find((b) => b.id === meta.id);
  console.log('   ↳ Found custom book in registry:', found?.title, `(Pages: ${found?.totalPages}, Chunks: ${found?.totalChunks})`);

  // Step 4: Test semantic retrieval targeting the custom book
  console.log('\n4️⃣ Testing RAG retrieval for question: "What does the book say about 10th house Rahu and technology career?"...');
  const query = 'What does the book say about 10th house Rahu and technology career?';
  const retrieval = await retrieveAstrologyKnowledge(query, {
    topic: 'business_career',
    topK: 3,
  });

  console.log(`   ↳ Retrieved ${retrieval.totalFound} passages.`);
  retrieval.citations.forEach((c, idx) => {
    console.log(`\n   [Citation #${idx + 1}]`);
    console.log(`   • Title: "${c.title}"`);
    console.log(`   • Source: "${c.source}" (Author: ${c.author})`);
    console.log(`   • Page: ${c.page} | Chapter: "${c.chapter}"`);
    console.log(`   • Custom Book: ${c.isCustomBook ? 'YES' : 'NO'}`);
    console.log(`   • Relevance Score: ${(c.score * 100).toFixed(1)}%`);
    console.log(`   • Snippet: "${c.snippet}"`);
  });

  // Step 5: Test calling /api/chat logic with retrieved context
  console.log('\n5️⃣ Formatted context passed to Gemini:');
  console.log('--------------------------------------------------');
  console.log(retrieval.formattedContext.slice(0, 400) + '...\n');
  console.log('--------------------------------------------------');

  console.log('✅ End-to-end workflow verification complete! Cleaning up test book...');
  const delRes = await deleteCustomBook(meta.id);
  console.log(`   ↳ Cleanup: deleted ${delRes.deletedChunks} chunks, book deleted: ${delRes.bookDeleted}`);

  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
