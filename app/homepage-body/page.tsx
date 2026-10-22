"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Star,
  Compass,
  Heart,
  Briefcase,
  Coins,
  Clock,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { RevaDialpadInput } from '@/components/chat/RevaDialpadInput';

export default function HeroSection() {
  const router = useRouter();
  const [showQuickDialpad, setShowQuickDialpad] = useState(false);

  const handleDialpadComplete = (details: {
    name?: string;
    date: string;
    time: string;
    place: string;
    isApproximateTime: boolean;
  }) => {
    // Redirect to chat with pre-filled birth coordinates
    const query = new URLSearchParams({
      service: 'chat-with-astrologer',
      date: details.date,
      time: details.time,
      place: details.place,
      label: details.name || 'Self',
    }).toString();

    router.push(`/chat?${query}`);
  };

  return (
    <main className="min-h-screen bg-[#090b10] text-gray-100 font-sans selection:bg-[#ffd56b] selection:text-black">
      {/* 🌌 HERO SECTION (Inspired by Image 1 & 4) */}
      <section className="relative pt-8 pb-16 sm:pt-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient Cosmic Gold Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[650px] h-[340px] sm:h-[650px] bg-gradient-to-tr from-[#d4af37]/15 to-[#f59e0b]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-4 relative z-10">
          {/* Top Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1b202c] border border-[#d4af37]/30 text-xs text-[#ffd56b] shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold">Jyotix • Powered by Grur Ji & Classical Shastras</span>
          </motion.div>

          {/* Main Title matching Image 1 */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight font-serif"
          >
            Tell Jyotix your <br className="hidden sm:inline" />
            birth details
            <span className="block text-2xl sm:text-4xl md:text-5xl font-light italic bg-gradient-to-r from-[#ffd56b] via-[#f59e0b] to-[#dfbe8c] bg-clip-text text-transparent mt-1">
              she&apos;ll do the rest
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-sm md:text-base text-gray-400 max-w-xl mx-auto leading-relaxed"
          >
            Instant, mathematically verified Kundli charts, Vimshottari dasha timings, and personalized guidance grounded in authentic Vedic texts and your own astrology book.
          </motion.p>
        </div>

        {/* 📱 Interactive Phone Showcase Frame (Inspired by Image 1 & 2) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 sm:mt-12 max-w-sm sm:max-w-md mx-auto relative z-20"
        >
          {/* Subtle floating 3D Gold Accent Orbs */}
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#ffd56b] opacity-80 blur-xs shadow-2xl hidden sm:block animate-pulse" />
          <div className="absolute -bottom-6 -left-6 w-14 h-14 rounded-full bg-gradient-to-tr from-[#f59e0b] to-[#dfbe8c] opacity-60 blur-xs shadow-2xl hidden sm:block" />

          {/* Phone Shell */}
          <div className="bg-[#181d28] border-4 sm:border-8 border-[#262c3b] rounded-[38px] sm:rounded-[44px] p-2.5 sm:p-3 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-b from-[#f5efe6] via-[#eee4d5] to-[#e4d8c5] rounded-[30px] sm:rounded-[34px] p-4 text-gray-800 space-y-3.5 relative">
              {/* Chat Header inside Phone */}
              <div className="flex items-center justify-between pb-2 border-b border-[#e0d3c0]">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full ring-2 ring-[#d4af37] overflow-hidden bg-amber-100 shadow-xs">
                      <Image
                        src="/png/reva_astrologer.jpg"
                        alt="Jyotix Astrologer"
                        width={36}
                        height={36}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-gray-900 leading-tight">Jyotix</div>
                    <div className="text-[10px] text-gray-500">Your AI Astrologer</div>
                  </div>
                </div>

                <Link
                  href="/chat"
                  className="px-2.5 py-1 bg-[#1a1c22] text-white text-[11px] font-semibold rounded-full shadow-xs hover:bg-black transition"
                >
                  Start Chat
                </Link>
              </div>

              {/* Chat Messages Flow matching Image 1 */}
              <div className="space-y-2 py-1">
                {/* User Bubble */}
                <div className="flex justify-end">
                  <div className="bg-[#dfbe8c] text-[#2c2214] font-medium text-xs px-3 py-1.5 rounded-2xl rounded-tr-xs shadow-xs flex items-center gap-1.5">
                    <span>My name is Debojyoti Roy</span>
                    <span className="text-[9px] text-[#7d5f30]">7:25 pm ✓</span>
                  </div>
                </div>

                {/* Bot Bubbles */}
                <div className="flex flex-col items-start gap-1 max-w-[90%]">
                  <div className="bg-white text-gray-800 text-xs px-3 py-2 rounded-2xl rounded-tl-xs shadow-xs">
                    Hi, Debojyoti Roy
                  </div>
                  <div className="bg-white text-gray-800 text-xs px-3 py-2 rounded-2xl shadow-xs">
                    I need a few details to build your kundali
                  </div>
                  <div className="bg-white text-gray-800 text-xs px-3 py-2 rounded-2xl shadow-xs">
                    When were you born?
                  </div>
                </div>
              </div>

              {/* Interactive Segmented Dialpad Display */}
              <div className="pt-1">
                <RevaDialpadInput onComplete={handleDialpadComplete} initialName="Debojyoti Roy" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 🎟️ SPECIAL OFFERS & CONSULTATION BANNER (Inspired by Image 4) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 my-6">
        <div className="bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#ffd56b] rounded-3xl p-5 sm:p-7 text-black shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="space-y-1.5 text-center sm:text-left z-10">
            <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black/15 px-2.5 py-0.5 rounded-full">
              Ancient Wisdom • Since 1919 Tradition
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              Get Expert Vedic Guidance for just ₹99
            </h2>
            <p className="text-xs sm:text-sm font-medium text-black/80 max-w-md">
              Complete birth chart analysis, planetary dasha timeline, and remedies with Jyotix AI.
            </p>
          </div>

          <Link
            href="/chat"
            className="px-6 py-3 bg-black hover:bg-gray-900 text-[#ffd56b] font-bold text-xs sm:text-sm rounded-full shadow-lg transition transform active:scale-95 shrink-0 z-10 cursor-pointer"
          >
            ConsultJyotix Now
          </Link>
        </div>
      </section>

      {/* 📚 CUSTOM ASTROLOGY BOOK INTEGRATION CARD (Direct Access for User) */}
      {/* 📜 VEDIC KNOWLEDGE TRUST SHOWCASE (User-Facing, No Public Admin Links) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 my-8">
        <div className="bg-[#121622] border-2 border-[#d4af37]/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-[#ffd56b]/15 text-[#ffd56b] shrink-0 border border-[#ffd56b]/30">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#ffd56b]">
                Authentic Shastra Wisdom
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Grounded in Classical Vedic Texts
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 max-w-lg leading-relaxed">
                Jyotix combines Brihat Parashara Hora Shastra, Jaimini Sutras, and classical dasha wisdom with modern AI to provide balanced, insightful, and fear-free astrological guidance.
              </p>
            </div>
          </div>

          <Link
            href="/chat"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#ffd56b] to-[#f59e0b] text-black font-bold text-xs sm:text-sm hover:opacity-90 transition shrink-0 flex items-center gap-2 shadow-md cursor-pointer"
          >
            <span>Consult Jyotix AI</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 🧭 CATEGORIES GRID (Inspired by Image 4) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">Astrology Categories</h2>
            <p className="text-xs text-gray-400">Choose a life focus to consult with Jyotix</p>
          </div>
          <Link href="/astrology-services" className="text-xs text-[#ffd56b] hover:underline font-medium">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { title: 'Kundali', icon: Compass, color: 'text-amber-400', bg: 'bg-amber-400/10', service: 'horoscope-readings' },
            { title: 'Love & Marriage', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-400/10', service: 'love-guidance' },
            { title: 'Career & Karma', icon: Briefcase, color: 'text-sky-400', bg: 'bg-sky-400/10', service: 'career-finance' },
            { title: 'Money & Wealth', icon: Coins, color: 'text-emerald-400', bg: 'bg-emerald-400/10', service: 'career-finance' },
            { title: 'Dasha & Transits', icon: Clock, color: 'text-purple-400', bg: 'bg-purple-400/10', service: 'chat-with-astrologer' },
            { title: 'Vedic Upay', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10', service: 'remedies' },
          ].map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Link
                key={i}
                href={`/astrology-services?service=${cat.service}`}
                className="p-4 rounded-2xl bg-[#131722] border border-[#232b3d] hover:border-[#ffd56b]/60 transition-all flex flex-col items-center text-center gap-2 group cursor-pointer"
              >
                <div className={`p-3 rounded-2xl ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-gray-200 group-hover:text-[#ffd56b] transition">
                  {cat.title}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 🪐 VEDIC ZODIAC MANDALA WHEEL SHOWCASE (Inspired by Image 3) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-[#121622] border border-[#232a3d] rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="w-56 h-56 sm:w-72 sm:h-72 relative shrink-0">
            <div className="absolute inset-0 bg-[#ffd56b]/15 rounded-full blur-2xl animate-pulse" />
            <Image
              src="/png/vedic_zodiac_wheel.jpg"
              alt="Vedic Zodiac Mandala Chart"
              width={300}
              height={300}
              className="w-full h-full object-contain relative z-10 rounded-full shadow-2xl"
            />
          </div>

          <div className="space-y-4 text-center md:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ffd56b]">
              Classical Astrological Precision
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif">
              Exact Planetary Alignments &amp; Whole-Sign Bhavas
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-lg">
              Jyotix calculates your exact Sidereal (Nirayana) planetary longitudes, Vimshottari Mahadasha cycles, and current transits (Gochar) to bring you balanced predictions without fear-mongering.
            </p>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
              <span className="text-[11px] px-3 py-1 bg-[#191f2e] border border-[#2d374d] rounded-full text-gray-300">
                Brihat Parashara Hora Shastra
              </span>
              <span className="text-[11px] px-3 py-1 bg-[#191f2e] border border-[#2d374d] rounded-full text-gray-300">
                Phaladeepika Principles
              </span>
              <span className="text-[11px] px-3 py-1 bg-[#191f2e] border border-[#2d374d] rounded-full text-gray-300">
                Lahiri Ayanamsha
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
