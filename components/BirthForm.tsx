"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const birthFormSchema = z.object({
  date: z.string().min(1, 'Date of birth is required'),
  time: z.string().min(1, 'Time of birth is required'),
  place: z.string().min(2, 'Place of birth must be at least 2 characters'),
});

export type BirthFormValues = z.infer<typeof birthFormSchema>;

interface BirthFormProps {
  onSubmit: (values: BirthFormValues) => Promise<void>;
  isLoading: boolean;
  defaultValues?: Partial<BirthFormValues>;
}

export function BirthForm({ onSubmit, isLoading, defaultValues }: BirthFormProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BirthFormValues>({
    resolver: zodResolver(birthFormSchema),
    defaultValues: {
      date: defaultValues?.date || '',
      time: defaultValues?.time || '12:00',
      place: defaultValues?.place || '',
    },
  });

  const handleFormSubmit = async (data: BirthFormValues) => {
    try {
      setErrorMsg(null);
      await onSubmit(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate Kundli. Please try again.');
    }
  };

  return (
    <div className="w-full bg-[#181b22] border border-[#2b303c] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#ffd56b]/20 to-[#f59e0b]/10 border border-[#ffd56b]/30 text-[#ffd56b]">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">Enter Birth Details</h2>
          <p className="text-sm text-[#9ca3af]">Calculate authentic Vedic (Lahiri) Kundli & Planetary Positions</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* Date of Birth */}
        <div className="space-y-1.5">
          <Label htmlFor="date" className="text-sm font-medium text-[#e5e7eb] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ffd56b]" />
            Date of Birth
          </Label>
          <Input
            id="date"
            type="date"
            max={new Date().toISOString().split('T')[0]}
            disabled={isLoading}
            className="bg-[#111317] border-[#323743] text-white focus:border-[#ffd56b] focus:ring-[#ffd56b]/20 h-11"
            {...register('date')}
          />
          {errors.date && (
            <p className="text-xs text-rose-400 mt-1">{errors.date.message}</p>
          )}
        </div>

        {/* Time of Birth */}
        <div className="space-y-1.5">
          <Label htmlFor="time" className="text-sm font-medium text-[#e5e7eb] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#ffd56b]" />
            Time of Birth (24-Hour format)
          </Label>
          <Input
            id="time"
            type="time"
            step="60"
            disabled={isLoading}
            className="bg-[#111317] border-[#323743] text-white focus:border-[#ffd56b] focus:ring-[#ffd56b]/20 h-11"
            {...register('time')}
          />
          {errors.time && (
            <p className="text-xs text-rose-400 mt-1">{errors.time.message}</p>
          )}
        </div>

        {/* Place of Birth */}
        <div className="space-y-1.5">
          <Label htmlFor="place" className="text-sm font-medium text-[#e5e7eb] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#ffd56b]" />
            Place of Birth (City / Town)
          </Label>
          <Input
            id="place"
            type="text"
            placeholder="e.g. New Delhi, Mumbai, Varanasi"
            disabled={isLoading}
            className="bg-[#111317] border-[#323743] text-white placeholder-[#6b7280] focus:border-[#ffd56b] focus:ring-[#ffd56b]/20 h-11"
            {...register('place')}
          />
          {errors.place && (
            <p className="text-xs text-rose-400 mt-1">{errors.place.message}</p>
          )}
        </div>

        {errorMsg && (
          <div className={`p-4 rounded-xl border text-sm space-y-2 ${
            errorMsg.toLowerCase().includes('sandbox mode')
              ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            <p className="leading-relaxed">{errorMsg}</p>
            {errorMsg.toLowerCase().includes('sandbox mode') && (
              <button
                type="button"
                onClick={() => {
                  setValue('date', '2000-01-01');
                  setErrorMsg(null);
                }}
                className="inline-block mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition cursor-pointer"
              >
                ⚡ Click here to set Date to 2000-01-01 for Sandbox testing
              </button>
            )}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-[#ffd56b] via-[#f59e0b] to-[#d97706] text-black font-semibold text-base rounded-xl hover:opacity-95 transition-all shadow-lg shadow-[#f59e0b]/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Calculating Planetary Positions...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>Generate Kundli Chart</span>
            </div>
          )}
        </Button>
      </form>
    </div>
  );
}
