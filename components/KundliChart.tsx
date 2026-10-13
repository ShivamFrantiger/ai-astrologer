"use client";

import React, { useRef, useState } from 'react';
import { Download, Sparkles, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toPng } from 'html-to-image';

interface KundliChartProps {
  svgContent: string;
  title?: string;
  birthDetails?: {
    date: string;
    time: string;
    place: string;
  };
}

export function KundliChart({ svgContent, title = 'Vedic (Lagna / Rasi) Kundli', birthDetails }: KundliChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPng = async () => {
    if (!chartContainerRef.current) return;
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(chartContainerRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      link.download = `Kundli-Chart-${birthDetails?.date || 'chart'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export chart PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full bg-[#181b22] border border-[#2b303c] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ffd56b]" />
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>
          <p className="text-xs text-[#9ca3af] mt-1">North Indian Style Chart (Whole Sign System)</p>
        </div>

        <Button
          onClick={handleDownloadPng}
          disabled={isDownloading || !svgContent}
          variant="outline"
          className="border-[#ffd56b]/40 text-[#ffd56b] hover:bg-[#ffd56b]/10 hover:text-white transition flex items-center gap-2 h-9 px-4 rounded-xl cursor-pointer"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving PNG...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </>
          )}
        </Button>
      </div>

      {/* Printable / Downloadable Container */}
      <div
        ref={chartContainerRef}
        className="w-full max-w-[480px] p-4 bg-white rounded-xl shadow-inner border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden"
      >
        {birthDetails && (
          <div className="text-center mb-2 text-xs font-semibold text-gray-700">
            <div>Jyotix Vedic Astrological Chart</div>
            <div className="text-[10px] text-gray-500 font-normal">
              {birthDetails.date} | {birthDetails.time} | {birthDetails.place}
            </div>
          </div>
        )}

        {svgContent ? (
          <div
            className="w-full aspect-square flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center text-gray-400">
            No chart data available
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-[#9ca3af]">
        <Eye className="w-3.5 h-3.5 text-[#ffd56b]" />
        <span>House 1 (Ascendant/Lagna) is at the top diamond center. Numbers represent Rasis (1=Aries ... 12=Pisces).</span>
      </div>
    </div>
  );
}
