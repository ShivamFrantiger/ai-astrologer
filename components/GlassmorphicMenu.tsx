"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Variants, easeInOut, easeOut } from "framer-motion";
import {
  X,
  Home,
  Star,
  Mail,
  Info,
  CreditCard,
  Languages,
  LogIn,
  UserPlus,
  LogOut,
  Search,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";

interface GlassmorphicMenuProps {
  setMenuOpen: (open: boolean) => void;
}

const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  const names = name.split(" ");
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};

const menuVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: easeInOut },
  },
};

const navListVariants: Variants = {
  hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const navItemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { ease: easeOut },
  },
};

export function GlassmorphicMenu({ setMenuOpen }: GlassmorphicMenuProps) {
  const { translations, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    await auth.signOut();
    setMenuOpen(false);
    router.push("/");
  };

  const menuItems = [
    {
      name: "Jyotix AI Astrologer",
      route: "/chat",
      icon: <Sparkles className="h-5 w-5 text-[#f7d774]" />,
    },
    {
      name: translations.nav.Homepage,
      route: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: translations.nav.Horoscope,
      route: "/horoscope",
      icon: <Star className="h-5 w-5" />,
    },
    {
      name: translations.nav["Astrology Services"],
      route: "/astrology-services",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      name: translations.nav["About Us"],
      route: "/about",
      icon: <Info className="h-5 w-5" />,
    },
    {
      name: translations.nav.Contact,
      route: "/contact",
      icon: <Mail className="h-5 w-5" />,
    },
  ];

  return (
    <motion.div
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/50 backdrop-blur-lg"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setMenuOpen(false);
        }
      }}
    >
      <div className="absolute top-5 right-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen(false)}
          className="text-white"
        >
          <X className="h-8 w-8" />
        </Button>
      </div>

      <motion.div
        variants={navListVariants}
        className="flex flex-col items-center gap-2 text-white w-full max-w-xs"
      >
        {user && (
          <motion.div variants={navItemVariants} className="flex flex-col items-center gap-2 mb-4">
            <Avatar className="h-20 w-20 border-2 border-white/50">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="bg-white/20 text-2xl">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
            <p className="font-bold text-lg">{user.displayName}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </motion.div>
        )}

        <motion.div variants={navItemVariants} className="relative w-full mb-4">
          <Input
            type="text"
            placeholder={translations.command.placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border-white/20 text-white placeholder:text-gray-300 pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
        </motion.div>

        {menuItems.map((item) => (
          <motion.div key={item.name} variants={navItemVariants} className="w-full">
            <Link
              href={item.route}
              className="flex items-center gap-4 text-xl font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors w-full"
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          </motion.div>
        ))}

        <motion.div variants={navItemVariants} className="w-full h-px bg-white/20 my-2" />

        {!user ? (
          <>
            <motion.div variants={navItemVariants} className="w-full">
              <Link href="/login" className="flex items-center gap-4 text-xl font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors w-full">
                <LogIn className="h-5 w-5" />
                <span>{translations.auth.login}</span>
              </Link>
            </motion.div>
            <motion.div variants={navItemVariants} className="w-full">
              <Link href="/signup" className="flex items-center gap-4 text-xl font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors w-full">
                <UserPlus className="h-5 w-5" />
                <span>{translations.auth.signup}</span>
              </Link>
            </motion.div>
          </>
        ) : (
          <motion.div variants={navItemVariants} className="w-full">
            <button onClick={handleSignOut} className="flex items-center gap-4 text-xl font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors w-full">
              <LogOut className="h-5 w-5 text-red-400" />
              <span className="text-red-400">{translations.auth.logout}</span>
            </button>
          </motion.div>
        )}

        <motion.div variants={navItemVariants} className="flex items-center gap-2 mt-4">
          <Languages className="h-5 w-5 text-gray-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en" | "hi" | "ur")}
            className="bg-transparent text-gray-300 border-none focus:ring-0 text-lg"
          >
            <option value="en" className="bg-gray-800 text-white">English</option>
            <option value="hi" className="bg-gray-800 text-white">Hindi</option>
            <option value="ur" className="bg-gray-800 text-white">Urdu</option>
          </select>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
