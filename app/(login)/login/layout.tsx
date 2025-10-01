import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto , Cormorant_Garamond } from "next/font/google";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["400", "700"], 
});


export const metadata: Metadata = {
  title: "Jyotix-Astro - Login",
  description: "Signup for Jyotix-Astro",
};

export default function HoroscopeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${cormorantGaramond.variable} antialiased bg-[#0D0D0D] text-[#f8f8f8]`}
    >
      {children}
    </div>
  );
}
