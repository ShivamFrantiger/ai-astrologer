
"use client";

import Footer  from "@/components/Footer";
import HeroSection from "@/app/homepage-body/page";
import dynamic from "next/dynamic";

const NavBar = dynamic(() => import("@/components/NavBar").then(mod => mod.NavBar), {
  ssr: false,
});
const BottomNavBar = dynamic(() => import("@/components/BottomNavBar").then(mod => mod.BottomNavBar), {
  ssr: false,
});

export default function Home() {
 return (
  <>
  <NavBar />
  <HeroSection />
  <Footer />
  <BottomNavBar />
  </>
 );
}
