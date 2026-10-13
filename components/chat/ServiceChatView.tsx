"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { KundliCard } from '@/components/chat/KundliCard';
import { NormalizedKundli } from '@/lib/kundli/types';
import { getServiceById } from '@/lib/chat/services';
import {
  Send,
  Sparkles,
  User,
  Plus,
  ArrowLeft,
  FlaskConical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

interface MessageItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  type?: 'text' | 'kundli_card';
  kundliData?: NormalizedKundli;
  quickReplies?: string[];
  chartFactors?: string[];
  isDetail?: boolean;
  showDisclaimer?: boolean;
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
  const [hasShownDisclaimer, setHasShownDisclaimer] = useState(false);
  const lastUserQuestionRef = useRef<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isTypingBubble]);

  // Load user's saved kundlis or show warm contextual welcome greeting
  useEffect(() => {
    let isMounted = true;

    async function initChat() {
      if (!user?.uid) {
        // Guest user initial greeting
        if (isMounted) {
          setMessages([
            {
              id: `welcome-${Date.now()}`,
              sender: 'bot',
              text: service.welcomeGreeting,
              type: 'text',
              quickReplies: service.quickQuestions.slice(0, 3),
              createdAt: new Date().toISOString(),
            },
          ]);
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

          setMessages([
            {
              id: `welcome-saved-${Date.now()}`,
              sender: 'bot',
              text: `Swagat hai! Aapki saved Kundli (${first.label} • ${first.kundli.ascendant.sign} Lagna, ${first.kundli.moonSign} Rashi) active hai.`,
              type: 'kundli_card',
              kundliData: first.kundli,
              createdAt: new Date().toISOString(),
            },
            {
              id: `welcome-saved-followup-${Date.now()}`,
              sender: 'bot',
              text: `${service.title} ke sambandh mein aap kya jaan na chahte hain?`,
              type: 'text',
              quickReplies: service.quickQuestions.slice(0, 3),
              createdAt: new Date().toISOString(),
            },
          ]);
        } else if (isMounted) {
          setMessages([
            {
              id: `welcome-new-${Date.now()}`,
              sender: 'bot',
              text: service.welcomeGreeting,
              type: 'text',
              quickReplies: service.quickQuestions.slice(0, 3),
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } catch (e) {
        console.warn('Error loading saved kundlis:', e);
        if (isMounted) {
          setMessages([
            {
              id: `welcome-err-${Date.now()}`,
              sender: 'bot',
              text: service.welcomeGreeting,
              type: 'text',
              quickReplies: service.quickQuestions.slice(0, 3),
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      }
    }

    initChat();

    return () => {
      isMounted = false;
    };
  }, [user, serviceKey]);

  const handleSendMessage = async (customText?: string, isDetailFlag?: boolean) => {
    let textToSend = (customText || inputText).trim();
    if (!textToSend && !isDetailFlag) return;
    if (isLoading || isTypingBubble) return;

    if (isDetailFlag || /detail\s+me(in)?\s+batao/i.test(textToSend)) {
      // If asking for detail, re-ask with the last substantive user question
      if (!textToSend || /detail\s+me(in)?\s+batao/i.test(textToSend)) {
        textToSend = lastUserQuestionRef.current || 'Detail mein batao';
      }
      isDetailFlag = true;
    } else {
      lastUserQuestionRef.current = textToSend;
    }

    const userBubbleText = isDetailFlag && textToSend !== 'Detail mein batao' ? 'Detail mein batao' : textToSend;

    const userMsg: MessageItem = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userBubbleText,
      type: 'text',
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

      // 1. If Kundli Card is returned, display it first
      if (data.kundli) {
        setActiveKundli(data.kundli);
        if (data.activeKundliId) {
          setActiveKundliId(data.activeKundliId);
        }
        setSavedProfiles((prev) => [
          ...prev.filter((p) => p.id !== data.activeKundliId),
          { id: data.activeKundliId || 'active', label: data.kundli.label || 'Self', kundli: data.kundli },
        ]);
      }

      if (data.messageType === 'kundli_card' && data.kundli) {
        setMessages((prev) => [
          ...prev,
          {
            id: `kcard-${Date.now()}`,
            sender: 'bot',
            text: '',
            type: 'kundli_card',
            kundliData: data.kundli,
            createdAt: new Date().toISOString(),
          },
        ]);
      }

      setPendingBirth(data.pendingBirth || null);

      // 2. Sequential Delivery of Bubbles with typing indicator (300-500ms)
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
        // Short realistic typing pause between bubbles (350ms - 450ms)
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
            isDetail: isLastBubble ? data.isDetail : undefined,
            showDisclaimer: i === 0 && shouldShowDisclaimer,
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
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSelectProfile = (profile: { id: string; label: string; kundli: NormalizedKundli }) => {
    setActiveKundliId(profile.id);
    setActiveKundli(profile.kundli);
    setMessages((prev) => [
      ...prev,
      {
        id: `sw-${Date.now()}`,
        sender: 'bot',
        text: `Active profile: ${profile.label} (${profile.kundli.ascendant.sign} Lagna, ${profile.kundli.moonSign} Rashi).`,
        type: 'kundli_card',
        kundliData: profile.kundli,
        createdAt: new Date().toISOString(),
      },
      {
        id: `sw-q-${Date.now()}`,
        sender: 'bot',
        text: `${service.title} ke baare mein aapka kya sawaal hai?`,
        type: 'text',
        quickReplies: service.quickQuestions.slice(0, 3),
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] sm:h-[calc(100vh-75px)] w-full px-2 sm:px-6 py-2 gap-2 sm:gap-3">
      {/* Top Consultation Header */}
      <div className="bg-[#14171e] border border-[#262c38] rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-[#1b1f2a] hover:bg-[#252b3a] text-gray-300 hover:text-white border border-[#2f3646] transition cursor-pointer flex items-center gap-1.5 text-xs"
              title="Back to All Services"
            >
              <ArrowLeft className="w-4 h-4 text-[#ffd56b]" />
              <span className="hidden sm:inline">All Services</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ffd56b]/20 to-[#f59e0b]/10 border border-[#ffd56b]/30 flex items-center justify-center p-2">
            <Image src={service.icon} alt={service.title} width={24} height={24} />
          </div>

          <div>
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{service.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Online Astrologer
              </span>
            </h1>
            <p className="text-[11px] text-[#9ca3af]">
              BPHS Classical Rules • Lahiri Whole-Sign House System
            </p>
          </div>
        </div>

        {/* Profile Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full">
          {savedProfiles.map((p) => {
            const isSelected = p.id === activeKundliId;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectProfile(p)}
                className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#ffd56b] text-black border-[#ffd56b] font-semibold'
                    : 'bg-[#1b1f2a] text-[#e5e7eb] border-[#2f3646] hover:bg-[#252b3a]'
                }`}
              >
                <User className="w-3 h-3" />
                <span>{p.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              setActiveKundliId(null);
              setActiveKundli(null);
              setMessages((prev) => [
                ...prev,
                {
                  id: `new-${Date.now()}`,
                  sender: 'bot',
                  text: `Naye vyakti ki kundli dekhne ke liye, kya aap unka Date of Birth, Time of Birth, aur Place of Birth bata sakte hain?\n(Jaise: 14 May 2000, 6:30 PM, Delhi)`,
                  type: 'text',
                  createdAt: new Date().toISOString(),
                },
              ]);
            }}
            className="text-xs px-2.5 py-1.5 rounded-xl bg-[#1b1f2a] text-[#ffd56b] border border-[#3b4356] hover:bg-[#262c3b] flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Nayi Kundli</span>
          </button>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto bg-[#0e1117] border border-[#222836] rounded-2xl p-3 sm:p-5 space-y-3 shadow-inner">
        <AnimatePresence>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Optional One-time disclaimer right before the first astrology reading */}
              {m.showDisclaimer && (
                <div className="w-full text-center my-1">
                  <span className="inline-block text-[11px] text-gray-500 bg-[#161a22] border border-[#282e3c] px-3 py-1 rounded-full">
                    ⚠️ Ye guidance ke liye hai, final decision ke liye professional salah lein.
                  </span>
                </div>
              )}

              {/* Message Bubble or Kundli Card */}
              {m.type === 'kundli_card' && m.kundliData ? (
                <div className="max-w-full">
                  <KundliCard kundli={m.kundliData} />
                </div>
              ) : (
                <div
                  className={`max-w-[88%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-md ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-[#ffd56b] to-[#f59e0b] text-black font-medium rounded-tr-xs ml-auto'
                      : 'bg-[#181c25] border border-[#2b3140] text-gray-100 rounded-tl-xs whitespace-pre-line'
                  }`}
                >
                  {m.text}
                </div>
              )}

              {/* Collapsible Chart reasons in detail mode */}
              {m.isDetail && m.chartFactors && m.chartFactors.length > 0 && (
                <div className="w-full max-w-[88%] sm:max-w-[75%] mt-1 px-3 py-2 bg-[#141822] border border-[#2b3242] rounded-xl text-xs">
                  <details className="group cursor-pointer">
                    <summary className="text-[#ffd56b] font-medium flex items-center justify-between hover:underline list-none select-none py-0.5">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#ffd56b]" />
                        <span>Chart reasons (Grah & Bhaav sthiti)</span>
                      </span>
                      <span className="text-[10px] text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <ul className="mt-2 pl-4 list-disc space-y-1 text-gray-300 text-[11px]">
                      {m.chartFactors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </details>
                </div>
              )}

              {/* Quick Replies chips below the last bubble */}
              {m.quickReplies && m.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 max-w-[88%] sm:max-w-[75%]">
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
                      className="text-[11px] px-3 py-1 rounded-full bg-[#1b202a] text-[#ffd56b] border border-[#303746] hover:bg-[#262c3b] hover:border-[#ffd56b]/60 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator between bubbles / API wait */}
        {(isLoading || isTypingBubble) && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs text-[#ffd56b] bg-[#181c25] border border-[#2b3140] w-fit px-3.5 py-2 rounded-2xl rounded-tl-xs shadow"
          >
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd56b] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd56b] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd56b] animate-bounce" />
            </div>
            <span className="text-[11px] text-gray-400 ml-1">Jyotix is typing...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested initial questions */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => handleSendMessage('01-01-2000, 12:00 PM, Delhi')}
          disabled={isLoading || isTypingBubble}
          className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <FlaskConical className="w-3 h-3" />
          <span>🧪 Test Demo Chart (01 Jan 2000)</span>
        </button>

        {service.quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading || isTypingBubble}
            className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-[#181c25] text-[#ffd56b] border border-[#2e3544] hover:bg-[#222735] transition cursor-pointer disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="bg-[#14171e] border border-[#262c38] rounded-2xl p-2 flex items-center gap-2 shadow-2xl">
        <Input
          type="text"
          placeholder="Apna sawal likhein ya Janam details batayein (e.g. 14 May 2000, 6:30 PM, Delhi)..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          disabled={isLoading || isTypingBubble}
          className="bg-[#0e1015] border-[#29303d] text-white focus:border-[#ffd56b] h-11 text-xs sm:text-sm"
        />
        <Button
          onClick={() => handleSendMessage()}
          disabled={isLoading || isTypingBubble || !inputText.trim()}
          className="h-11 px-5 bg-gradient-to-r from-[#ffd56b] to-[#f59e0b] text-black font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Bhejein</span>
        </Button>
      </div>
    </div>
  );
}

