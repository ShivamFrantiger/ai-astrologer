
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Plus, Star, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { GlassmorphicMenu } from "./GlassmorphicMenu";
import { useAuth } from "@/contexts/AuthContext";

export function BottomNavBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/chat", icon: MessageSquare, label: "Jyotix AI" },
    { isCentral: true },
    { href: "/horoscope", icon: Star, label: "Horoscope" },
    { href: user ? "/profile" : "/login", icon: User, label: user ? "Profile" : "Login" },
  ];

  return (
    <>
      <AnimatePresence>
        {menuOpen && <GlassmorphicMenu setMenuOpen={setMenuOpen} />}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 h-18 bg-[#12141a]/95 backdrop-blur-md px-2 py-1.5 z-50 flex justify-around items-center rounded-t-2xl shadow-[0_-4px_25px_rgba(0,0,0,0.6)] border-t border-[#d4af37]/20 md:hidden">
        {navItems.map((item, index) => {
          if (item.isCentral) {
            return (
              <div key={`central-button-${index}`} className="-translate-y-5">
                <motion.button
                  onClick={() => setMenuOpen(!menuOpen)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="bg-gradient-to-tr from-[#d4af37] via-[#f7d774] to-[#fcebb6] text-black rounded-full h-14 w-14 flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.45)] ring-4 ring-[#12141a]"
                  aria-label="Open menu"
                >
                  <motion.div
                    animate={{ rotate: menuOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Plus size={28} className="stroke-[2.5]" />
                  </motion.div>
                </motion.button>
              </div>
            );
          }
          const Icon = item.icon!;
          const isActive = item.href && pathname === item.href;
          return (
            <Link
              href={item.href!}
              key={item.href}
              className={`flex flex-col items-center justify-center w-1/5 py-1 transition-all ${
                isActive ? "text-[#f3cd68] scale-105" : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={21} className={isActive ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className={`text-[11px] mt-1 font-medium ${isActive ? "font-bold text-[#f3cd68]" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
