"use client";

import { motion, AnimatePresence } from "framer-motion";

export function SlideStep({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="slide-step"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="w-full h-full">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
