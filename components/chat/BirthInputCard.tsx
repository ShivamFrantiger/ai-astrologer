"use client";

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Sparkles, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BirthInputCardProps {
  onSubmit: (details: {
    date: string;
    time: string;
    place: string;
    label?: string;
    isApproximateTime?: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
  initialValues?: {
    date?: string;
    time?: string;
    place?: string;
    label?: string;
  };
}

export function BirthInputCard({ onSubmit, isLoading, initialValues }: BirthInputCardProps) {
  const [date, setDate] = useState(initialValues?.date || '');
  const [time, setTime] = useState(initialValues?.time || '12:00');
  const [place, setPlace] = useState(initialValues?.place || '');
  const [label, setLabel] = useState(initialValues?.label || 'Self');
  const [unknownTime, setUnknownTime] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('Kripya Janam Tithi (Date of birth) daalein.');
      return;
    }
    if (!place || place.trim().length < 2) {
      setError('Kripya Janam Sthan (City / Place) daalein.');
      return;
    }

    try {
      await onSubmit({
        date,
        time: unknownTime ? '12:00' : time,
        place: place.trim(),
        label: label.trim() || 'Self',
        isApproximateTime: unknownTime,
      });
    } catch (err: any) {
      setError(err.message || 'Error creating Kundli');
    }
  };

  return (
    <div className="w-full max-w-md bg-[#161920] border border-[#2e3341] rounded-2xl p-4 sm:p-5 shadow-xl my-2">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#ffd56b]" />
        <h4 className="text-sm font-bold text-white">Janam Vivaran (Birth Details)</h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Profile label */}
        <div className="space-y-1">
          <Label className="text-[11px] text-[#9ca3af] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#ffd56b]" />
            Kiski Kundli Hai? (Profile)
          </Label>
          <Input
            type="text"
            placeholder="e.g. Self, Wife, Dost"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={isLoading}
            className="h-9 bg-[#101217] border-[#2e3341] text-xs text-white"
          />
        </div>

        {/* Date */}
        <div className="space-y-1">
          <Label className="text-[11px] text-[#9ca3af] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#ffd56b]" />
            Date of Birth
          </Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isLoading}
            className="h-9 bg-[#101217] border-[#2e3341] text-xs text-white"
          />
        </div>

        {/* Time */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-[#9ca3af] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ffd56b]" />
              Time of Birth
            </Label>
            <label className="text-[10px] text-amber-300 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={unknownTime}
                onChange={(e) => setUnknownTime(e.target.checked)}
                className="rounded accent-[#ffd56b] w-3 h-3"
              />
              <span>Time nahi pata (Noon 12:00)</span>
            </label>
          </div>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={isLoading || unknownTime}
            className={`h-9 bg-[#101217] border-[#2e3341] text-xs text-white ${
              unknownTime ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
        </div>

        {/* Place */}
        <div className="space-y-1">
          <Label className="text-[11px] text-[#9ca3af] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#ffd56b]" />
            Place of Birth
          </Label>
          <Input
            type="text"
            placeholder="e.g. Jaipur, Rajasthan"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            disabled={isLoading}
            className="h-9 bg-[#101217] border-[#2e3341] text-xs text-white"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-800/40">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-9 bg-gradient-to-r from-[#ffd56b] to-[#f59e0b] text-black font-semibold text-xs rounded-xl hover:opacity-90 cursor-pointer"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Kundli banayi ja rahi hai...</span>
            </div>
          ) : (
            <span>Kundli Generate Karein</span>
          )}
        </Button>
      </form>
    </div>
  );
}
