"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import TargetCursor from "./targetCursor/TargetCursor";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

import Footer from "./Footer";


export default function ContactPage() {
  const { translations } = useLanguage();
  const t = translations.contact;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    service: "",
    message: "",
  });

  const [status, setStatus] = useState<null | string>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setFormData({ name: "", email: "", service: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setStatus("error");
    }
  }

  useEffect(() => {
    if (status === "success" || status === "error") {
      const timer = setTimeout(() => setStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <>
      <div className="relative">
        {/* 🔥 Custom Cursor */}
        <TargetCursor spinDuration={2} hideDefaultCursor={true} />

        {/* Page Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col lg:flex-row gap-10 lg:gap-12 max-w-7xl mx-auto p-4 sm:p-6 md:p-10"
        >
          {/* Left: Contact Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:w-2/3 w-full bg-[#000] border border-[#3c331d] p-5 sm:p-8 rounded-xl shadow-md space-y-8 sm:space-y-10 mt-10 md:mt-16"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-center text-white">
              {t.form.title}
            </h2>

            {/* Name */}
            <input
              type="text"
              name="name"
              placeholder={t.form.namePlaceholder}
              value={formData.name}
              onChange={handleChange}
              required
              className="cursor-target w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-[#0D0D0D] text-white border border-[#fff] focus:border-[#FFC247] focus:ring-1 focus:ring-[#FFC247] outline-none text-sm sm:text-base"
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder={t.form.emailPlaceholder}
              value={formData.email}
              onChange={handleChange}
              required
              className="cursor-target w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-[#0D0D0D] text-white border border-[#fff] focus:border-[#FFC247] focus:ring-1 focus:ring-[#FFC247] outline-none text-sm sm:text-base"
            />

            {/* Service Dropdown */}
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={handleChange}
              required
              className="cursor-target w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-[#0D0D0D] text-white border border-[#fff] focus:border-[#FFC247] focus:ring-1 focus:ring-[#FFC247] outline-none text-sm sm:text-base"
            >
              <option value="">{t.form.serviceDefault}</option>
              {t.form.serviceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Message */}
            <textarea
              name="message"
              placeholder={t.form.messagePlaceholder}
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              className="cursor-target w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-[#0D0D0D] text-white border border-[#fff] focus:border-[#FFC247] focus:ring-1 focus:ring-[#FFC247] outline-none resize-none text-sm sm:text-base"
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="cursor-target w-full flex items-center justify-center gap-2 py-2 sm:py-3 bg-[#FFC247] text-[#352300] font-semibold rounded-lg hover:bg-[#e6ad35] transition text-sm sm:text-base"
            >
              {status === "loading" ? t.form.sending : t.form.submitButton}
              <Image src="/svg/plane.svg" alt="plane" width={20} height={20} />
            </button>

            {/* Status Messages */}
            {status === "success" && (
              <p className="text-green-500 text-xs sm:text-sm mt-1 text-center">
                {t.form.status.success}
              </p>
            )}
            {status === "error" && (
              <p className="text-red-500 text-xs sm:text-sm mt-1 text-center">
                {t.form.status.error}
              </p>
            )}
          </form>

          {/* Right: Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:w-1/3 w-full space-y-6 text-white mt-10 md:mt-16"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-white text-center">
              {t.direct.title}
            </h2>

            {/* Email */}
            <div className="p-4 rounded-lg shadow">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 text-base sm:text-lg">
                <Image
                  src="/svg/mail.svg"
                  alt="email"
                  width={20}
                  height={20}
                  className="inline cursor-target"
                />
                <span>{t.direct.emailLabel}</span>
                <a
                  href="mailto:cs.jyotix@gmail.com?subject=Feedback on Astrology App&body=Hello Team, I wanted to share my thoughts..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-[#e0ca9e]"
                >
                  cs.jyotix@gmail.com
                </a>
              </div>
            </div>

            {/* Location */}
            <div className="p-4 rounded-lg shadow">
              <h2 className="text-base sm:text-lg font-medium text-white mb-2 text-center">
                {t.direct.location.title}
              </h2>

              <div className="relative w-full max-w-sm mx-auto">
                <Image
                  src="/png/map-image-demo.png"
                  alt="location"
                  width={400}
                  height={300}
                  className="rounded-lg cursor-target w-full object-cover"
                />

                {/* Black Overlay Filter */}
                <div className="absolute inset-0 bg-black/60 rounded-lg pointer-events-none flex flex-col items-center justify-center text-white text-center px-3">
               
                  <p className="text-sm sm:text-base font-semibold italic">
                    {t.direct.location.comingSoon}
                  </p>
                  <p className="text-xs sm:text-sm mt-1">
                    {t.direct.location.address}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>


       {/* Footer */}
      <Footer />
    </>
  );
}
