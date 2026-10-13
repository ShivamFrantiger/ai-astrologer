"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { BirthForm, BirthFormValues } from '@/components/BirthForm';
import { KundliChart } from '@/components/KundliChart';
import { PlanetTable } from '@/components/PlanetTable';
import { NormalizedKundli } from '@/lib/kundli';
import { useAuth } from '@/contexts/AuthContext';
import { personalizedAstrologyChat } from '@/ai/flows/personalized-astrology-chat';
import Footer from '@/components/Footer';
import { Sparkles, MessageSquare, Send, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const NavBar = dynamic(() => import('@/components/NavBar').then((mod) => mod.NavBar), {
  ssr: false,
});
const BottomNavBar = dynamic(() => import('@/components/BottomNavBar').then((mod) => mod.BottomNavBar), {
  ssr: false,
});

export default function KundliPage() {
  const { user } = useAuth();
  const [kundli, setKundli] = useState<NormalizedKundli | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [chatQuestion, setChatQuestion] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([]);

  const handleGenerateKundli = async (formValues: BirthFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/kundli', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formValues,
          userId: user?.uid || `guest_${Date.now()}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Kundli');
      }

      console.log('=== [KUNDLI DATA JSON] ===\n', JSON.stringify(data.kundli, null, 2));
      console.log('=== [KUNDLI OBJECT] ===', data.kundli);

      setKundli(data.kundli);

      // Add a greeting welcome message in chat once Kundli is generated
      setChatMessages([
        {
          sender: 'bot',
          text: `Namaste! Aapki ${data.kundli.ascendant.sign} Lagna aur ${data.kundli.moonSign} Rashi ki Kundli taiyar hai. Aap career, business, marriage ya dasha ke baare me koi bhi sawal pooch sakte hain.`,
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Error occurred while contacting astrology service');
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (customQuestion?: string) => {
    const q = (customQuestion || chatQuestion).trim();
    if (!q || !kundli || chatLoading) return;

    const newMessages = [...chatMessages, { sender: 'user' as const, text: q }];
    setChatMessages(newMessages);
    setChatQuestion('');
    setChatLoading(true);

    try {
      const { chartSvg, ...kundliContextWithoutSvg } = kundli;
      const botResponse = await personalizedAstrologyChat({
        question: q,
        birthDate: kundli.birth.date,
        birthTime: kundli.birth.time,
        birthPlace: kundli.birth.place,
        userId: user?.uid || 'guest',
        kundliContext: JSON.stringify(kundliContextWithoutSvg, null, 2),
      });

      setChatMessages([...newMessages, { sender: 'bot', text: botResponse }]);
    } catch (chatErr: any) {
      setChatMessages([
        ...newMessages,
        {
          sender: 'bot',
          text: 'Kshama karein, is samay uttar dene me samasya aayi. Kripya thodi der baad punah prayas karein.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const sampleQuestions = [
    'Mera business kaisa rahega?',
    'Career me kab success milegi?',
    'Meri running Dasha aur 10th house explain karein.',
    'Vivah aur relationship yog kaisa hai?',
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#f8f8f8] flex flex-col font-sans">
      <NavBar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ffd56b]/10 border border-[#ffd56b]/20 text-[#ffd56b] text-xs sm:text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Vedic Astrology (Lahiri Ayanamsa)</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Free Vedic Kundli & Horoscope
          </h1>
          <p className="text-base sm:text-lg text-[#9ca3af]">
            Calculate your authentic Janam Kundli with planetary degrees, whole sign houses, North Indian birth chart, and AI astrology consultation.
          </p>
        </div>

        {/* Input & Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Birth Form Column */}
          <div className="lg:col-span-5 w-full">
            <BirthForm onSubmit={handleGenerateKundli} isLoading={loading} />

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
                {error}
              </div>
            )}

            {kundli && (
              <div className="mt-6 p-4 rounded-xl bg-[#181b22] border border-[#2b303c] text-xs text-[#9ca3af] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">Calculated For: </span>
                  {kundli.birth.place}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setKundli(null)}
                  className="text-[#ffd56b] hover:text-white hover:bg-transparent h-auto p-0 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recalculate</span>
                </Button>
              </div>
            )}
          </div>

          {/* Chart & Highlights Column */}
          <div className="lg:col-span-7 w-full space-y-8">
            {kundli ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                {/* SVG Chart */}
                <KundliChart
                  svgContent={kundli.chartSvg}
                  birthDetails={{
                    date: kundli.birth.date,
                    time: kundli.birth.time,
                    place: kundli.birth.place,
                  }}
                />

                {/* Planets Table */}
                <PlanetTable
                  ascendant={kundli.ascendant}
                  moonSign={kundli.moonSign}
                  planets={kundli.planets}
                  dasha={kundli.dasha}
                />

                {/* Gemini Astrologer Q&A Section */}
                <div className="bg-[#181b22] border border-[#2b303c] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#ffd56b]/10 text-[#ffd56b] border border-[#ffd56b]/20">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Ask Jyotix about your Kundli</h3>
                      <p className="text-xs text-[#9ca3af]">
                        Vedic AI answers based on your 10th house, 7th house, planetary lords, and running dasha.
                      </p>
                    </div>
                  </div>

                  {/* Sample Query Pills */}
                  <div className="flex flex-wrap gap-2">
                    {sampleQuestions.map((sq) => (
                      <button
                        key={sq}
                        onClick={() => handleAskQuestion(sq)}
                        disabled={chatLoading}
                        className="text-xs px-3 py-1.5 rounded-full bg-[#222631] text-[#ffd56b] border border-[#373d4d] hover:bg-[#2c3241] transition cursor-pointer disabled:opacity-50"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>

                  {/* Chat Messages Log */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    <AnimatePresence>
                      {chatMessages.map((msg, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                              msg.sender === 'user'
                                ? 'bg-gradient-to-r from-[#ffd56b] to-[#f59e0b] text-black font-medium'
                                : 'bg-[#111317] border border-[#2b303c] text-white/90'
                            }`}
                          >
                            {msg.text}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-[#111317] border border-[#2b303c] text-[#ffd56b] px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Consulting planetary alignment...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input Bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#2b303c]">
                    <Input
                      type="text"
                      placeholder="e.g. Mera business kaisa jayega? ya Remedies batayein..."
                      value={chatQuestion}
                      onChange={(e) => setChatQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                      disabled={chatLoading}
                      className="bg-[#111317] border-[#323743] text-white focus:border-[#ffd56b] h-11"
                    />
                    <Button
                      onClick={() => handleAskQuestion()}
                      disabled={chatLoading || !chatQuestion.trim()}
                      className="h-11 px-5 bg-[#ffd56b] text-black hover:bg-[#e6c060] font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Ask</span>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] border border-dashed border-[#2b303c] rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-[#14161b]/50">
                <div className="w-16 h-16 rounded-full bg-[#1e2128] border border-[#323743] flex items-center justify-center text-[#ffd56b] mb-4">
                  <Sparkles className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Kundli Generated Yet</h3>
                <p className="text-sm text-[#9ca3af] max-w-sm">
                  Fill in your date of birth, time of birth, and place of birth on the left to render your North Indian Vedic birth chart and planetary table.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <BottomNavBar />
    </div>
  );
}
