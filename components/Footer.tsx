
"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const { translations } = useLanguage();

  return (
    <footer className="cursor-target bg-black text-gray-300">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {/* Logo + tagline */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <Image
              src="/png/brandLogo.png"
              alt="brand logo"
              width={110}
              height={110}
              className="rounded-lg mx-auto md:mx-0"
            />
            <p className="text-xs sm:text-sm text-center md:text-left">
              {translations.footer.tagline}
            </p>

            {/* Socials */}
            <div className="flex justify-center md:justify-start gap-4 mt-4">
              {[
                { href: "#", src: "/svg/facebook.svg", alt: "facebook" },
                { href: "#", src: "/svg/twitter.svg", alt: "twitter" },
                { href: "#", src: "/svg/instagram.svg", alt: "instagram" },
                { href: "#", src: "/svg/linkedin.svg", alt: "linkedin" },
                { href: "#", src: "/svg/youtube.svg", alt: "youtube" },
              ].map((item, idx) => (
                <Link key={idx} href={item.href}>
                  <Image src={item.src} alt={item.alt} width={22} height={22} />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              {translations.footer.quickLinks.title}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/">{translations.footer.quickLinks.homepage}</Link>
              </li>
              <li>
                <Link href="/horoscope">{translations.footer.quickLinks.horoscope}</Link>
              </li>
              <li>
                <Link href="/astrology-services">{translations.footer.quickLinks.services}</Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              {translations.footer.resources.title}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/about">{translations.footer.resources.about}</Link>
              </li>
              <li>
                <Link href="/faq">{translations.footer.resources.faq}</Link>
              </li>
            </ul>
          </div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <h4 className="text-white font-semibold mb-3 text-sm sm:text-base">
              {translations.footer.contact.title}
            </h4>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-white hover:underline"
            >
              <Image
                src="/svg/plane.svg"
                alt="contact"
                width={18}
                height={18}
              />
              {translations.footer.contact.link}
            </Link>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <div className="border-t border-gray-700"></div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500 text-center md:text-left">
          {translations.footer.copyright}
        </div>
      </footer>
  );
}
