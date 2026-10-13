"use client";

import React, { useRef, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { toPng } from 'html-to-image';
import { NormalizedKundli } from '@/lib/kundli/types';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KundliCardProps {
  kundli: NormalizedKundli;
  onExploreTopic?: (topic: string) => void;
}

export function KundliCard({ kundli }: KundliCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Sanitize SVG content using DOMPurify
  const sanitizedSvg = DOMPurify.sanitize(kundli.chartSvg || '', {
    USE_PROFILES: { svg: true, svgFilters: true },
  });

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chartRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(chartRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const a = document.createElement('a');
      a.download = `Kundli-${kundli.label || 'Chart'}-${kundli.birth.date}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error('Download PNG failed:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative group w-full max-w-[340px] sm:max-w-[380px] my-2 rounded-2xl bg-white p-3 shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300">
      {/* North Indian SVG Chart Container */}
      <div
        ref={chartRef}
        className="w-full aspect-square flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
        dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
      />

      {/* Download button - hidden by default, visible only on hover */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
        <Button
          size="sm"
          onClick={handleDownload}
          disabled={downloading || !sanitizedSvg}
          className="pointer-events-auto bg-[#14171d]/90 hover:bg-[#14171d] text-[#ffd56b] border border-[#ffd56b]/40 text-xs px-4 py-2 rounded-xl shadow-xl flex items-center gap-1.5 cursor-pointer transform hover:scale-105 transition-all"
        >
          {downloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
          ) : (
            <Download className="w-3.5 h-3.5 mr-1" />
          )}
          <span>Download Kundli</span>
        </Button>
      </div>
    </div>
  );
}

