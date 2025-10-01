
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Star, Plus, Mail, User } from "lucide-react";
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
    { href: "/horoscope", icon: Star, label: "Horoscope" },
    { isCentral: true },
    { href: "/contact", icon: Mail, label: "Contact" },
    { href: user ? "/profile" : "/login", icon: User, label: user ? "Profile" : "Login" },
  ];

  return (
    <>
      <AnimatePresence>
        {menuOpen && <GlassmorphicMenu setMenuOpen={setMenuOpen} />}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#1e2128]/95 backdrop-blur-sm p-2 z-50 flex justify-around items-center rounded-t-2xl shadow-lg border-t border-gray-700 md:hidden">
        {navItems.map((item, index) => {
          if (item.isCentral) {
            return (
              <div key={`central-button-${index}`} className="-translate-y-6">
                <motion.button
                  onClick={() => setMenuOpen(!menuOpen)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-[#FFC249] text-black rounded-full h-16 w-16 flex items-center justify-center shadow-lg"
                  aria-label="Open menu"
                >
                  <motion.div
                    animate={{ rotate: menuOpen ? 45 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus size={32} />
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
              className={`flex flex-col items-center justify-center w-1/5 transition-colors ${
                isActive ? "text-[#FFC249]" : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
