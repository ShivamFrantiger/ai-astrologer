import * as dotenv from 'dotenv';
dotenv.config();

import { seedBaselineKnowledge, getKnowledgeStats } from '../lib/rag/ingestion';

async function main() {
  console.log('🌟 Seeding Classical Vedic Astrology Baseline into Persistent Vector DB...\n');
  const res = await seedBaselineKnowledge();
  console.log('Result:', res);

  const stats = await getKnowledgeStats();
  console.log('\n📊 Updated Vector DB Stats:');
  console.log(`   - Total Stored Chunks: ${stats.totalChunks}`);
  console.log(`   - Total Records: ${stats.totalRecords}`);
  console.log('   - Records by Type:', stats.byType);
  console.log('   - Chunks by Category:', stats.categories);
  console.log('\n✨ Seeding Complete!');
}

main().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
