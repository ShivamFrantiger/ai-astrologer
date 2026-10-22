"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { KundliCard } from '@/components/chat/KundliCard';
import { RevaDialpadInput } from '@/components/chat/RevaDialpadInput';
import { NormalizedKundli } from '@/lib/kundli/types';
import { getServiceById } from '@/lib/chat/services';
import {
  ArrowUp,
  Sparkles,
  User,
  Plus,
  ArrowLeft,
  BookOpen,
  ChevronRight,
  MoreVertical,
  Pencil,
  Check,
  RotateCcw,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

interface MessageItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  type?: 'text' | 'kundli_card' | 'dialpad';
  kundliData?: NormalizedKundli;
  quickReplies?: string[];
  chartFactors?: string[];
  sources?: Array<{
    title: string;
    source: string;
    author?: string;
    chapter?: string;
    section?: string;
    page?: number | string;
    category: string;
    score: number;
    snippet: string;
    isCustomBook?: boolean;
  }>;
  isDetail?: boolean;
  showDisclaimer?: boolean;
  timestamp?: string;
  createdAt: string;
}

interface ServiceChatViewProps {
  serviceKey: string;
  onBack?: () => void;
}

export function ServiceChatView({ serviceKey, onBack }: ServiceChatViewProps) {
  const { user } = useAuth();
  const service = getServiceById(serviceKey);

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTypingBubble, setIsTypingBubble] = useState(false);
  const [activeKundliId, setActiveKundliId] = useState<string | null>(null);
  const [activeKundli, setActiveKundli] = useState<NormalizedKundli | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<
    Array<{ id: string; label: string; kundli: NormalizedKundli }>
  >([]);
  const [pendingBirth, setPendingBirth] = useState<any>(null);
  const [showDialpad, setShowDialpad] = useState(false);
  const [hasShownDisclaimer, setHasShownDisclaimer] = useState(false);
  const lastUserQuestionRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    handleResize();
    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isTypingBubble, showDialpad]);

  const getCurrentTimeFormatted = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minStr} ${ampm}`;
  };

  // Initialize Reva chat
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      if (!user?.uid) {
        // Initial onboarding matching Image 1
        if (isMounted) {
          setMessages([
            {
              id: `welcome-1`,
              sender: 'bot',
              text: `Hi${user?.displayName ? `, ${user.displayName}` : '!'}`,
              type: 'text',
              timestamp: getCurrentTimeFormatted(),
              createdAt: new Date().toISOString(),
            },
            {
              id: `welcome-2`,
              sender: 'bot',
              text: `I need a few details to build your kundali`,
              type: 'text',
              timestamp: getCurrentTimeFormatted(),
              createdAt: new Date().toISOString(),
            },
            {
              id: `welcome-3`,
              sender: 'bot',
              text: `When were you born?`,
              type: 'text',
              timestamp: getCurrentTimeFormatted(),
              createdAt: new Date().toISOString(),
            },
          ]);
          setShowDialpad(true);
        }
        return;
      }

      try {
        const kundlisRef = collection(db, 'users', user.uid, 'kundlis');
        const snap = await getDocs(query(kundlisRef, limit(10)));
        if (!snap.empty && isMounted) {
          const list: Array<{ id: string; label: string; kundli: NormalizedKundli }> = [];
          snap.forEach((d) => {
            const data = d.data() as NormalizedKundli;
            list.push({ id: d.id, label: data.label || 'Self', kundli: data });
          });
          setSavedProfiles(list);

          const first = list[0];
          setActiveKundliId(first.id);
          setActiveKundli(first.kundli);
          setShowDialpad(false);

          setMessages([
            {
              id: `welcome-saved-${Date.now()}`,
              sender: 'bot',
              text: `Swagat hai! Aapki saved Kundli (${first.label} • ${first.kundli.ascendant.sign} Lagna, ${first.kundli.moonSign} Rashi) active hai.`,
              type: 'kundli_card',
              kundliData: first.kundli,
              timestamp: getCurrentTimeFormatted(),
              createdAt: new Date().toISOString(),
            },
            {
              id: `welcome-saved-followup-${Date.now()}`,
              sender: 'bot',
              text: `${service.title} ke sambandh mein aap kya jaan na chahte hain?`,
              type: 'text',
              quickReplies: service.quickQuestions.slice(0, 3),
              timestamp: getCurrentTimeFormatted(),
              createdAt: new Date().toISOString(),
            },
          ]);
        } else if (isMounted) {
          setMessages([
            {
              id: `welcome-new-1`,
              sender: 'bot',
              text: `Hi${user?.displayName ? `, ${user.displayName}` : '!'}`,
              type: 'text',
              timestamp: getCurrentTimeFormatted(),
              createdAt: new Date().toISOString(),
            },
            {
              id: `welcome-new-2`,
              sender: 'bot',
              text: `I need a few details to build your kundali`,
              type: 'text',
              timestamp: getCurrentTimeFormatted(),
              createdAt: new Date().toISOString(),
            },
            {
              id: `welcome-new-3`,
              sender: 'bot',
              text: `When were you born?`,
              type: 'text',
              timestamp: getCurrentTimeFormatted(),
              createdAt: new Date().toISOString(),
            },
          ]);
          setShowDialpad(true);
        }
      } catch (e) {
        console.warn('Error loading saved kundlis:', e);
        if (isMounted) {
          setShowDialpad(true);
        }
      }
    }

    initChat();

    return () => {
      isMounted = false;
    };
  }, [user, serviceKey]);

  // Handle direct dialpad submission
  const handleDialpadSubmit = async (details: {
    name?: string;
    date: string;
    time: string;
    place: string;
    isApproximateTime: boolean;
  }) => {
    setShowDialpad(false);

    // Add user message matching Image 1
    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: details.name ? `My name is ${details.name}` : `Date of Birth: ${details.date}, Time: ${details.time}, Place: ${details.place}`,
      type: 'text',
      timestamp: getCurrentTimeFormatted(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDirectBirthSubmit: true,
          birthDetails: {
            date: details.date,
            time: details.time,
            place: details.place,
            label: details.name || 'Self',
            isApproximateTime: details.isApproximateTime,
          },
          userId: user?.uid || 'guest',
          serviceId: service.key,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.kundli) {
        setActiveKundli(data.kundli);
        setActiveKundliId(data.activeKundliId || 'active');

        // Render Kundli Chart Card message with download button
        setMessages((prev) => [
          ...prev,
          {
            id: `kundli-card-${Date.now()}`,
            sender: 'bot',
            text: `Aapki Janam Kundli taiyar ho gayi hai (${data.kundli.ascendant.sign} Lagna, ${data.kundli.moonSign} Rashi).`,
            type: 'kundli_card',
            kundliData: data.kundli,
            timestamp: getCurrentTimeFormatted(),
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      // Add bot bubbles with delay
      const bubblesToRender: string[] =
        Array.isArray(data.bubbles) && data.bubbles.length > 0
          ? data.bubbles
          : [data.reply || 'Aapki Kundli ban chuki hai.'];

      for (let i = 0; i < bubblesToRender.length; i++) {
        setIsTypingBubble(true);
        await new Promise((r) => setTimeout(r, 380));
        setIsTypingBubble(false);

        const isLast = i === bubblesToRender.length - 1;
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-b-${Date.now()}-${i}`,
            sender: 'bot',
            text: bubblesToRender[i],
            type: 'text',
            quickReplies: isLast ? data.quickReplies : undefined,
            chartFactors: isLast ? data.chartFactors : undefined,
            sources: isLast ? data.sources : undefined,
            timestamp: getCurrentTimeFormatted(),
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `Kshama karein, chart banate samay samasya aayi: ${err.message}`,
          type: 'text',
          timestamp: getCurrentTimeFormatted(),
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSendMessage = async (customText?: string, isDetailFlag?: boolean) => {
    let textToSend = (customText || inputText).trim();
    if (!textToSend && !isDetailFlag) return;
    if (isLoading || isTypingBubble) return;

    if (isDetailFlag || /detail\s+me(in)?\s+batao/i.test(textToSend)) {
      if (!textToSend || /detail\s+me(in)?\s+batao/i.test(textToSend)) {
        textToSend = lastUserQuestionRef.current || 'Detail mein batao';
      }
    } else {
      lastUserQuestionRef.current = textToSend;
    }

    if (showDialpad) {
      setShowDialpad(false);
    }

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      type: 'text',
      timestamp: getCurrentTimeFormatted(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          userId: user?.uid || 'guest',
          serviceId: service.key,
          activeKundliId,
          activeKundli,
          pendingBirth,
          chatHistory: messages.map((m) => ({ sender: m.sender, text: m.text })),
          detail: isDetailFlag,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error occurred');
      }

      setIsLoading(false);

      if (data.kundli) {
        const isNewKundli = !activeKundli || data.messageType === 'kundli_card';
        setActiveKundli(data.kundli);
        if (data.activeKundliId) setActiveKundliId(data.activeKundliId);

        if (isNewKundli) {
          setMessages((prev) => [
            ...prev,
            {
              id: `kundli-card-${Date.now()}`,
              sender: 'bot',
              text: `Aapki Janam Kundli taiyar ho gayi hai (${data.kundli.ascendant.sign} Lagna, ${data.kundli.moonSign} Rashi).`,
              type: 'kundli_card',
              kundliData: data.kundli,
              timestamp: getCurrentTimeFormatted(),
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      }

      setPendingBirth(data.pendingBirth || null);

      const bubblesToRender: string[] =
        Array.isArray(data.bubbles) && data.bubbles.length > 0
          ? data.bubbles
          : [data.reply || 'Mujhe samajhne me dikkat aayi.'];

      const shouldShowDisclaimer = !hasShownDisclaimer && (data.topic || data.kundli || activeKundli);
      if (shouldShowDisclaimer) {
        setHasShownDisclaimer(true);
      }

      for (let i = 0; i < bubblesToRender.length; i++) {
        setIsTypingBubble(true);
        await new Promise((resolve) => setTimeout(resolve, 380));
        setIsTypingBubble(false);

        const isLastBubble = i === bubblesToRender.length - 1;

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}-${i}`,
            sender: 'bot',
            text: bubblesToRender[i],
            type: 'text',
            quickReplies: isLastBubble ? data.quickReplies : undefined,
            chartFactors: isLastBubble ? data.chartFactors : undefined,
            sources: isLastBubble && Array.isArray(data.sources) && data.sources.length > 0 ? data.sources : undefined,
            isDetail: isLastBubble ? data.isDetail : undefined,
            showDisclaimer: i === 0 && shouldShowDisclaimer,
            timestamp: getCurrentTimeFormatted(),
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setIsLoading(false);
      setIsTypingBubble(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `Error: ${err.message || 'Kripya thodi der me koshish karein.'}`,
          type: 'text',
          timestamp: getCurrentTimeFormatted(),
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSelectProfile = (profile: { id: string; label: string; kundli: NormalizedKundli }) => {
    setActiveKundliId(profile.id);
    setActiveKundli(profile.kundli);
    setShowDialpad(false);
    setMessages((prev) => [
      ...prev,
      {
        id: `sw-${Date.now()}`,
        sender: 'bot',
        text: `Active profile: ${profile.label} (${profile.kundli.ascendant.sign} Lagna, ${profile.kundli.moonSign} Rashi).`,
        type: 'kundli_card',
        kundliData: profile.kundli,
        timestamp: getCurrentTimeFormatted(),
        createdAt: new Date().toISOString(),
      },
      {
        id: `sw-q-${Date.now()}`,
        sender: 'bot',
        text: `${service.title} ke baare mein aapka kya sawaal hai?`,
        type: 'text',
        quickReplies: service.quickQuestions.slice(0, 3),
        timestamp: getCurrentTimeFormatted(),
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div
      className="h-full w-full flex flex-col bg-gradient-to-b from-[#f5efe6] via-[#eee4d5] to-[#e4d8c5] overflow-hidden relative"
      style={{
        height: viewportHeight ? `${viewportHeight}px` : '100%',
        maxHeight: viewportHeight ? `${viewportHeight}px` : '100%',
      }}
    >
      {/* Jyotix Header Bar - Full width with clean responsive container */}
      <div className="w-full border-b border-[#e2d5c2] shrink-0 z-10 bg-[#f5efe6]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 hover:bg-black/5 rounded-full transition text-gray-700 cursor-pointer"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="relative">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-[#d4af37] overflow-hidden bg-amber-100 flex items-center justify-center shadow-xs">
                <Image
                  src="/png/reva_astrologer.jpg"
                  alt="Jyotix Astrologer"
                  width={44}
                  height={44}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Jyotix</h2>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium">Your AI Astrologer</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/subscription"
              className="px-3.5 py-1.5 bg-[#16181f] hover:bg-black text-white text-xs font-semibold rounded-full shadow-sm transition"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </div>

      {/* Saved Profiles Pill Bar (if profiles exist) */}
      {savedProfiles.length > 0 && (
        <div className="w-full bg-[#ebe0d0] border-b border-[#ded2c0] shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-1.5 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[10px] sm:text-[11px] text-gray-600 font-semibold uppercase">Profile:</span>
            {savedProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectProfile(p)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  p.id === activeKundliId
                    ? 'bg-[#1b1c22] text-white shadow-xs'
                    : 'bg-white/70 text-gray-700 hover:bg-white'
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => {
                setActiveKundli(null);
                setActiveKundliId(null);
                setShowDialpad(true);
              }}
              className="text-xs text-[#8c6d32] hover:underline font-semibold flex items-center gap-1 ml-auto"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
        </div>
      )}

      {/* Chat Stream View - min-h-0 ensures only messages scroll and bottom bar stays fixed */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 w-full touch-pan-y overscroll-y-contain [scrollbar-width:thin] [scrollbar-color:#dfbe8c_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#dfbe8c] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#c8a56f] [&::-webkit-scrollbar-track]:bg-transparent"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-3.5">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* User Message Bubble matching Image 1 & 2 */}
                {m.sender === 'user' ? (
                  <div className="max-w-[85%] bg-[#dfbe8c] text-[#2d2214] font-medium px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs text-xs sm:text-[13px] leading-relaxed flex items-center gap-2">
                    <Pencil className="w-3 h-3 text-[#7d5f30] shrink-0" />
                    <span>{m.text}</span>
                    <span className="text-[10px] text-[#7d5f30] font-normal ml-1 shrink-0 flex items-center gap-0.5">
                      {m.timestamp || '7:25 pm'}
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  </div>
                ) : m.type === 'kundli_card' && m.kundliData ? (
                  <div className="w-full">
                    <KundliCard kundli={m.kundliData} />
                  </div>
                ) : (
                  /* Bot Message Bubble matching Image 1 & 2 */
                  <div className="max-w-[88%] space-y-1">
                    <div className="bg-white text-[#2a2a2a] px-4 py-3 rounded-2xl rounded-tl-xs shadow-xs text-xs sm:text-[13px] leading-relaxed">
                      <p className="whitespace-pre-line">{m.text}</p>
                      <div className="text-right text-[10px] text-gray-400 mt-1 font-light">
                        {m.timestamp || '7:25 pm'}
                      </div>
                    </div>

                    {/* Verified Astrology Book & Shastra References */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="w-full mt-1 px-3 py-2 bg-white/90 border border-[#e2d5c2] rounded-xl text-xs shadow-xs">
                        <details className="group cursor-pointer">
                          <summary className="text-[#8c6d32] font-semibold flex items-center justify-between hover:underline list-none select-none text-[11px]">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>
                                {m.sources.some((s) => s.isCustomBook)
                                  ? '📖 Astrology Book Reference'
                                  : '📜 Classical Shastra Reference'}
                              </span>
                            </span>
                            <span className="text-[10px] text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="mt-2 space-y-1.5 text-gray-600 text-[11px]">
                            {m.sources.map((src, idx) => (
                              <div key={idx} className="p-2 bg-[#faf7f2] rounded-lg border border-[#e8ded0]">
                                <div className="font-semibold text-gray-800 flex items-center justify-between">
                                  <span>{src.source || src.title}</span>
                                  {src.page && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-[#dfbe8c]/30 text-[#6a4f20] font-bold rounded">
                                      Page {src.page}
                                    </span>
                                  )}
                                </div>
                                {src.chapter && (
                                  <div className="text-[10px] text-gray-500">Chapter: {src.chapter}</div>
                                )}
                                <div className="text-[10px] text-gray-600 line-clamp-2 mt-1 italic">
                                  &quot;{src.snippet}&quot;
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Reva Quick Suggestion Card with Chevron '>' matching Image 2 */}
                    {m.quickReplies && m.quickReplies.length > 0 && (
                      <div className="mt-2 bg-white rounded-2xl p-1 shadow-xs border border-[#e8ded0] divide-y divide-[#f2ebe0]">
                        {m.quickReplies.map((qr) => (
                          <button
                            key={qr}
                            onClick={() => {
                              if (/detail\s+me(in)?\s+batao/i.test(qr)) {
                                handleSendMessage('Detail mein batao', true);
                              } else {
                                handleSendMessage(qr);
                              }
                            }}
                            disabled={isLoading || isTypingBubble}
                            className="w-full px-3 py-2.5 text-left text-xs font-medium text-gray-800 hover:bg-[#faf7f2] transition flex items-center justify-between cursor-pointer first:rounded-t-xl last:rounded-b-xl disabled:opacity-50"
                          >
                            <span>{qr}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Animated Typing Indicator - Active during API call (isLoading) or bubble pacing (isTypingBubble) */}
            {(isLoading || isTypingBubble) && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 bg-white text-gray-700 px-4 py-2.5 rounded-2xl rounded-tl-xs shadow-xs text-xs max-w-[210px] border border-[#e8ded0]"
              >
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-[#d4af37] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[11px] text-gray-500 font-medium">Jyotix is typing...</span>
              </motion.div>
            )}

            {/* Interactive Dialpad Onboarding Sheet matching Image 1 */}
            {showDialpad && (
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-medium text-gray-500">Birth Details Dialpad</span>
                  <button
                    type="button"
                    onClick={() => setShowDialpad(false)}
                    className="text-[11px] text-[#8c6d32] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Or type details in chat</span>
                    <ArrowUp className="w-3 h-3 rotate-45" />
                  </button>
                </div>
                <RevaDialpadInput onComplete={handleDialpadSubmit} initialName={user?.displayName || ''} />
              </div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Bar - Permanently pinned at bottom */}
      <div
        className="w-full px-3 py-2.5 sm:px-4 sm:py-3.5 bg-[#e4d8c5] border-t border-[#ded3c2] shrink-0 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 10px)' }}
      >
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-white rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-md border border-[#e2d5c2]"
          >
            <input
              type="text"
              placeholder="Write your own question or birth details..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 250);
              }}
              disabled={isLoading || isTypingBubble}
              className="flex-1 bg-transparent text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1b1c20] hover:bg-black text-white flex items-center justify-center transition shadow-xs disabled:opacity-30 cursor-pointer shrink-0"
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
