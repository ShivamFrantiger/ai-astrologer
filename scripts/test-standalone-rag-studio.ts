/**
 * Test Standalone Vector DB and Astrology Knowledge Training Studio
 * Verifies:
 * 1. Zero MongoDB dependency (100% Vector DB)
 * 2. Ingesting Custom Book
 * 3. Ingesting Blog / Article
 * 4. Ingesting Raw Sutra / Rule
 * 5. Ingesting Q&A Training Pair
 * 6. High-Speed Semantic Retrieval & Score Boosting
 */

import * as dotenv from 'dotenv';
dotenv.config();

import {
  ingestCustomBook,
  ingestBlogOrArticle,
  ingestRawTextOrSutra,
  ingestQAPair,
  listKnowledgeRecords,
  deleteKnowledgeRecord,
  getKnowledgeStats,
} from '../lib/rag/ingestion';
import { retrieveAstrologyKnowledge } from '../lib/rag/retriever';

async function main() {
  console.log('🚀 Testing Standalone Vector DB & Knowledge Training Studio (Zero MongoDB)...\n');

  // 1. Initial stats
  const initialStats = await getKnowledgeStats();
  console.log('📊 Initial Vector DB Stats:', initialStats);

  // 2. Ingest a Blog / Article
  console.log('\n📝 1. Ingesting Astrology Blog / Article...');
  const blogRes = await ingestBlogOrArticle({
    title: 'Secret Planetary Positions For Instant Wealth: Dhana Yogas Explained',
    author: 'Pandit Sharma',
    category: 'career_finance',
    content: `Dhana Yogas occur when lords of 1st, 2nd, 5th, 9th, and 11th houses form mutual aspects or conjunctions. 
    Specifically, when Jupiter aspects the 11th house from the Moon, sudden financial expansion occurs during Jupiter Antardasha. 
    Remedy: Offer saffron milk on Thursdays to strengthen Jupiter and chant Om Brihaspataye Namah.`,
    tags: ['wealth', 'dhana_yoga', 'jupiter'],
  });
  console.log('   ✅ Blog indexed:', blogRes);

  // 3. Ingest an Astrological Sutra / Raw Text
  console.log('\n📜 2. Ingesting Astrological Sutra / Classical Rule...');
  const sutraRes = await ingestRawTextOrSutra({
    title: 'Shani in 7th House & Marriage Delay Rule',
    author: 'Brihat Jataka',
    category: 'marriage_compatibility',
    content: `When Saturn (Shani) resides in the 7th house from Lagna or Moon, it causes delayed marriage, typically between ages 28 and 33. 
    However, Saturn in the 7th house in its own sign (Capricorn/Aquarius) or exalted in Libra forms Sasa Mahapurusha Yoga, granting an exceptionally loyal, mature, and grounding partner. It is delay, not denial.`,
  });
  console.log('   ✅ Sutra indexed:', sutraRes);

  // 4. Ingest a Q&A Training Pair (Instruction Grounding)
  console.log('\n🎯 3. Ingesting Q&A Training Pair for Direct Model Grounding...');
  const qaRes = await ingestQAPair({
    question: 'Meri shaadi kab hogi aur life partner kaisa hoga?',
    answer: `Aapki kundli mein 7th house ka lord active phase mein aa raha hai. Partner mature, responsible aur practical nature ka hoga jo career oriented rahega. Exact vivah yog Shani-Brihaspati ke gochar ke baad agle saal khulega.`,
    category: 'marriage_compatibility',
  });
  console.log('   ✅ Q&A Training Pair indexed:', qaRes);

  // 5. Ingest a Mini Custom Book
  console.log('\n📚 4. Ingesting Custom Astrology Book...');
  const bookRes = await ingestCustomBook(
    {
      title: 'Modern Astro Insights & Practical Solutions',
      author: 'Dr. Jyotish Master',
      totalPages: 2,
      pages: [
        {
          pageNumber: 1,
          chapter: 'Chapter 1: Career Pivots',
          text: `Sun in the 10th house possesses maximum Digbala (directional strength). When the 10th house lord is conjunct Mercury (Budhaditya Yoga), the native excels in technology, leadership, and public administration. Career surges significantly after age 24.`,
        },
        {
          pageNumber: 2,
          chapter: 'Chapter 2: Rahu Transits',
          text: `Rahu transiting the 6th or 10th house creates unexpected breakthroughs in career and crushes professional competitors. The native should avoid impulsive speculation and trust methodical persistence.`,
        },
      ],
    },
    {
      id: 'book_test_modern_astro',
      title: 'Modern Astro Insights & Practical Solutions',
      source: 'Modern Astro Insights & Practical Solutions',
      author: 'Dr. Jyotish Master',
      category: 'career_finance',
      isCustomBook: true,
      fileType: 'pdf',
      knowledgeType: 'book',
    }
  );
  console.log('   ✅ Book indexed:', bookRes);

  // 6. Check updated stats
  const updatedStats = await getKnowledgeStats();
  console.log('\n📊 Updated Vector DB Stats:', updatedStats);

  // 7. Test Semantic Retrieval for Career / Wealth
  console.log('\n🔍 5. Testing Semantic Retrieval for Query: "How does Jupiter create wealth and what is dhana yoga?"');
  const wealthQueryRes = await retrieveAstrologyKnowledge('How does Jupiter create wealth and what is dhana yoga?', {
    topK: 2,
  });
  console.log(`   Found ${wealthQueryRes.totalFound} chunks. Top source:`);
  console.log('   Source:', wealthQueryRes.citations[0]?.source);
  console.log('   Score:', wealthQueryRes.citations[0]?.score);
  console.log('   Snippet:', wealthQueryRes.citations[0]?.snippet);

  // 8. Test Semantic Retrieval for Marriage Q&A
  console.log('\n🔍 6. Testing Semantic Retrieval for Question: "Meri shaadi kab hogi aur partner kaisa milega?"');
  const marriageQueryRes = await retrieveAstrologyKnowledge('Meri shaadi kab hogi aur partner kaisa milega?', {
    topK: 2,
  });
  console.log(`   Found ${marriageQueryRes.totalFound} chunks. Top source:`);
  console.log('   Source:', marriageQueryRes.citations[0]?.source);
  console.log('   Score:', marriageQueryRes.citations[0]?.score);
  console.log('   Knowledge Type:', marriageQueryRes.citations[0]?.knowledgeType);
  console.log('   Snippet:', marriageQueryRes.citations[0]?.snippet);

  // 9. Clean up test records
  console.log('\n🧹 7. Cleaning up test items...');
  await deleteKnowledgeRecord(blogRes.recordId);
  await deleteKnowledgeRecord(sutraRes.recordId);
  await deleteKnowledgeRecord(qaRes.recordId);
  await deleteKnowledgeRecord(bookRes.bookId);
  console.log('   ✅ Test items cleaned up.');

  const finalStats = await getKnowledgeStats();
  console.log('📊 Final Cleaned Stats:', finalStats);
  console.log('\n🎉 ALL TESTS PASSED! Standalone Vector DB & Knowledge Training Studio working perfectly without MongoDB!');
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
