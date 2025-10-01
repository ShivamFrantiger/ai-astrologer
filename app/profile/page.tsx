
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Footer  from "@/components/Footer";
import { Sidebar } from "@/components/profile/Sidebar";
import { UserCard } from "@/components/profile/UserCard";
import { DailyHoroscopeCard } from "@/components/profile/DailyHoroscopeCard";
import { SubscriptionCard } from "@/components/profile/SubscriptionCard";
import { ProfileCompletionCard } from "@/components/profile/ProfileCompletionCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { translations } = useLanguage();
  const t = translations.profile;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);


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
      <Sidebar translations={t.sidebar} />
      <div className="flex flex-1 flex-col">
        <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-2xl sm:text-3xl font-bold text-white mb-8"
          >
            {t.dashboardTitle}
          </motion.h1>

          <div className="space-y-6">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
              >
                <UserCard user={user} translations={t.userCard} />
              </motion.div>
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
              >
                <DailyHoroscopeCard user={user} translations={t.horoscopeCard} allSigns={translations.horoscope.signs} />
              </motion.div>
            </div>

            {/* Second Row */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
            >
              <SubscriptionCard translations={t.subscriptionCard} />
            </motion.div>

            {/* Third Row */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
            >
              <ProfileCompletionCard user={user} translations={t.profileCompletionCard} />
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
