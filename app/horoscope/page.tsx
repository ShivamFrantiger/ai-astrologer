
"use client";
import { useState } from "react";
import Footer from "@/components/Footer";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import dynamic from "next/dynamic";
import Link from "next/link";
import { HoroscopeModal } from "@/components/HoroscopeModal";
import { generateHoroscope } from "@/ai/flows/generate-horoscope-flow";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const NavBar = dynamic(
  () => import("@/components/NavBar").then((mod) => mod.NavBar),
  {
    ssr: false,
  }
);
const BottomNavBar = dynamic(
  () => import("@/components/BottomNavBar").then((mod) => mod.BottomNavBar),
  {
    ssr: false,
  }
);

type HoroscopeDetail = {
  sign: string;
  period: string;
  content: string;
};

export default function Horoscope() {
  const { translations } = useLanguage();
  const t = translations.horoscope;
  const [activeTab, setActiveTab] = useState(t.tabs[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedHoroscope, setSelectedHoroscope] =
    useState<HoroscopeDetail | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  
  const handleViewHoroscope = async (signName: string) => {
    if (!user) {
      router.push("/signup");
      return;
    }
    // Set initial state for modal before fetching
    setSelectedHoroscope({
      sign: signName,
      period: activeTab,
      content: "", // Clear previous content
    });
    setModalOpen(true);
    setIsGenerating(true);

    try {
      const result = await generateHoroscope({
        sign: signName,
        period: activeTab,
      });
      // Update modal content with the fetched horoscope
      setSelectedHoroscope({
        sign: signName,
        period: activeTab,
        content: result.horoscope,
      });
    } catch (error) {
      console.error("Failed to generate horoscope:", error);
      setSelectedHoroscope({
        sign: signName,
        period: activeTab,
        content: "Could not load horoscope. Please try again later.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePromoClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push('/signup');
    }
  };

  return (
    <>
      <NavBar />

      <div className="min-h-screen flex flex-col items-center px-4 font-[family-name:var(--font-cormorant-garamond)]">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center font-[var(--font-cormorant-garamond)] text-[#FFC249] text-5xl sm:text-6xl mt-8 sm:mt-32 mb-6 leading-tight"
        >
          {t.title}
        </motion.h1>

        {/* Tabs */}
        <motion.ul
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="flex justify-between w-[90%] max-w-3xl bg-[#171a1f] rounded-full py-2 mt-3"
        >
          {t.tabs.map((item, i) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: i * 0.15,
              }}
              viewport={{ once: true }}
              className="flex-1 text-center"
            >
              <button
                onClick={() => setActiveTab(item)}
                className={`w-full px-4 py-2 rounded-2xl transition-colors hover:cursor-pointer ${
                  activeTab === item
                    ? "bg-[#FFC249] text-[#6c4901] font-semibold"
                    : "text-[#bdc1ca]"
                }`}
              >
                {item}
              </button>
            </motion.li>
          ))}
        </motion.ul>

        {/* Horoscope Text */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
          className="mt-6 font-[var(--font-roboto)] text-center max-w-xl text-lg sm:text-2xl"
        >
          {activeTab === t.tabs[0] && <p>{t.tabContent.daily}</p>}
          {activeTab === t.tabs[1] && <p>{t.tabContent.weekly}</p>}
          {activeTab === t.tabs[2] && <p>{t.tabContent.monthly}</p>}
          {activeTab === t.tabs[3] && <p>{t.tabContent.yearly}</p>}
        </motion.div>

        {/* Main Zodiac Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
          viewport={{ once: true }}
          className="relative mt-8 w-[320px] sm:w-[420px] md:w-[520px] lg:w-[600px]"
        >
          <Image
            src="/png/horoscopeNew-img.png"
            alt="Zodiac"
            width={600}
            height={600}
            className=" shadow-lg object-cover w-full h-auto"
          />
        </motion.div>

        {/* Zodiac Grid */}
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-24 font-[var(--font-cormorant-garamond)] text-[#FFC249] text-2xl"
        >
          {t.findSign}
        </motion.h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-16 w-[95%] max-w-6xl pb-0 ">
          {t.signs.map((sign, i) => (
            <motion.div
              key={sign.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                ease: "easeOut",
                delay: i * 0.15,
              }}
              viewport={{ once: true }}
              className="bg-[#1e2128] rounded-2xl p-5 flex flex-col items-center text-center shadow-md hover:shadow-lg transition h-[340px] space-y-3"
            >
              <Image
                src={sign.icon}
                alt={sign.name}
                width={150}
                height={150}
                className="rounded-full"
              />
              <span className="text-lg font-semibold text-[#FFC249]">
                {sign.name}
              </span>
              <p className="text-sm text-[#bdc1ca] line-clamp-2">
                {sign.description}
              </p>
              <button
                onClick={() => handleViewHoroscope(sign.name)}
                className="mt-auto px-5 py-2 text-white rounded-md font-semibold tracking-wide hover:text-[#FFC249] hover:cursor-pointer transition"
              >
                {t.promo.viewHoroscope}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Promo Section above Footer */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="flex flex-col sm:flex-row items-center bg-[#FFC249] px-6 py-6 justify-center gap-4 w-full mt-16 font-[family-name:var(--font-cormorant-garamond)]"
      >
        <p className="text-black font-bold text-center sm:text-left">
          {t.promo.text}
        </p>
        <Link href="/astrology-services" onClick={handlePromoClick}>
          <button className="bg-[#19191F] text-white rounded-3xl px-6 py-3 hover:bg-[#333336] hover:cursor-pointer font-semibold tracking-wide transition">
            {t.promo.button}
          </button>
        </Link>
      </motion.div>

      <Footer />
      <BottomNavBar />

      <HoroscopeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        details={selectedHoroscope}
        isLoading={isGenerating}
      />
    </>
  );
}
