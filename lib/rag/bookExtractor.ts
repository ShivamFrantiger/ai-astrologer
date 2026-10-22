/**
 * @fileOverview Astrology Book Extractor
 * Extracts text and metadata (chapter, page numbers) from PDF, Markdown, and TXT files.
 * Includes automatic detection of scanned PDFs and native Gemini Multimodal OCR fallback.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { PDFParse } from 'pdf-parse';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  chapter?: string;
}

export interface ExtractedBook {
  title: string;
  author?: string;
  totalPages: number;
  pages: ExtractedPage[];
  isScanned: boolean;
  rawText: string;
}

/**
 * Detects whether a chapter heading exists in a text block.
 */
function detectChapterTitle(text: string): string | undefined {
  const chapterRegexes = [
    /(?:chapter|adhyaya|khanda|section)\s+([0-9ivxlcdm]+[:\s\-\–]+[^\n\r.]+)/i,
    /^#+\s*(.+)$/m,
    /(?:chapter|adhyaya)\s+([0-9ivxlcdm]+)/i,
  ];

  for (const reg of chapterRegexes) {
    const match = text.match(reg);
    if (match && match[1]) {
      return match[1].trim().slice(0, 80);
    }
  }
  return undefined;
}

/**
 * Performs OCR on scanned PDFs using Gemini Multimodal Vision API.
 */
async function performGeminiOcr(pdfBuffer: Buffer): Promise<ExtractedPage[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for OCR on scanned PDFs.');
  }

  const base64Data = pdfBuffer.toString('base64');
  const candidateModels = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
  ];
  let lastError: Error | null = null;

  const prompt = `You are an expert document OCR and transcription assistant.
Analyze this scanned astrology book document.
Extract ALL text accurately. 
Format your output strictly using page separators like:
--- PAGE [1] ---
[Extracted text of page 1]
--- PAGE [2] ---
[Extracted text of page 2]

Preserve chapter titles, section headers, Sanskrit shlokas/terms, and astrological explanations without modifying content.`;

  for (const model of candidateModels) {
    try {
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
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 65536,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn(`OCR candidate ${model} returned ${res.status}: ${err.slice(0, 100)}. Trying next...`);
        lastError = new Error(`OCR model ${model} error (${res.status}): ${err}`);
        continue;
      }

      const data = await res.json();
      const transcription = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (transcription) {
        // Parse page markers
        const pageSplits = transcription.split(/---\s*PAGE\s*\[?(\d+)\]?\s*---/i);
        const pages: ExtractedPage[] = [];

        if (pageSplits.length > 1) {
          for (let i = 1; i < pageSplits.length; i += 2) {
            const pageNum = parseInt(pageSplits[i], 10) || Math.floor(i / 2) + 1;
            const text = (pageSplits[i + 1] || '').trim();
            if (text) {
              const chapter = detectChapterTitle(text);
              pages.push({ pageNumber: pageNum, text, chapter });
            }
          }
        } else {
          pages.push({
            pageNumber: 1,
            text: transcription.trim(),
            chapter: detectChapterTitle(transcription),
          });
        }

        if (pages.length > 0) {
          return pages;
        }
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('OCR extraction failed for scanned PDF.');
}

/**
 * Extracts pages and metadata from a digital or scanned PDF.
 */
export async function extractFromPdf(
  buffer: Buffer,
  meta: { title?: string; author?: string } = {}
): Promise<ExtractedBook> {
  const pages: ExtractedPage[] = [];
  let isScanned = false;
  let rawAllText = '';

  try {
    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    const numPages = parsed.total || (parsed.pages ? parsed.pages.length : 1);
    rawAllText = parsed.text || (parsed.pages ? parsed.pages.map((p: any) => p.text).join('\n') : '');

    // Extract all text pages parsed from PDF
    if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
      let activeChapter = meta.title || 'Introduction';
      for (let i = 0; i < parsed.pages.length; i++) {
        const pt = parsed.pages[i];
        const cleaned = (pt?.text || '').trim();
        if (!cleaned) continue;
        const detected = detectChapterTitle(cleaned);
        if (detected) activeChapter = detected;
        pages.push({
          pageNumber: (pt as any)?.num || (i + 1),
          text: cleaned,
          chapter: activeChapter,
        });
      }
    }

    // Fallback if parsed.pages was not array or was empty, but rawAllText exists:
    if (pages.length === 0 && rawAllText.trim().length > 0) {
      const splitPages = rawAllText.split(/\f/);
      let activeChapter = meta.title || 'Introduction';
      for (let i = 0; i < splitPages.length; i++) {
        const text = splitPages[i].trim();
        if (!text) continue;
        const detected = detectChapterTitle(text);
        if (detected) activeChapter = detected;
        pages.push({
          pageNumber: i + 1,
          text,
          chapter: activeChapter,
        });
      }
    }

    await parser.destroy();
  } catch (pdfErr) {
    // pdf-parse failed, assume scanned or complex layout
    console.warn('pdf-parse threw error:', pdfErr);
  }

  // If pages were extracted successfully from PDF, return them immediately
  if (pages.length > 0) {
    return {
      title: meta.title || 'Astrology Book',
      author: meta.author,
      totalPages: pages.length,
      pages,
      isScanned: false,
      rawText: rawAllText || pages.map((p) => p.text).join('\n\n'),
    };
  }

  // Only invoke Gemini Multimodal OCR if NO text was extractable (pure scanned image PDF)
  try {
    const ocrPages = await performGeminiOcr(buffer);
    if (ocrPages && ocrPages.length > 0) {
      return {
        title: meta.title || 'Astrology Book',
        author: meta.author,
        totalPages: ocrPages.length,
        pages: ocrPages,
        isScanned: true,
        rawText: ocrPages.map((p) => p.text).join('\n\n'),
      };
    }
  } catch (ocrErr: any) {
    console.warn('OCR attempt failed, checking fallback text:', ocrErr.message);
    if (rawAllText && rawAllText.trim().length > 30) {
      return {
        title: meta.title || 'Astrology Book',
        author: meta.author,
        totalPages: 1,
        pages: [{ pageNumber: 1, text: rawAllText.trim(), chapter: meta.title }],
        isScanned: false,
        rawText: rawAllText,
      };
    }
    throw ocrErr;
  }

  throw new Error('No text could be extracted from this PDF. Please check if the file is readable.');
}

