
"use client";

import Image from "next/image";
import type { User } from "firebase/auth";
import en from "@/locales/en.json"; // Import the english locale to get the base sign names
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DailyHoroscopeCardProps {
  user: User;
  translations: {
    title: string;
    subtitle: string;
    content: string;
  };
  allSigns: { name: string; description: string; icon: string; }[];
}

export function DailyHoroscopeCard({ user, translations, allSigns }: DailyHoroscopeCardProps) {
  const [userSign, setUserSign] = useState("aries"); // Default sign

  useEffect(() => {
    if (user) {
      const fetchUserHoroscope = async () => {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().horoscope) {
          setUserSign(docSnap.data().horoscope);
        }
      };
      fetchUserHoroscope();
    }
  }, [user]);

  const signIndex = en.horoscope.signs.findIndex(
    (sign) => sign.name.toLowerCase() === userSign.toLowerCase()
  );

  const translatedSign = signIndex !== -1 ? allSigns[signIndex] : allSigns[0];

  return (
    <div className="bg-[#473000] rounded-2xl p-6 h-full text-white">
      <h3 className="text-lg font-bold mb-1">{translations.title}</h3>
      <p className="text-sm text-gray-300 mb-4">{translations.subtitle.replace("{sign}", translatedSign.name)}</p>
      <div className="relative w-full h-40 rounded-lg overflow-hidden mb-4">
        <Image
          src="https://picsum.photos/seed/zodiac/600/400"
          alt={translatedSign.name}
          data-ai-hint="zodiac constellation"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <h4 className="text-2xl font-bold text-white drop-shadow-lg">{translatedSign.name}</h4>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-gray-200">
        {translations.content}
      </p>
    </div>
  );
}
