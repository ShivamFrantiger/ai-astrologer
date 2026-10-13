"use client";

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ServiceChatView } from '@/components/chat/ServiceChatView';

const NavBar = dynamic(() => import('@/components/NavBar').then((mod) => mod.NavBar), {
  ssr: false,
});
const BottomNavBar = dynamic(() => import('@/components/BottomNavBar').then((mod) => mod.BottomNavBar), {
  ssr: false,
});

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceKey = searchParams.get('service') || 'chat-with-astrologer';

  return (
    <div className="min-h-screen bg-[#0b0d11] text-[#f8f8f8] flex flex-col font-sans">
      <NavBar />
      <main className="flex-1 w-full h-[calc(100vh-65px)] overflow-hidden flex flex-col">
        <ServiceChatView
          serviceKey={serviceKey}
          onBack={() => router.push('/astrology-services')}
        />
      </main>
      <BottomNavBar />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0b0d11] flex items-center justify-center text-white">
          <div className="animate-pulse text-[#ffd56b]">Loading Vedic Astrologer Chat...</div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
