import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
  ];

  console.log('Testing models for text and PDF generation...');
  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hello, respond with OK' }] }],
        }),
      });

      console.log(`Model [${model}]: status ${res.status}`);
      if (!res.ok) {
        const err = await res.text();
        console.log(`  -> Error: ${err.slice(0, 150)}`);
      } else {
        const data = await res.json();
        console.log(`  -> Response:`, data.candidates?.[0]?.content?.parts?.[0]?.text?.trim());
      }
    } catch (e: any) {
      console.log(`Model [${model}] exception:`, e.message);
    }
  }
}

test();
