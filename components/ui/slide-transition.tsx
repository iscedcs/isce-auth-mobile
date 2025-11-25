"use client";

import { AnimatePresence, motion } from "framer-motion";

export function SlideTransition({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={typeof window !== "undefined" ? window.location.pathname : "page"}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="h-full">
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
