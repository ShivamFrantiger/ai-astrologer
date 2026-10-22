"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ServiceChatView } from '@/components/chat/ServiceChatView';

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceKey = searchParams.get('service') || 'chat-with-astrologer';
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateHeight();
    window.visualViewport?.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('scroll', updateHeight);
    window.addEventListener('resize', updateHeight);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('scroll', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 w-full bg-[#f5efe6] flex flex-col font-sans overflow-hidden select-none"
      style={{
        height: viewportHeight ? `${viewportHeight}px` : '100dvh',
        maxHeight: viewportHeight ? `${viewportHeight}px` : '100dvh',
      }}
    >
      <main className="flex-1 min-h-0 w-full h-full overflow-hidden flex flex-col">
        <ServiceChatView
          serviceKey={serviceKey}
          onBack={() => router.push('/')}
        />
      </main>
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
