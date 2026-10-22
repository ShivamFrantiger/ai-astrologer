"use client";

import React, { useState } from 'react';
import { Delete, Check, Clock, MapPin, Calendar, Sparkles } from 'lucide-react';

interface RevaDialpadInputProps {
  onComplete: (details: {
    name?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
    place: string;
    isApproximateTime: boolean;
  }) => void;
  initialName?: string;
}

export function RevaDialpadInput({ onComplete, initialName }: RevaDialpadInputProps) {
  const [step, setStep] = useState<'name' | 'dob' | 'tob' | 'pob'>(initialName ? 'dob' : 'name');
  const [name, setName] = useState(initialName || '');

  // DOB state: DD, MM, YYYY
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [activeDobField, setActiveDobField] = useState<'day' | 'month' | 'year'>('day');

  // TOB state: HH, MM, AM/PM
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('PM');
  const [activeTobField, setActiveTobField] = useState<'hour' | 'minute'>('hour');
  const [unknownTime, setUnknownTime] = useState(false);

  // POB state
  const [place, setPlace] = useState('');

  // Handle dialpad number clicks for DOB
  const handleDobNumber = (num: number) => {
    if (activeDobField === 'day') {
      const next = (day + num).slice(0, 2);
      setDay(next);
      if (next.length === 2 || parseInt(next, 10) > 3) {
        setActiveDobField('month');
      }
    } else if (activeDobField === 'month') {
      const next = (month + num).slice(0, 2);
      setMonth(next);
      if (next.length === 2 || parseInt(next, 10) > 1) {
        setActiveDobField('year');
      }
    } else if (activeDobField === 'year') {
      const next = (year + num).slice(0, 4);
      setYear(next);
    }
  };

  const handleDobBackspace = () => {
    if (activeDobField === 'year') {
      if (year.length > 0) {
        setYear(year.slice(0, -1));
      } else {
        setActiveDobField('month');
      }
    } else if (activeDobField === 'month') {
      if (month.length > 0) {
        setMonth(month.slice(0, -1));
      } else {
        setActiveDobField('day');
      }
    } else if (activeDobField === 'day') {
      setDay(day.slice(0, -1));
    }
  };

  const handleConfirmDob = () => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (!d || d < 1 || d > 31 || !m || m < 1 || m > 12 || !y || y < 1920 || y > 2030) {
      alert('Please enter a valid Date of Birth (Day 1-31, Month 1-12, Year 1920-2025)');
      return;
    }
    setStep('tob');
  };

  // Handle dialpad number clicks for TOB
  const handleTobNumber = (num: number) => {
    if (activeTobField === 'hour') {
      const next = (hour + num).slice(0, 2);
      setHour(next);
      if (next.length === 2 || parseInt(next, 10) > 1) {
        setActiveTobField('minute');
      }
    } else if (activeTobField === 'minute') {
      const next = (minute + num).slice(0, 2);
      setMinute(next);
    }
  };

  const handleTobBackspace = () => {
    if (activeTobField === 'minute') {
      if (minute.length > 0) {
        setMinute(minute.slice(0, -1));
      } else {
        setActiveTobField('hour');
      }
    } else if (activeTobField === 'hour') {
      setHour(hour.slice(0, -1));
    }
  };

  const handleConfirmTob = () => {
    if (unknownTime) {
      setStep('pob');
      return;
    }
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || h < 1 || h > 12 || isNaN(m) || m < 0 || m > 59) {
      alert('Please enter a valid birth time (Hour 1-12, Minute 0-59)');
      return;
    }
    setStep('pob');
  };

  const handleConfirmAll = (placeValue?: string) => {
    const finalPlace = (placeValue || place).trim();
    if (!finalPlace) {
      alert('Please enter or select your birth city.');
      return;
    }

    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    let formattedTime = '12:00';

    if (!unknownTime && hour && minute) {
      let h = parseInt(hour, 10);
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      formattedTime = `${String(h).padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }

    onComplete({
      name: name || 'Friend',
      date: formattedDate,
      time: formattedTime,
      place: finalPlace,
      isApproximateTime: unknownTime,
    });
  };

  const quickCities = ['Delhi, India', 'Mumbai, India', 'Bengaluru, India', 'Jaipur, India', 'Pune, India', 'Kolkata, India'];

  return (
    <div className="w-full max-w-sm mx-auto bg-[#faf7f2] border border-[#e5ded3] rounded-3xl p-5 shadow-2xl text-gray-800 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Step Indicator Header */}
      <div className="text-center mb-4">
        {step === 'name' && (
          <>
            <h3 className="text-base font-semibold text-gray-900">What is your name?</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Tell Jyotix who this Kundali is for</p>
          </>
        )}
        {step === 'dob' && (
          <>
            <h3 className="text-base font-semibold text-gray-900">Date of Birth</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Accurate details give better predictions</p>
          </>
        )}
        {step === 'tob' && (
          <>
            <h3 className="text-base font-semibold text-gray-900">Time of Birth</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Approximate time is fine if exact is unknown</p>
          </>
        )}
        {step === 'pob' && (
          <>
            <h3 className="text-base font-semibold text-gray-900">Place of Birth</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">City or town where you were born</p>
          </>
        )}
      </div>

      {/* STEP 1: Name Input */}
      {step === 'name' && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your Name (e.g. Debojyoti Roy)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-center text-sm font-medium bg-white border border-[#dcd3c4] rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
            autoFocus
          />
          <button
            onClick={() => {
              if (name.trim()) setStep('dob');
            }}
            disabled={!name.trim()}
            className="w-full bg-[#1b1c20] text-white py-3 rounded-2xl text-xs font-semibold hover:bg-black transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <span>Continue</span>
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STEP 2: Date of Birth Dialpad */}
      {step === 'dob' && (
        <div className="space-y-4">
          {/* Segmented Boxes: [DD] / [MM] / [YYYY] */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveDobField('day')}
              className={`w-16 h-12 rounded-xl text-base font-semibold flex items-center justify-center transition ${
                activeDobField === 'day'
                  ? 'bg-white border-2 border-[#d4af37] shadow-sm text-gray-900'
                  : 'bg-white/80 border border-[#ded5c6] text-gray-700'
              }`}
            >
              {day || 'DD'}
            </button>
            <span className="text-gray-400 font-light text-lg">/</span>
            <button
              type="button"
              onClick={() => setActiveDobField('month')}
              className={`w-16 h-12 rounded-xl text-base font-semibold flex items-center justify-center transition ${
                activeDobField === 'month'
                  ? 'bg-white border-2 border-[#d4af37] shadow-sm text-gray-900'
                  : 'bg-white/80 border border-[#ded5c6] text-gray-700'
              }`}
            >
              {month || 'MM'}
            </button>
            <span className="text-gray-400 font-light text-lg">/</span>
            <button
              type="button"
              onClick={() => setActiveDobField('year')}
              className={`w-24 h-12 rounded-xl text-base font-semibold flex items-center justify-center transition ${
                activeDobField === 'year'
                  ? 'bg-white border-2 border-[#d4af37] shadow-sm text-gray-900'
                  : 'bg-white/80 border border-[#ded5c6] text-gray-700'
              }`}
            >
              {year || 'YYYY'}
            </button>
          </div>

          {/* Numeric Custom Dialpad */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleDobNumber(n)}
                className="h-11 rounded-2xl bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-medium text-base shadow-xs transition flex items-center justify-center cursor-pointer select-none"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDobBackspace}
              className="h-11 rounded-2xl bg-[#f87171]/20 hover:bg-[#f87171]/30 active:scale-95 text-[#dc2626] flex items-center justify-center transition cursor-pointer select-none"
            >
              <Delete className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleDobNumber(0)}
              className="h-11 rounded-2xl bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-medium text-base shadow-xs transition flex items-center justify-center cursor-pointer select-none"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleConfirmDob}
              className="h-11 rounded-2xl bg-[#1c1d22] hover:bg-black active:scale-95 text-white flex items-center justify-center transition shadow-md cursor-pointer select-none"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Time of Birth Dialpad */}
      {step === 'tob' && (
        <div className="space-y-4">
          {!unknownTime ? (
            <>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTobField('hour')}
                  className={`w-16 h-12 rounded-xl text-base font-semibold flex items-center justify-center transition ${
                    activeTobField === 'hour'
                      ? 'bg-white border-2 border-[#d4af37] shadow-sm text-gray-900'
                      : 'bg-white/80 border border-[#ded5c6] text-gray-700'
                  }`}
                >
                  {hour || '12'}
                </button>
                <span className="text-gray-400 font-light text-lg">:</span>
                <button
                  type="button"
                  onClick={() => setActiveTobField('minute')}
                  className={`w-16 h-12 rounded-xl text-base font-semibold flex items-center justify-center transition ${
                    activeTobField === 'minute'
                      ? 'bg-white border-2 border-[#d4af37] shadow-sm text-gray-900'
                      : 'bg-white/80 border border-[#ded5c6] text-gray-700'
                  }`}
                >
                  {minute || '00'}
                </button>
                <div className="flex flex-col gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => setMeridiem('AM')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      meridiem === 'AM'
                        ? 'bg-[#1b1c20] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setMeridiem('PM')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      meridiem === 'PM'
                        ? 'bg-[#1b1c20] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Numeric Dialpad for Time */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleTobNumber(n)}
                    className="h-11 rounded-2xl bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-medium text-base shadow-xs transition flex items-center justify-center cursor-pointer select-none"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleTobBackspace}
                  className="h-11 rounded-2xl bg-[#f87171]/20 hover:bg-[#f87171]/30 active:scale-95 text-[#dc2626] flex items-center justify-center transition cursor-pointer select-none"
                >
                  <Delete className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTobNumber(0)}
                  className="h-11 rounded-2xl bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-medium text-base shadow-xs transition flex items-center justify-center cursor-pointer select-none"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTob}
                  className="h-11 rounded-2xl bg-[#1c1d22] hover:bg-black active:scale-95 text-white flex items-center justify-center transition shadow-md cursor-pointer select-none"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center text-xs text-amber-800">
              Noon (12:00 PM) will be used to calculate Moon sign, Nakshatra, and broad planetary positions.
            </div>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setUnknownTime(!unknownTime);
                if (!unknownTime) setStep('pob');
              }}
              className="text-xs text-[#8c6d32] hover:underline font-medium cursor-pointer"
            >
              {unknownTime ? 'I know exact time' : "I don't know my exact birth time"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Place of Birth Input */}
      {step === 'pob' && (
        <div className="space-y-4">
          <div className="relative">
            <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="e.g. Delhi, Jaipur, Mumbai"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-[#dcd3c4] rounded-2xl py-2.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              autoFocus
            />
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-1.5">
              Popular Cities
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setPlace(city);
                    handleConfirmAll(city);
                  }}
                  className="text-[11px] px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 transition cursor-pointer"
                >
                  {city.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleConfirmAll()}
            disabled={!place.trim()}
            className="w-full bg-gradient-to-r from-[#dfbe8c] to-[#d4af37] text-black py-3 rounded-2xl text-xs font-bold hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40 cursor-pointer mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate My Kundali Chart</span>
          </button>
        </div>
      )}
    </div>
  );
}
