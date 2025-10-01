
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

import Footer  from "@/components/Footer";
import { Sidebar } from "@/components/profile/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Helper to get initials from a name
const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  const names = name.split(" ");
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [horoscope, setHoroscope] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const router = useRouter();
  const { language, setLanguage, translations } = useLanguage();
  const t = translations.settings;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (user) {
      setUsername(user.displayName || "");

      const fetchUserHoroscope = async () => {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setHoroscope(docSnap.data().horoscope || "");
        }
      };
      fetchUserHoroscope();
    }
  }, [user, loading, router]);


  const handleUpdate = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
        const updates: { displayName?: string } = {};
        if (username !== user.displayName) {
            updates.displayName = username;
        }

        if (Object.keys(updates).length > 0) {
            await updateProfile(auth.currentUser!, updates);
        }
        
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { horoscope: horoscope }, { merge: true });

        router.push("/profile");

    } catch (e: unknown) {
        console.error("Error updating user:", e);
        setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D0D0D]">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-[#FFC249] border-t-transparent"></div>
      </div>
    );
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: i * 0.1 },
    }),
  };

  return (
    <div className="flex min-h-screen bg-[#0D0D0D]">
      <Sidebar translations={translations.profile.sidebar} />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <Card className="max-w-2xl mx-auto bg-[#1e2128] border-gray-700 text-white">
              <CardHeader>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user?.photoURL || ""} alt="User Avatar" />
                    <AvatarFallback className="text-2xl bg-gray-700">
                      {getInitials(username)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{t.username.label}</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-black border-gray-600 focus:border-[#FFC249] focus:ring-[#FFC249]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horoscope">{t.horoscope.label}</Label>
                  <Select value={horoscope} onValueChange={setHoroscope}>
                    <SelectTrigger className="bg-black border-gray-600 focus:border-[#FFC249]">
                      <SelectValue placeholder={t.horoscope.placeholder} />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white border-gray-700">
                      {translations.horoscope.signs.map((sign) => (
                        <SelectItem
                          key={sign.name}
                          value={sign.name.toLowerCase()}
                          className="hover:bg-gray-800 cursor-pointer"
                        >
                          {sign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">{t.language.label}</Label>
                  <Select
                    value={language}
                    onValueChange={(value) =>
                      setLanguage(value as "en" | "hi" | "ur")
                    }
                  >
                    <SelectTrigger className="bg-black border-gray-600 focus:border-[#FFC249]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black text-white border-gray-700">
                      <SelectItem
                        value="en"
                        className="hover:bg-gray-800 cursor-pointer"
                      >
                        English
                      </SelectItem>
                      <SelectItem
                        value="hi"
                        className="hover:bg-gray-800 cursor-pointer"
                      >
                        Hindi
                      </SelectItem>
                      <SelectItem
                        value="ur"
                        className="hover:bg-gray-800 cursor-pointer"
                      >
                        Urdu
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleUpdate}
                    className="bg-[#FFC249] text-black hover:bg-[#FFC249]/90"
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : t.saveButton}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
