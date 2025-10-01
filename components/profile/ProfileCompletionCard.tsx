
"use client";

import { useState, useEffect } from "react";
import type { User } from "firebase/auth";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

interface ProfileCompletionCardProps {
  user: User;
  translations: {
    title: string;
    exploreTitle: string; // New translation key for the dynamic title
    completeButton: string;
    exploreButton: string;
    status: string;
    tasks: {
      name: string;
      horoscope: string;
      service: string;
      checkHoroscope: string;
    };
  };
}

export function ProfileCompletionCard({
  user,
  translations,
}: ProfileCompletionCardProps) {
  const [completion, setCompletion] = useState({
    hasName: false,
    hasHoroscope: false,
    hasAvailedService: false,
    hasCheckedHoroscope: false,
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      let completedTasks = 0;
      const totalTasks = 4;

      // 1. Check for Display Name
      const hasName = !!user.displayName;
      if (hasName) completedTasks++;

      // 2. Check for Horoscope from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      const hasHoroscope = docSnap.exists() && !!docSnap.data().horoscope;
      if (hasHoroscope) completedTasks++;

      // 3. Service Avail (static for now)
      const hasAvailedService = false;
      
      // 4. Check Horoscope (static for now)
      const hasCheckedHoroscope = false;


      setCompletion({
        hasName,
        hasHoroscope,
        hasAvailedService,
        hasCheckedHoroscope,
      });
      setProgress((completedTasks / totalTasks) * 100);
    };

    checkProfileCompletion();
  }, [user]);

  const tasks = [
    { label: translations.tasks.name, completed: completion.hasName },
    {
      label: translations.tasks.horoscope,
      completed: completion.hasHoroscope,
    },
    {
      label: translations.tasks.service,
      completed: completion.hasAvailedService,
    },
    {
      label: translations.tasks.checkHoroscope,
      completed: completion.hasCheckedHoroscope,
    },
  ];

  const onlyServicesLeft =
    completion.hasName &&
    completion.hasHoroscope &&
    !completion.hasAvailedService &&
    !completion.hasCheckedHoroscope;

  const cardTitle = onlyServicesLeft
    ? translations.exploreTitle
    : translations.title;
  const buttonText = onlyServicesLeft
    ? translations.exploreButton
    : translations.completeButton;
  const buttonLink = onlyServicesLeft ? "/astrology-services" : "/profile/settings";


  return (
    <div className="bg-[#1e2128] rounded-2xl p-6 h-full flex flex-col">
      <h3 className="text-lg font-bold text-white mb-2">
        {cardTitle}
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        {translations.status}: {Math.round(progress)}%
      </p>

      <Progress
        value={progress}
        className="w-full h-2 bg-gray-700 mb-4"
        indicatorClassName="bg-[#FFC249]"
      />

      <ul className="space-y-2 mb-6 flex-grow">
        {tasks.map((task) => (
          <li key={task.label} className="flex items-center text-sm">
            {task.completed ? (
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 mr-2 text-red-500" />
            )}
            <span
              className={
                task.completed ? "text-gray-400 line-through" : "text-white"
              }
            >
              {task.label}
            </span>
          </li>
        ))}
      </ul>

      {progress < 100 && (
        <Link href={buttonLink} className="mt-auto">
          <Button className="w-full bg-[#FFC249] text-black hover:bg-[#FFC249]/90 rounded-full px-6 transition-all">
            {buttonText}
          </Button>
        </Link>
      )}
    </div>
  );
}
