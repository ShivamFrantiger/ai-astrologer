"use client";

import { Button } from "@/components/ui/button";
import { Gem } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";


interface SubscriptionCardProps {
  translations: {
    title: string;
    subtitle: string;
    button: string;
  };
}

export function SubscriptionCard({ translations }: SubscriptionCardProps) {
  return (
    <Link href="/subscription" passHref>
      <motion.div
       whileHover={{ scale: 1.02 }}
        className="rounded-2xl p-8 text-center bg-gradient-to-r from-[#4d3b16] via-[#2d220e] to-[#4d3b16] text-white cursor-pointer"
      >
        <h3 className="text-2xl font-bold mb-2">{translations.title}</h3>
        <p className="text-gray-300 mb-6">
          {translations.subtitle}
        </p>
        <Button className="bg-[#FFC249] text-black hover:bg-[#FFC249]/90 rounded-full px-8 py-3 text-lg font-bold pointer-events-none">
          {translations.button} <Gem className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </Link>
  );
}
