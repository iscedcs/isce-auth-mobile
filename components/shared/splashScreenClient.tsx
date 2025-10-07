import Image from "next/image";
import React, { useEffect, useState } from "react";
import CountryFlag from "./country-flag";
import { Button } from "../ui/button";
import Link from "next/link";

export default function SplashScreenClient() {
  const cardImages = [
    "/images/_Wallet-card.png",
    "/images/_Wallet-card.png",
    "/images/_Wallet-card.png",
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % cardImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <div className="absolute top-6 right-6">
        <button className="bg-gray-900  border-white rounded-full px-3 py-1 text-white text-xs flex items-center space-x-1 border">
          <CountryFlag />
          <span>EN</span>
        </button>
      </div>
      <div className="relative mb-8 h-[250px] w-[200px]">
        {cardImages.map((src, idx) => {
          // Calculate position and style
          const offset =
            (idx - currentSlide + cardImages.length) % cardImages.length;
          return (
            <Image
              key={idx}
              src={src}
              alt={`Card ${idx + 1}`}
              width={220}
              height={320}
              className={`absolute top-0  bottom-2 left-1/2 -translate-x-1/2 rounded-xl shadow-lg transition-all duration-700 ease-in-out
                      ${
                        offset === 0
                          ? "z-20 rotate-0 scale-100 opacity-100"
                          : ""
                      }
                      ${
                        offset === 1
                          ? "z-10 left-3 -rotate-12 scale-95  -translate-x-[50px]"
                          : ""
                      }
                      ${
                        offset === cardImages.length - 1
                          ? "z-10 right-3 rotate-12 scale-95  -translate-x-[50px]"
                          : ""
                      }
                      ${
                        offset !== 0 &&
                        offset !== 1 &&
                        offset !== cardImages.length - 1
                          ? "opacity-0"
                          : ""
                      }
                    `}
            />
          );
        })}
      </div>

      <h1 className="text-4xl font-bold mb-4 py-5 text-center text-white">
        Elevate your digital <br /> lifestyle with one tap.
      </h1>

      <Button variant="default" asChild>
        <Link href="/login">Login</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/sign-up">Get Started</Link>
      </Button>
      <p className="text-gray-400 text-sm text-center">
        By logging in or registering, you agree to our{" "}
        <span>Terms of service</span> and <span>Privacy policy.</span>
      </p>
      {/* Progress Dots */}
      {/* <div className="absolute bottom-8 flex space-x-2">
        {cardImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              currentSlide === idx ? "bg-white" : "bg-gray-500"
            }`}
          />
        ))}
      </div> */}
    </div>
  );
}
