
"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutGrid,
  Settings,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  translations: {
    profile: string;
    horoscope: string;
    settings: string;
    logout: string;
  };
}

export function Sidebar({ translations }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/");
  };

  const navItems = [
    { name: translations.profile, href: "/profile", icon: UserIcon },
    { name: translations.horoscope, href: "/horoscope", icon: LayoutGrid },
  ];

  if (!user) return null;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-black text-white p-4 sticky top-0 h-screen">
      <div className="flex-shrink-0 mb-8">
        <Link href="/" className="flex items-center">
          <Image src="/png/brandLogo.png" alt="logo" width={100} height={100} />
        </Link>
      </div>

      <nav className="flex-1 flex flex-col justify-between">
        <ul className="space-y-2">
          {navItems.map((item, index) => (
            <motion.li
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  pathname === item.href
                    ? "bg-[#1e2128] text-white"
                    : "hover:bg-[#1e2128] text-gray-400"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            </motion.li>
          ))}
        </ul>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              href="/profile/settings"
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                pathname === "/profile/settings"
                  ? "bg-[#1e2128] text-white"
                  : "hover:bg-[#1e2128] text-gray-400"
              }`}
            >
              <Settings className="h-5 w-5" />
              <span>{translations.settings}</span>
            </Link>
          </motion.div>
          <motion.button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full p-3 mt-2 rounded-lg bg-[#ED7375] text-white font-semibold hover:bg-opacity-90 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-5 w-5" />
            <span>{translations.logout}</span>
          </motion.button>
        </div>
      </nav>
    </aside>
  );
}
