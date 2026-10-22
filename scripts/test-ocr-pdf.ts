import * as dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

async function testPdfOcr() {
  const apiKey = process.env.GEMINI_API_KEY;
  // A minimal 1-page valid PDF
  const minimalPdf = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj
4 0 obj <</Length 44>> stream
BT /F1 12 Tf 72 712 Td (Astrology Page 1) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer <</Size 5 /Root 1 0 R>>
startxref
300
%%EOF`;

  const base64Data = Buffer.from(minimalPdf).toString('base64');
  const candidateModels = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
  ];

  for (const model of candidateModels) {
    try {
      console.log(`Testing PDF inlineData on ${model}...`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data,
                  },
                },
                { text: 'Extract all text from this PDF and output with --- PAGE [1] ---' },
              ],
            },
          ],
        }),
      });

      console.log(`  Model ${model} status: ${res.status}`);
      if (!res.ok) {
        console.log('  Error:', (await res.text()).slice(0, 200));
      } else {
        const data = await res.json();
        console.log('  Result:', data.candidates?.[0]?.content?.parts?.[0]?.text);
      }
    } catch (e: any) {
      console.log(`  Exception on ${model}:`, e.message);
    }
  }
}

testPdfOcr();
