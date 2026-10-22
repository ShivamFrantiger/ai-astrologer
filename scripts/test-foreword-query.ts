import * as dotenv from 'dotenv';
dotenv.config();

import { retrieveAstrologyKnowledge } from '../lib/rag/retriever';

async function test() {
  const query = 'What does the foreword of my book say about the purpose of astrology for humani';
  console.log('Testing query:', query);
  const result = await retrieveAstrologyKnowledge(query, { topK: 5, minScore: 0.30 });
  console.log('\nTotal found:', result.totalFound);
  for (const c of result.citations) {
    console.log(`\nMatch [Score: ${(c.score * 100).toFixed(1)}%] - Page: ${c.page} - Source: ${c.source}`);
    console.log('Snippet:', c.snippet);
  }
}

test();
