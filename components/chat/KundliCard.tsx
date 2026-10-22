"use client";

import React, { useRef, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { toPng } from 'html-to-image';
import { NormalizedKundli } from '@/lib/kundli/types';
import { Download, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface KundliCardProps {
  kundli: NormalizedKundli;
  onExploreTopic?: (topic: string) => void;
}

export function KundliCard({ kundli }: KundliCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Sanitize SVG content
  const sanitizedSvg = DOMPurify.sanitize(kundli.chartSvg || '', {
    USE_PROFILES: { svg: true, svgFilters: true },
  });

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardRef.current) return;

    try {
      setDownloading(true);
      setDownloadSuccess(false);

      // Attempt high-res PNG capture via html-to-image
      let dataUrl: string;
      try {
        dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          backgroundColor: '#12151e',
          pixelRatio: 2.5,
        });
      } catch (domErr) {
        // Fallback: direct SVG to canvas conversion
        const svgElement = cardRef.current.querySelector('svg');
        if (!svgElement) throw domErr;

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);

        const img = new Image();
        dataUrl = await new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 800;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('No canvas context');
            ctx.fillStyle = '#12151e';
            ctx.fillRect(0, 0, 800, 800);
            ctx.drawImage(img, 0, 0, 800, 800);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = blobURL;
        });
      }

      const a = document.createElement('a');
      const filename = `Kundli-${(kundli.label || 'Vedic-Chart').replace(/\s+/g, '_')}-${kundli.birth.date || 'chart'}.png`;
      a.download = filename;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Download PNG failed:', e);
      // Final fallback: download raw SVG file
      if (kundli.chartSvg) {
        const blob = new Blob([kundli.chartSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `Kundli-${(kundli.label || 'Vedic-Chart').replace(/\s+/g, '_')}.svg`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-sm my-2 rounded-2xl bg-[#12151e] border-2 border-[#d4af37]/40 shadow-xl overflow-hidden transition-all text-white">
      {/* Printable / Downloadable Area */}
      <div ref={cardRef} className="p-4 bg-[#12151e]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#d4af37]/20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#ffd56b]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#ffd56b] tracking-wide uppercase">
                {kundli.label || 'Janam Kundli'}
              </h4>
              <p className="text-[10px] text-gray-400">
                {kundli.birth.date} • {kundli.birth.time} • {kundli.birth.place}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#ffd56b] border border-[#d4af37]/30">
            Lagna: {kundli.ascendant.sign}
          </span>
        </div>

        {/* North Indian Vedic Chart SVG */}
        <div className="my-3 w-full aspect-square flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full">
          <div
            className="w-full h-full"
            dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
          />
        </div>

        {/* Kundli Summary Pill Bar */}
        <div className="grid grid-cols-3 gap-1.5 p-2 bg-[#191d2a] rounded-xl border border-[#2b3346] text-center text-[10px]">
          <div>
            <div className="text-gray-400 font-medium">Moon Sign</div>
            <div className="font-bold text-[#ffd56b] mt-0.5">{kundli.moonSign}</div>
          </div>
          <div className="border-x border-[#2b3346]">
            <div className="text-gray-400 font-medium">Nakshatra</div>
            <div className="font-bold text-gray-200 mt-0.5 truncate px-1">
              {kundli.moonNakshatra || 'Magha'}
            </div>
          </div>
          <div>
            <div className="text-gray-400 font-medium">Mahadasha</div>
            <div className="font-bold text-emerald-400 mt-0.5">
              {kundli.dasha?.currentMahadasha || 'Active'}
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Download Button - Visible on both Mobile & Desktop */}
      <div className="p-3 bg-[#191d2a] border-t border-[#d4af37]/20 flex items-center justify-between">
        <span className="text-[11px] text-gray-400 font-medium">
          Accurate Vedic Chart Image
        </span>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7d774] to-[#dfbe8c] hover:opacity-95 text-black font-bold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {downloading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
              <span className="text-emerald-950">Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download Kundli</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
