/**
 * @fileOverview Astrology Knowledge Base Ingestion Script
 * Run with: npx tsx scripts/ingest-knowledge.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { ingestDocument, getKnowledgeStats } from '../lib/rag/ingestion';
import { AstrologyCategory, AstrologyDocumentMeta } from '../lib/rag/types';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge', 'astrology');

// Helper to extract metadata from front-matter or top header comments
function parseMetadata(filePath: string, content: string): AstrologyDocumentMeta {
  const fileName = path.basename(filePath, path.extname(filePath));

  // Extract title
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : fileName.replace(/_/g, ' ');

  // Extract source
  const sourceMatch = content.match(/\*\*Source:\*\*\s*(.+)$/m);
  const source = sourceMatch ? sourceMatch[1].trim() : 'Classical Vedic Shastra';

  // Extract author
  const authorMatch = content.match(/\*\*Author:\*\*\s*(.+)$/m);
  const author = authorMatch ? authorMatch[1].trim() : 'Traditional Vedic Sage';

  // Extract category
  const categoryMatch = content.match(/\*\*Category:\*\*\s*([a-z_]+)/m);
  let category: AstrologyCategory = 'general_vedic';
  if (categoryMatch) {
    category = categoryMatch[1].trim() as AstrologyCategory;
  } else if (fileName.includes('rashi')) {
    category = 'rashis';
  } else if (fileName.includes('bhava')) {
    category = 'bhavas';
  } else if (fileName.includes('graha')) {
    category = 'grahas';
  } else if (fileName.includes('nakshatra')) {
    category = 'nakshatras';
  } else if (fileName.includes('dasha')) {
    category = 'dasha_timing';
  } else if (fileName.includes('yoga')) {
    category = 'yogas_doshas';
  } else if (fileName.includes('marriage')) {
    category = 'marriage_compatibility';
  } else if (fileName.includes('career') || fileName.includes('finance')) {
    category = 'career_finance';
  } else if (fileName.includes('remed')) {
    category = 'remedies_safety';
  }

  return {
    id: fileName,
    title,
    source,
    author,
    category,
    lastUpdated: new Date().toISOString(),
  };
}

async function runIngestion() {
  console.log('🌌 Starting Astrology Knowledge Base Ingestion Pipeline...');
  console.log(`📁 Scanning directory: ${KNOWLEDGE_DIR}`);

  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`Error: Knowledge directory not found at ${KNOWLEDGE_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(KNOWLEDGE_DIR)
    .filter((f) => f.endsWith('.md') || f.endsWith('.txt'))
    .sort();

  if (files.length === 0) {
    console.warn('⚠️ No knowledge documents found to ingest.');
    return;
  }

  console.log(`📚 Found ${files.length} knowledge reference files.`);

  let grandTotalChunks = 0;
  let grandTotalEmbedded = 0;
  let grandTotalSkipped = 0;

  for (const file of files) {
    const fullPath = path.join(KNOWLEDGE_DIR, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const meta = parseMetadata(fullPath, content);

    console.log(`\n📄 Processing: "${meta.title}" [Category: ${meta.category}]`);
    try {
      const result = await ingestDocument(content, meta, {
        maxChunkSize: 800,
        overlap: 150,
      });

      console.log(
        `   ↳ Total Chunks: ${result.totalChunks} | Newly Embedded: ${result.newlyEmbedded} | Skipped (Unchanged): ${result.skipped}`
      );

      grandTotalChunks += result.totalChunks;
      grandTotalEmbedded += result.newlyEmbedded;
      grandTotalSkipped += result.skipped;
    } catch (err: any) {
      console.error(`   ❌ Failed to ingest "${file}":`, err.message);
    }
  }

  console.log('\n======================================================');
  console.log('✨ Ingestion Complete Summary:');
  console.log(`   - Total Chunks Processed: ${grandTotalChunks}`);
  console.log(`   - Newly Embedded (Gemini): ${grandTotalEmbedded}`);
  console.log(`   - Skipped (Already up-to-date): ${grandTotalSkipped}`);

  try {
    const stats = await getKnowledgeStats();
    console.log('\n📊 Database Index Statistics:');
    console.log(`   - Total Stored Chunks: ${stats.totalChunks}`);
    console.log(`   - Distinct Documents: ${stats.distinctDocuments}`);
    console.log('   - Chunks by Category:', JSON.stringify(stats.categories, null, 2));
  } catch (statErr: any) {
    console.warn('Could not fetch final stats:', statErr.message);
  }

  console.log('======================================================');
  process.exit(0);
}

runIngestion().catch((err) => {
  console.error('Fatal ingestion error:', err);
  process.exit(1);
});
