"use client";

import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function AnimatedLantern({ isHovered = false }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isHovered && (
        <motion.div
          key="sidebar-lantern"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ transformOrigin: "top center" }}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center"
          aria-hidden="true"
        >
          <motion.svg
            width="28"
            height="40"
            viewBox="0 0 28 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transformOrigin: "14px 2px" }}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    rotate: [-7, 7],
                    transition: {
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 1.8,
                      ease: "easeInOut",
                    },
                  }
            }
          >
            <defs>
              {/* Warm golden light glow */}
              <radialGradient
                id="lanternGlow"
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%"
              >
                <stop offset="0%" stopColor="#FDE047" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.7" />
                <stop offset="85%" stopColor="#D97706" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
              </radialGradient>

              {/* Lantern emerald frame gradient */}
              <linearGradient id="emeraldFrame" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#087F5B" />
                <stop offset="100%" stopColor="#064E3B" />
              </linearGradient>

              {/* Drop filter for soft glow */}
              <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Top Hanging Thread & Ring */}
            <line x1="14" y1="0" x2="14" y2="7" stroke="#087F5B" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="14" cy="7" r="1.5" stroke="#E9A23B" strokeWidth="1" fill="#064E3B" />

            {/* Small Top Cap / Dome */}
            <path
              d="M10 9 C10 8, 18 8, 18 9 L19 12 H9 L10 9 Z"
              fill="url(#emeraldFrame)"
              stroke="#087F5B"
              strokeWidth="0.8"
            />
            {/* Golden cap ring */}
            <line x1="9" y1="12" x2="19" y2="12" stroke="#F59E0B" strokeWidth="1.2" />

            {/* Inner Warm Glow Pulse */}
            <circle cx="14" cy="21" r="7.5" fill="url(#lanternGlow)" filter="url(#softGlow)" />

            {/* Lantern Faceted Body */}
            {/* Outer Ribs / Frame */}
            <path
              d="M9 12 L6 19 C5.5 22, 6 25, 9 29 L11 31 H17 L19 29 C22 25, 22.5 22, 22 19 L19 12 Z"
              stroke="#087F5B"
              strokeWidth="1.2"
              fill="none"
              strokeLinejoin="round"
            />

            {/* Center Glass Ribs */}
            <path
              d="M14 12 V31"
              stroke="#087F5B"
              strokeWidth="0.8"
              strokeDasharray="2 1"
              strokeOpacity="0.8"
            />
            <path
              d="M11 12 C10 17, 10 24, 12 31"
              stroke="#087F5B"
              strokeWidth="0.7"
              strokeOpacity="0.6"
            />
            <path
              d="M17 12 C18 17, 18 24, 16 31"
              stroke="#087F5B"
              strokeWidth="0.7"
              strokeOpacity="0.6"
            />

            {/* Inner warm flame core */}
            <path
              d="M14 17 C13 19, 13 22, 14 23 C15 22, 15 19, 14 17 Z"
              fill="#FEF08A"
            />

            {/* Bottom Metallic Base Cap */}
            <path
              d="M11 31 H17 L16 34 H12 L11 31 Z"
              fill="url(#emeraldFrame)"
              stroke="#087F5B"
              strokeWidth="0.8"
            />

            {/* Bottom Decorative Tip / Golden Drop */}
            <path
              d="M14 34 L13 37 L14 39 L15 37 Z"
              fill="#F59E0B"
              stroke="#D97706"
              strokeWidth="0.5"
            />
            <circle cx="14" cy="39.2" r="0.8" fill="#FDE047" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

