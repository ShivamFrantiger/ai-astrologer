
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "firebase/auth";
import Link from "next/link";

const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  const names = name.split(" ");
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};

interface UserCardProps {
    user: User;
    translations: {
        greeting: string;
        fallback: string;
        editProfile: string;
    }
}

export function UserCard({ user, translations }: UserCardProps) {
  return (
    <div className="bg-[#1e2128] rounded-2xl p-6 flex flex-col items-center justify-center text-center h-full">
      <Avatar className="w-24 h-24 mb-4 border-2 border-[#FFC249]">
        <AvatarImage
          src={user.photoURL || undefined}
          alt={user.displayName || "User"}
        />
        <AvatarFallback className="text-2xl bg-gray-700 text-white">
          {getInitials(user.displayName)}
        </AvatarFallback>
      </Avatar>
      <h2 className="text-xl font-bold text-white">
        {translations.greeting}, {user.displayName || translations.fallback}!
      </h2>
      <p className="text-gray-400 text-sm mb-6">{user.email}</p>
      <Link href="/profile/settings">
        <Button className="bg-[#FFC249] text-black hover:bg-[#FFC249]/90 rounded-full px-6">
          {translations.editProfile}
        </Button>
      </Link>
    </div>
  );
}
