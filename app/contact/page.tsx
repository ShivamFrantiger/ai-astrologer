"use client";

import ContactForm from "@/components/ContactForm";
import dynamic from "next/dynamic";

const NavBar = dynamic(() => import("@/components/NavBar").then(mod => mod.NavBar), {
  ssr: false,
});
const BottomNavBar = dynamic(() => import("@/components/BottomNavBar").then(mod => mod.BottomNavBar), {
  ssr: false,
});


export default function ContactUs() {
  return (
    <>
      <NavBar />
      <ContactForm />
      <BottomNavBar />
    </>
  );
}