/**
 * Extracts pages and metadata from a Markdown or plain text book.
 */
export function extractFromTextOrMarkdown(
  content: string,
  meta: { title?: string; author?: string; fileType?: 'md' | 'txt' } = {}
): ExtractedBook {
  const pages: ExtractedPage[] = [];

  // Check if content has explicit page markers like "--- Page 1 ---" or "[Page 1]"
  const pageDelimiter = /(?:---|===)?\s*(?:\[?\s*page\s*(\d+)\s*\]?)\s*(?:---|===)?/i;
  const parts = content.split(pageDelimiter);

  let activeChapter = meta.title || 'Introduction';

  if (parts.length > 2) {
    for (let i = 1; i < parts.length; i += 2) {
      const pageNum = parseInt(parts[i], 10) || Math.floor(i / 2) + 1;
      const text = (parts[i + 1] || '').trim();
      if (text) {
        const detected = detectChapterTitle(text);
        if (detected) activeChapter = detected;
        pages.push({ pageNumber: pageNum, text, chapter: activeChapter });
      }
    }
  } else {
    // Virtual page splitting by ~2500 characters or major headings
    const sections = content.split(/(?=\n#+\s+)/g);
    let currentPage = 1;

    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) continue;

      const detected = detectChapterTitle(trimmed);
      if (detected) activeChapter = detected;

      // Split into ~2000 character logical pages
      const paragraphs = trimmed.split(/\n\s*\n/);
      let pageAccumulator = '';

      for (const para of paragraphs) {
        if (pageAccumulator.length + para.length > 2200 && pageAccumulator.length > 0) {
          pages.push({
            pageNumber: currentPage++,
            text: pageAccumulator.trim(),
            chapter: activeChapter,
          });
          pageAccumulator = para;
        } else {
          pageAccumulator = pageAccumulator ? `${pageAccumulator}\n\n${para}` : para;
        }
      }

      if (pageAccumulator.trim()) {
        pages.push({
          pageNumber: currentPage++,
          text: pageAccumulator.trim(),
          chapter: activeChapter,
        });
      }
    }
  }

  return {
    title: meta.title || 'Astrology Reference',
    author: meta.author,
    totalPages: pages.length || 1,
    pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: content.trim(), chapter: activeChapter }],
    isScanned: false,
    rawText: content,
  };
}
