"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import CountryFlag from "./country-flag";

export default function SplashScreenClient() {
  const cardImages = [
    "/images/BROWN.png",
    "/images/GREEN.png",
    "/images/PuURPLE.png",
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setCurrent((p) => (p + 1) % cardImages.length),
      4000
    );
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-dvh w-full bg-black text-white overflow-hidden">
      {/* Language pill */}
      <div className="absolute right-4 top-4 md:right-6 md:top-6 z-30">
        <button className="flex items-center gap-1 rounded-full border border-white/60 bg-black/50 backdrop-blur px-3 py-2 text-[11px] leading-none">
          <CountryFlag />
          <span className="tracking-wide">EN</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            className="opacity-80">
            <path
              d="M7 10l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-between px-4 pb-8 pt-16 md:pt-24">
        {/* Card stack + subtle glow */}
        <div className="relative h-[290px] w-[220px] md:h-[320px] md:w-[270px]">
          {/* Softer radial glow */}
          <div
            aria-hidden
            className="absolute inset-0 -bottom-4 left-1/2 z-0 h-[180px] w-[220px] -translate-x-1/2 rounded-full blur-xl
                       bg-[radial-gradient(closest-side,rgba(255,255,255,0.12),rgba(0,0,0,0))]"
          />
          {/* Smaller base plate */}
          <div
            aria-hidden
            className="absolute -bottom-1.5 left-1/2 z-0 h-6 w-44 -translate-x-1/2 rounded-full bg-black/55 shadow-[0_14px_32px_rgba(0,0,0,0.6)]"
          />

          {cardImages.map((src, idx) => {
            const offset =
              (idx - current + cardImages.length) % cardImages.length;

            // Default: center card
            let z = "z-20";
            let transform = "translate-x-[-50%] rotate-0 scale-100 opacity-100";
            // dark, subtle drop shadow (no white glow)
            let extra = "drop-shadow-[0_8px_28px_rgba(0,0,0,0.55)]";

            // Left card
            if (offset === 1) {
              z = "z-10";
              transform =
                "translate-x-[-64%] -rotate-[12deg] scale-[0.96] opacity-95";
              extra = "drop-shadow-[0_6px_22px_rgba(0,0,0,0.45)]";
            }

            // Right card
            if (offset === cardImages.length - 1) {
              z = "z-10";
              transform =
                "translate-x-[-36%] rotate-[12deg] scale-[0.96] opacity-95";
              extra = "drop-shadow-[0_6px_22px_rgba(0,0,0,0.45)]";
            }

            // Hidden (if >3)
            if (
              offset !== 0 &&
              offset !== 1 &&
              offset !== cardImages.length - 1
            ) {
              z = "z-0";
              transform = "translate-x-[-50%] rotate-0 scale-95 opacity-0";
              extra = "";
            }

            return (
              <Image
                key={idx}
                src={src}
                alt={`Card ${idx + 1}`}
                width={200}
                height={300}
                className={[
                  "absolute bottom-0 left-1/2 rounded-2xl",
                  "transition-all duration-700 ease-in-out will-change-transform",
                  z,
                  extra,
                  transform,
                ].join(" ")}
                priority={idx === 0}
              />
            );
          })}
        </div>

        {/* Headline */}
        <h1 className=" max-w-[18ch] text-center text-[32px] md:text-4xl font-extrabold leading-tight tracking-tight">
          Elevate your digital
          <br />
          lifestyle with one tap.
        </h1>

        {/* Actions */}
        <div className="mt-6 w-full space-y-3">
          <Link
            href="/login"
            className="block h-12 w-full rounded-full bg-white text-center font-semibold text-black leading-[48px]">
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="block h-12 w-full rounded-full border border-white/60 text-center font-semibold text-white leading-[48px] bg-transparent">
            Get started
          </Link>
        </div>

        {/* Terms */}
        <p className="mt-4 text-center text-[11px] text-white/70 leading-relaxed">
          By logging in or registering, you agree to our{" "}
          <span className="font-semibold underline underline-offset-2 text-white">
            Terms of service
          </span>{" "}
          and{" "}
          <span className="font-semibold underline underline-offset-2 text-white">
            Privacy policy
          </span>
          .
        </p>
      </div>
    </section>
  );
}
