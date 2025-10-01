
"use client";

import Footer  from "@/components/Footer";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const NavBar = dynamic(() => import("@/components/NavBar").then(mod => mod.NavBar), {
  ssr: false,
});
const BottomNavBar = dynamic(() => import("@/components/BottomNavBar").then(mod => mod.BottomNavBar), {
  ssr: false,
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function AstrologyServices() {
  const { translations } = useLanguage();
  const t = translations.astroServices;
  const { user } = useAuth();
  const router = useRouter();

  const handleRedirect = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push("/signup");
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-[#0d0d0d] text-[#f8f8f8]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <NavBar />

      <article className="relative w-full h-[25vh] sm:h-[35vh] md:h-[40vh] lg:h-[45vh] overflow-hidden font-[family-name:var(--font-cormorant-garamond)]">
        <Image
          src="/png/astroService-herosection.png"
          alt="Galaxy background"
          fill
          className="object-cover object-[center_top]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center px-4 text-center font-[var(--font-cormorant-garamond)]">
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white/75 leading-snug">
            {t.heroTitle}
          </h2>
        </div>
      </article>

      <section className="w-full py-12 sm:py-16 md:py-20 font-[var(--font-cormorant-garamond)] font-[family-name:var(--font-cormorant-garamond)]">
        <h2 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-12">
          {t.sectionTitle}
        </h2>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-6 lg:px-16"
        >
          {t.services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: i * 0.15,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="bg-[#1e2128] p-6 rounded-xl text-center flex flex-col items-center"
            >
              <Image
                src={service.icon}
                alt={service.title}
                width={54}
                height={54}
                className="mt-2"
              />
              <h3 className="mt-6 text-xl sm:text-2xl font-semibold">
                {service.title}
              </h3>
              <p className="mt-4 text-[#f3f4f6b0] text-base sm:text-lg leading-relaxed">
                {service.desc}
              </p>
              <a href="https://chat-bot-astrology.vercel.app/chat" onClick={handleRedirect} className="w-full">
                <button className="mt-6 w-full sm:w-[80%] lg:w-[70%] px-6 py-3 rounded-2xl border-2 border-[#323743] bg-black text-white font-semibold hover:bg-[#1a1a1a] hover:cursor-pointer transition">
                  {service.button}
                </button>
              </a>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="mt-16 rounded-xl p-6 sm:p-10"
        >
          <h1 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold mb-8">
            {t.faqTitle}
          </h1>

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
                className="border-b border-[#262a33] last:border-b-0 px-2"
              >
                <AccordionTrigger className="cursor-pointer flex justify-between items-center text-lg sm:text-xl font-semibold text-white hover:text-[#f5d27a] transition">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent asChild>
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="text-sm sm:text-base leading-relaxed text-[#d1d5db] mt-2"
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

      <Footer />
      <BottomNavBar />
    </motion.div>
  );
}
