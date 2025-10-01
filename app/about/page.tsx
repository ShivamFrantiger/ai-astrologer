"use client";

import React from "react";
import Footer  from "@/components/Footer";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import dynamic from "next/dynamic";

const NavBar = dynamic(() => import("@/components/NavBar").then(mod => mod.NavBar), {
  ssr: false,
});
const BottomNavBar = dynamic(() => import("@/components/BottomNavBar").then(mod => mod.BottomNavBar), {
  ssr: false,
});

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.2 },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.25,
    },
  },
};

export default function AboutUs() {
  const { translations } = useLanguage();
  const t = translations.about;

  return (
    <>
      <NavBar />

      {/* Hero Section */}
      <article className="relative w-full h-[60vh] sm:h-[65vh] md:h-[70vh] lg:h-[60vh] xl:h-[65vh] 2xl:h-[70vh] font-[family-name:var(--font-cormorant-garamond)]">
        <Image
          src="/png/about-us-page .png"
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
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold font-serif mt-8 sm:mt-10 md:mt-12 text-white leading-snug"
          >
            {t.heroTitle}
          </motion.h2>
        </div>
      </article>

      {/* Content Section */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 lg:py-28"
      >
        <motion.h1
          variants={fadeUp}
          className="text-center text-3xl sm:text-4xl md:text-5xl font-bold font-[family-name:var(--font-cormorant-garamond)] mb-6 sm:mb-8"
        >
          {t.sectionTitle}
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-center text-base sm:text-lg md:text-xl leading-relaxed text-gray-700 max-w-3xl mx-auto"
        >
          {t.sectionContent}
        </motion.p>
      </motion.section>

      <Footer />
      <BottomNavBar />
    </>
  );
}
