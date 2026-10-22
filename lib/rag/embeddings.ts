/**
 * @fileOverview Gemini Text Embedding Utility
 * Uses Google Gemini's embedding models (`gemini-embedding-001` / `gemini-embedding-2`)
 * with 768 output dimensions via REST API.
 */

const CANDIDATE_MODELS = ['gemini-embedding-001', 'gemini-embedding-2', 'text-embedding-004'];
const EMBEDDING_DIMENSION = 768;

export { EMBEDDING_DIMENSION };

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const cleanText = text.trim().slice(0, 8000);
  if (!cleanText) {
    return new Array(EMBEDDING_DIMENSION).fill(0);
  }

  let lastError: Error | null = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${model}`,
          content: {
            parts: [{ text: cleanText }],
          },
          outputDimensionality: EMBEDDING_DIMENSION,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        lastError = new Error(`Model ${model} error (${res.status}): ${errText}`);
        continue;
      }

      const data = await res.json();
      const values = data.embedding?.values;
      if (Array.isArray(values) && values.length > 0) {
        return values;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('All candidate embedding models failed.');
}

export async function generateBatchEmbeddings(
  texts: string[],
  batchSize = 20
): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }

  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    let batchSuccess = false;

    for (const model of CANDIDATE_MODELS) {
      try {
        const requests = batch.map((t) => ({
          model: `models/${model}`,
          content: {
            parts: [{ text: t.trim().slice(0, 8000) }],
          },
          outputDimensionality: EMBEDDING_DIMENSION,
        }));

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${apiKey}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests }),
        });

        if (res.ok) {
          const data = await res.json();
          const embeddings = data.embeddings || [];
          if (embeddings.length === batch.length) {
            for (const item of embeddings) {
              results.push(item.values || new Array(EMBEDDING_DIMENSION).fill(0));
            }
            batchSuccess = true;
            break;
          }
        }
      } catch (e) {
        // try next candidate
      }
    }

    if (!batchSuccess) {
      // Fallback: sequential single embedding generation for this batch
      for (const text of batch) {
        const emb = await generateEmbedding(text);
        results.push(emb);
      }
    }

    // Small delay to prevent API rate limits
    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  return results;
}

/**
 * Computes cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}
