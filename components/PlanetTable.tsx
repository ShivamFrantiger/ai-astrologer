"use client";

import React from 'react';
import { PlanetInfo, AscendantInfo, DashaInfo } from '@/lib/kundli';
import { Compass, Moon, Sun, Orbit, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PlanetTableProps {
  ascendant: AscendantInfo;
  moonSign: string;
  planets: PlanetInfo[];
  dasha?: DashaInfo;
}

const vedicNames: Record<string, string> = {
  Sun: 'Surya (सूर्य)',
  Moon: 'Chandra (चन्द्र)',
  Mars: 'Mangal (मंगल)',
  Mercury: 'Budha (बुध)',
  Jupiter: 'Guru (बृहस्पति)',
  Venus: 'Shukra (शुक्र)',
  Saturn: 'Shani (शनि)',
  Rahu: 'Rahu (राहु)',
  Ketu: 'Ketu (केतु)',
  Ascendant: 'Lagna (लग्न)',
};

export function PlanetTable({ ascendant, moonSign, planets, dasha }: PlanetTableProps) {
  return (
    <div className="w-full space-y-6">
      {/* Top Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Ascendant Card */}
        <div className="p-4 rounded-xl bg-[#181b22] border border-[#2b303c] flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-[#ffd56b]/10 text-[#ffd56b] border border-[#ffd56b]/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#9ca3af]">Lagna / Ascendant</div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>{ascendant.sign}</span>
              <span className="text-xs font-normal text-[#ffd56b]">{ascendant.degree}°</span>
            </div>
          </div>
        </div>

        {/* Moon Sign Card */}
        <div className="p-4 rounded-xl bg-[#181b22] border border-[#2b303c] flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#9ca3af]">Moon Sign (Rashi)</div>
            <div className="text-base font-bold text-white">{moonSign}</div>
          </div>
        </div>

        {/* Dasha Card */}
        <div className="p-4 rounded-xl bg-[#181b22] border border-[#2b303c] flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-[#9ca3af]">Running Vimshottari Dasha</div>
            <div className="text-base font-bold text-white">
              {dasha?.currentMahadasha ? (
                <span>
                  {dasha.currentMahadasha}
                  {dasha.currentAntardasha ? ` - ${dasha.currentAntardasha}` : ''}
                </span>
              ) : (
                <span className="text-xs text-[#9ca3af]">Vimshottari Dasha</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Planetary Positions Table */}
      <div className="bg-[#181b22] border border-[#2b303c] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-[#2b303c] flex items-center gap-2">
          <Orbit className="w-5 h-5 text-[#ffd56b]" />
          <h3 className="text-lg font-bold text-white">Planetary Positions (Graha Sthiti)</h3>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#111317]">
              <TableRow className="border-b border-[#2b303c] hover:bg-transparent">
                <TableHead className="text-[#9ca3af] font-semibold">Planet (Graha)</TableHead>
                <TableHead className="text-[#9ca3af] font-semibold">Sign (Rasi)</TableHead>
                <TableHead className="text-[#9ca3af] font-semibold">Degree</TableHead>
                <TableHead className="text-[#9ca3af] font-semibold text-center">House (Bhava)</TableHead>
                <TableHead className="text-[#9ca3af] font-semibold text-right">State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planets.map((p) => {
                const displayName = vedicNames[p.name] || p.name;
                return (
                  <TableRow
                    key={p.name}
                    className="border-b border-[#242832] hover:bg-[#20242e]/50 transition-colors"
                  >
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        {p.name === 'Sun' ? (
                          <Sun className="w-4 h-4 text-amber-400" />
                        ) : p.name === 'Moon' ? (
                          <Moon className="w-4 h-4 text-sky-300" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-[#ffd56b]/80" />
                        )}
                        <span>{displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#e5e7eb] font-semibold">{p.sign}</TableCell>
                    <TableCell className="text-[#ffd56b] font-mono">{p.degree}°</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#2a2f3a] text-xs font-bold text-white border border-[#3c4250]">
                        {p.house}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.retrograde ? (
                        <Badge variant="outline" className="border-rose-500/50 bg-rose-950/30 text-rose-300 text-xs font-semibold">
                          Vakri (R)
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">Direct</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
