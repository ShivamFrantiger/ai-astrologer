
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Languages, LogOut, User as UserIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";

const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  const names = name.split(" ");
  if (names.length > 1) {
    return names[0][0] + names[names.length - 1][0];
  }
  return name.substring(0, 2);
};

export function NavBar() {
  const [open, setOpen] = React.useState(false);
  const { user } = useAuth();
  const { translations, language, setLanguage } = useLanguage();

  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await auth.signOut();
    router.push("/");
    router.refresh();
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push("/profile");
      }
      if (e.key === "b" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push("/subscription");
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [router]);

  const menuItems = [
    { name: translations.nav.Homepage, route: "/" },
    { name: translations.nav.Horoscope, route: "/horoscope" },
    { name: translations.nav["Astrology Services"], route: "/astrology-services" },
    { name: translations.nav["About Us"], route: "/about" },
    { name: translations.nav.Contact, route: "/contact" },
  ];

  const commandItems = [
    {
      name: translations.command.dailyHoroscope,
      route: "/horoscope",
      icon: <Calendar className="text-blue-500" />,
    },
    {
      name: translations.command.astrologyServices,
      route: "/astrology-services",
      icon: <Smile className="text-yellow-500" />,
    },
    {
      name: translations.command.aboutUs,
      route: "/about",
      icon: <User className="text-green-500" />,
    },
    {
      name: translations.command.contact,
      route: "/contact",
      icon: <Settings className="text-purple-500" />,
    },
  ];

  return (
    <header className="hidden md:flex w-full shadow-sm z-50 bg-black">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2 w-full">
        {/* LOGO */}
        <Link href="/" className="flex items-center flex-shrink-0">
          <Image src="/png/brandLogo.png" alt="logo" width={60} height={60} />
        </Link>

        {/* DESKTOP NAVIGATION */}
        <div className="flex-1 min-w-0 flex justify-center px-4">
          <NavigationMenu
            viewport={false}
            className="hidden md:block"
          >
            <NavigationMenuList className="flex items-center space-x-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.route;
                return (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink
                      asChild
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link
                        href={item.route}
                        className={`transition-colors bg-transparent whitespace-nowrap ${
                          isActive ? "text-[#FFD700] font-semibold" : "text-white"
                        }`}
                      >
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        {/* SEARCH, LANGUAGE, + AUTH */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 text-white hover:opacity-80 transition hover:cursor-pointer"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-gray-400" />
            <Select
              value={language}
              onValueChange={(value) =>
                setLanguage(value as "en" | "hi" | "ur")
              }
            >
              <SelectTrigger className="bg-transparent border-none text-white w-[100px] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black text-white border-gray-700">
                <SelectItem value="en" className="cursor-pointer">English</SelectItem>
                <SelectItem value="hi" className="cursor-pointer">Hindi</SelectItem>
                <SelectItem value="ur" className="cursor-pointer">Urdu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Auth */}
          {!user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-white hover:underline"
              >
                {translations.auth.login}
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-white hover:underline"
              >
                {translations.auth.signup}
              </Link>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none">
                  <Avatar className="h-9 w-9 border-2 border-transparent hover:border-[#FFD700] transition-colors">
                    <AvatarImage src={user.photoURL || ''} />
                    <AvatarFallback className="bg-gray-700">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-black text-white border-gray-700 w-48" align="end">
                 <DropdownMenuItem className="cursor-pointer hover:!bg-gray-800" asChild>
                   <Link href="/profile" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span>{translations.profile.sidebar.profile}</span>
                   </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-400 cursor-pointer hover:!bg-gray-800 hover:!text-red-400 flex items-center gap-2">
                   <LogOut className="h-4 w-4" />
                   <span>{translations.auth.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* COMMAND DIALOG */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="bg-black text-white"
      >
        <CommandInput placeholder={translations.command.placeholder} />
        <CommandList>
          <CommandEmpty>{translations.command.noResults}</CommandEmpty>
          <CommandGroup heading={translations.command.services}>
            {commandItems.map((item) => (
              <CommandItem
                key={item.name}
                onSelect={() => {
                  router.push(item.route);
                  setOpen(false);
                }}
              >
                {item.icon}
                <span className="hover:cursor-pointer hover:underline">
                  {item.name}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={translations.command.account}>
            <CommandItem
              onSelect={() => {
                router.push("/profile");
                setOpen(false);
              }}
            >
              <User className="text-gray-500" />
              <span className="hover:cursor-pointer hover:underline">
                {translations.command.profile}
              </span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                router.push("/subscription");
                setOpen(false);
              }}
            >
              <CreditCard className="text-pink-500" />
              <span className="hover:cursor-pointer hover:underline">
                {translations.command.billing}
              </span>
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}
