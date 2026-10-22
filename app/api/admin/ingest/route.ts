import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import {
  ingestDocument,
  deleteDocument,
  getKnowledgeStats,
} from '@/lib/rag/ingestion';
import { AstrologyCategory, AstrologyDocumentMeta } from '@/lib/rag/types';

const AdminActionSchema = z.object({
  action: z.enum(['status', 'reindex', 'delete']),
  documentId: z.string().optional(),
});

function verifyAdminAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const secret = process.env.ADMIN_SECRET_KEY || process.env.GEMINI_API_KEY;
  if (!secret) return false;

  return token === secret;
}

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge', 'astrology');

function parseMetadata(filePath: string, content: string): AstrologyDocumentMeta {
  const fileName = path.basename(filePath, path.extname(filePath));
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : fileName.replace(/_/g, ' ');

  const sourceMatch = content.match(/\*\*Source:\*\*\s*(.+)$/m);
  const source = sourceMatch ? sourceMatch[1].trim() : 'Classical Vedic Shastra';

  const authorMatch = content.match(/\*\*Author:\*\*\s*(.+)$/m);
  const author = authorMatch ? authorMatch[1].trim() : 'Traditional Vedic Sage';

  const categoryMatch = content.match(/\*\*Category:\*\*\s*([a-z_]+)/m);
  const category = (categoryMatch ? categoryMatch[1].trim() : 'general_vedic') as AstrologyCategory;

  return {
    id: fileName,
    title,
    source,
    author,
    category,
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid admin token' }, { status: 401 });
  }

  try {
    const stats = await getKnowledgeStats();
    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid admin token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, documentId } = AdminActionSchema.parse(body);

    if (action === 'status') {
      const stats = await getKnowledgeStats();
      return NextResponse.json({ success: true, stats });
    }

    if (action === 'delete') {
      if (!documentId) {
        return NextResponse.json({ error: 'documentId is required for deletion' }, { status: 400 });
      }
      const deletedCount = await deleteDocument(documentId);
      return NextResponse.json({ success: true, deletedCount });
    }

    if (action === 'reindex') {
      if (!fs.existsSync(KNOWLEDGE_DIR)) {
        return NextResponse.json({ error: 'Knowledge directory not found' }, { status: 404 });
      }

      const files = fs
        .readdirSync(KNOWLEDGE_DIR)
        .filter((f) => f.endsWith('.md') || f.endsWith('.txt'))
        .sort();

      let totalChunks = 0;
      let newlyEmbedded = 0;
      let skipped = 0;

      for (const file of files) {
        const fullPath = path.join(KNOWLEDGE_DIR, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const meta = parseMetadata(fullPath, content);

        const res = await ingestDocument(content, meta);
        totalChunks += res.totalChunks;
        newlyEmbedded += res.newlyEmbedded;
        skipped += res.skipped;
      }

      const stats = await getKnowledgeStats();

      return NextResponse.json({
        success: true,
        summary: {
          totalFiles: files.length,
          totalChunks,
          newlyEmbedded,
          skipped,
        },
        stats,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
