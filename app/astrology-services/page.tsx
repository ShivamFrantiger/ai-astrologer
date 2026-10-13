"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ServiceChatView } from "@/components/chat/ServiceChatView";

const NavBar = dynamic(() => import("@/components/NavBar").then((mod) => mod.NavBar), {
  ssr: false,
});
const BottomNavBar = dynamic(() => import("@/components/BottomNavBar").then((mod) => mod.BottomNavBar), {
  ssr: false,
});

const SERVICE_KEYS = [
  "chat-with-astrologer",
  "love-guidance",
  "matchmaking",
  "horoscope-readings",
  "career-finance",
  "remedies",
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

function AstrologyServicesContent() {
  const { translations } = useLanguage();
  const t = translations.astroServices;
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceParam = searchParams.get("service");
  const [selectedService, setSelectedService] = useState<string | null>(serviceParam);

  // Sync with URL query parameter
  useEffect(() => {
    if (serviceParam) {
      setSelectedService(serviceParam);
    }
  }, [serviceParam]);

  const handleSelectService = (key: string) => {
    setSelectedService(key);
    router.push(`/astrology-services?service=${key}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToServices = () => {
    setSelectedService(null);
    router.push("/astrology-services", { scroll: false });
  };

  return (
    <motion.div
      className="min-h-screen bg-[#0d0d0d] text-[#f8f8f8] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <NavBar />

      <main className={`flex-1 ${selectedService ? 'w-full h-[calc(100vh-65px)] overflow-hidden flex flex-col' : ''}`}>
        {selectedService ? (
          // Active Service Chat Consultation View (Full Screen)
          <div className="w-full h-full flex flex-col">
            <ServiceChatView
              serviceKey={selectedService}
              onBack={handleBackToServices}
            />
          </div>
        ) : (
          // Services Browse View: Hero + 6 Service Cards + FAQs
          <>
            <article className="relative w-full h-[22vh] sm:h-[30vh] md:h-[36vh] overflow-hidden font-[family-name:var(--font-cormorant-garamond)]">
              <Image
                src="/png/astroService-herosection.png"
                alt="Galaxy background"
                fill
                className="object-cover object-[center_top]"
                priority
              />
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center px-4 text-center">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white/90 leading-snug">
                  {t.heroTitle}
                </h1>
                <p className="mt-2 text-xs sm:text-sm md:text-base text-[#ffd56b]/80 max-w-xl">
                  Select a specialized Vedic consultation to receive personalized birth chart analysis and guidance.
                </p>
              </div>
            </article>

            <section className="w-full py-10 sm:py-14 md:py-16 px-4 sm:px-6 lg:px-16 font-[family-name:var(--font-cormorant-garamond)]">
              <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold mb-10 text-white">
                {t.sectionTitle}
              </h2>

              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.15 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              >
                {t.services.map((service, i) => {
                  const serviceKey = SERVICE_KEYS[i] || "chat-with-astrologer";
                  return (
                    <motion.div
                      key={service.title}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        delay: i * 0.1,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                      className="bg-[#181c25] border border-[#2b3140] hover:border-[#ffd56b]/60 p-6 rounded-2xl text-center flex flex-col items-center justify-between transition-all duration-300 hover:shadow-xl hover:shadow-[#ffd56b]/5 group"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#12151b] border border-[#2b3140] flex items-center justify-center p-3 group-hover:scale-110 transition-transform">
                          <Image
                            src={service.icon}
                            alt={service.title}
                            width={40}
                            height={40}
                          />
                        </div>
                        <h3 className="mt-5 text-xl sm:text-2xl font-bold text-white group-hover:text-[#ffd56b] transition-colors">
                          {service.title}
                        </h3>
                        <p className="mt-3 text-[#d1d5db] text-sm sm:text-base leading-relaxed">
                          {service.desc}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSelectService(serviceKey)}
                        className="mt-6 w-full sm:w-[85%] px-6 py-3 rounded-xl border border-[#ffd56b] bg-[#ffd56b]/10 hover:bg-[#ffd56b] text-[#ffd56b] hover:text-black font-semibold text-sm transition-all duration-200 cursor-pointer shadow"
                      >
                        {service.button || "Chat Now"} ✨
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* FAQs Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="mt-16 bg-[#14171e] border border-[#262c38] rounded-2xl p-6 sm:p-10 max-w-4xl mx-auto"
              >
                <h3 className="text-center text-xl sm:text-3xl font-bold mb-8 text-[#ffd56b]">
                  {t.faqTitle}
                </h3>

                <Accordion
                  type="single"
                  collapsible
                  className="w-full"
                  defaultValue="item-1"
                >
                  {t.faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`item-${i + 1}`}
                      className="border-b border-[#262a33] last:border-b-0 px-2 py-1"
                    >
                      <AccordionTrigger className="cursor-pointer text-left text-base sm:text-lg font-semibold text-white hover:text-[#ffd56b] transition">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent asChild>
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="text-xs sm:text-sm leading-relaxed text-[#9ca3af] mt-2"
                          >
                            <p>{faq.a}</p>
                          </motion.div>
                        </AnimatePresence>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </section>
          </>
        )}
      </main>

      {!selectedService && <Footer />}
      <BottomNavBar />
    </motion.div>
  );
}

export default function AstrologyServices() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-white">
          <div className="animate-pulse text-[#ffd56b]">Loading Astrology Services...</div>
        </div>
      }
    >
      <AstrologyServicesContent />
    </Suspense>
  );
}
