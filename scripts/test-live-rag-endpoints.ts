import fetch from 'node-fetch';

async function testEndpoints() {
  const baseUrl = 'http://localhost:3000';
  const query = 'What does the foreword of my book say about the purpose of astrology for human';

  console.log('--- 1. Testing GET /api/admin/books?search=... ---');
  try {
    const res = await fetch(`${baseUrl}/api/admin/books?search=${encodeURIComponent(query)}`, {
      headers: {
        'x-admin-key': 'jyotix-admin-secret',
      },
    });
    console.log('Admin search status:', res.status);
    const data: any = await res.json();
    console.log('Success:', data.success);
    console.log('Total chunks retrieved:', data.result?.citations?.length);
    if (data.result?.citations && data.result.citations.length > 0) {
      console.log('Top match citation:');
      console.log('Source:', data.result.citations[0].source);
      console.log('Page:', data.result.citations[0].page);
      console.log('Score:', (data.result.citations[0].score * 100).toFixed(1) + '%');
      console.log('Snippet preview:', data.result.citations[0].snippet.slice(0, 150) + '...');
    }
  } catch (err: any) {
    console.error('Admin search error:', err.message);
  }

  console.log('\n--- 2. Testing POST /api/chat with foreword query (no birth details / Kundli) ---');
  try {
    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        serviceId: 'chat-with-astrologer',
      }),
    });
    console.log('Chat status:', chatRes.status);
    const chatData: any = await chatRes.json();
    console.log('Chat bubbles:');
    if (chatData.bubbles) {
      chatData.bubbles.forEach((b: string, i: number) => {
        console.log(`[Bubble ${i + 1}]:`, b);
      });
    }
    console.log('Sources returned:', chatData.sources?.length);
  } catch (err: any) {
    console.error('Chat error:', err.message);
  }
}

testEndpoints();
