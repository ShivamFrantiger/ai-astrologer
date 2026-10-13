
"use client";

import Image from "next/image";
import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// ✅ Load font at module scope (not inside the function)
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.2 },
  }),
};

export default function HeroSection() {
  const { translations } = useLanguage();
  const t = translations.homepage;
  const [xOffset, setXOffset] = useState({ left: -200, right: 200 });
  const { user } = useAuth();
  const router = useRouter();

  const handleRedirect = (path: string) => (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push("/signup");
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      let offset = 0;
      if (width < 640) offset = 80; // small screens
      else if (width < 1024) offset = 150; // tablets
      else offset = 200; // large screens
      setXOffset({ left: -offset, right: offset });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main className={`${cormorant.className} overflow-x-hidden`}>
      {/* 🌌 Hero Section */}
      <article className="relative w-full h-[60vh] sm:h-[65vh] md:h-[70vh] lg:h-[60vh] xl:h-[65vh] 2xl:h-[70vh]">
        <Image
          src="/png/Galaxy-heroSection.png"
          alt="Galaxy background"
          fill
          className="object-cover object-center"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 text-center pb-16 sm:pb-20 md:pb-24 lg:pb-20 xl:pb-24">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold font-serif mt-8 sm:mt-10 md:mt-12 text-white/65 leading-snug"
          >
            {t.hero.title}
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="mt-2 sm:mt-3 md:mt-4 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-white/70 leading-relaxed"
          >
            {t.hero.subtitle1}
            <br />
            {t.hero.subtitle2}
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <Link
              href="/astrology-services?service=chat-with-astrologer"
              onClick={handleRedirect("/astrology-services?service=chat-with-astrologer")}
            >
              <button className="px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full bg-[#FFC247] text-black font-semibold hover:opacity-90 hover:cursor-pointer transition">
                {t.hero.button1}
              </button>
            </Link>
            <Link href="/horoscope" onClick={handleRedirect("/horoscope")}>
              <button className="px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-full border-2 border-[#FFC247] bg-black text-[#FFC247] font-semibold hover:bg-[#1a1a1a] hover:cursor-pointer transition">
                {t.hero.button2}
              </button>
            </Link>
          </motion.div>
        </div>
      </article>

      {/* 🌟 Features Section */}
      <section className="w-full py-8 sm:py-12 md:py-16 ">
        <motion.div
          className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12 px-4 sm:px-6 lg:px-16 flex-wrap"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {t.features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              custom={i}
              className="flex flex-col items-center text-center w-full sm:w-1/3 max-w-xs"
            >
              <div className="p-4 rounded-full">
                <Image
                  src={feature.icon}
                  alt={feature.title}
                  width={54}
                  height={54}
                />
              </div>
              <p className="mt-4 text-lg font-semibold">{feature.title}</p>
              <p className="mt-2 text-gray-300 text-sm sm:text-base leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Astrology Services Section */}
      <section className="w-full py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-16">
        <h2 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-8 sm:mb-12">
          {t.services.title}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {t.services.items.map((service, i) => {
            const isLeft = i % 2 === 0;
            const serviceKeys = [
              "chat-with-astrologer",
              "horoscope-readings",
              "love-guidance",
              "matchmaking",
              "career-finance",
              "remedies",
            ];
            const targetRoute = `/astrology-services?service=${serviceKeys[i] || "chat-with-astrologer"}`;
            return (
              <motion.div
                key={service.title}
                initial={{
                  x: isLeft ? xOffset.left : xOffset.right,
                  opacity: 0,
                }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 12,
                  delay: i * 0.1,
                }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-[#1e2128] p-4 sm:p-6 rounded-xl text-center flex flex-col items-center"
              >
                <Image
                  src={service.icon}
                  alt={service.title}
                  width={54}
                  height={54}
                  className="mt-2 sm:mt-4"
                />
                <h3 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold">
                  {service.title}
                </h3>
                <p className="mt-2 sm:mt-4 text-[#f3f4f6b0] text-sm sm:text-base leading-relaxed">
                  {service.desc}
                </p>
                <Link href={targetRoute} onClick={handleRedirect(targetRoute)}>
                  <button className="mt-4 sm:mt-6 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border-2 border-[#FFC247] bg-[#1e2128] text-[#FFC247] font-semibold hover:bg-[#1a1a1a] hover:cursor-pointer transition">
                    {t.services.buttonText}
                  </button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
