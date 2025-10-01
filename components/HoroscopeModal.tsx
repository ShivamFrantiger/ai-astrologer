
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

type HoroscopeDetail = {
  sign: string;
  period: string;
  content: string;
};

interface HoroscopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: HoroscopeDetail | null;
  isLoading: boolean;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, y: -50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: 50,
    scale: 0.95,
    transition: { duration: 0.3, ease: "easeIn" },
  },
};

export function HoroscopeModal({
  isOpen,
  onClose,
  details,
  isLoading,
}: HoroscopeModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative w-11/12 max-w-lg min-h-[250px] rounded-2xl bg-gray-900/50 border border-white/20 p-8 text-white shadow-2xl shadow-black/40 flex flex-col justify-center"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
            {details && (
              <>
                <h2 className="text-3xl font-bold font-[family-name:var(--font-cormorant-garamond)] text-[#FFC249]">
                  {details.sign}
                </h2>
                <p className="text-lg text-gray-300 mb-4">{details.period}</p>
                <div className="h-px bg-white/20 my-4"></div>

                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[#FFC249] [animation-delay:-0.3s]"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[#FFC249] [animation-delay:-0.15s]"></div>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[#FFC249]"></div>
                  </div>
                ) : (
                  <p className="text-base leading-relaxed text-gray-200">
                    {details.content}
                  </p>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
