import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CountryFlag from "@/components/shared/country-flag";

interface AuthLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  cardImages: string[];
  currentSlide: number;
  setCurrentSlide: (idx: number) => void;
}

export function AuthLayout({
  children,
  currentStep,
  totalSteps,
  cardImages,
  currentSlide,
  setCurrentSlide,
}: AuthLayoutProps) {
  const searchParams = useSearchParams();

  const redirectParam =
    searchParams.get("callbackUrl") ||
    searchParams.get("redirect") ||
    searchParams.get("returnTo") ||
    searchParams.get("redirect_uri");
  const prompt = searchParams.get("prompt") === "login" ? "&prompt=login" : "";
  const signUpHref = redirectParam
    ? `/sign-in?redirect=${encodeURIComponent(redirectParam)}${prompt}`
    : "/";
  return (
    <div className="h-[100svh] border-6 border-white bg-black flex  overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-center items-center p-8 relative bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] rounded-l-[12px] border-r-8 border-white">
        <div className="absolute top-6 right-6">
          <button className="bg-gray-900  border-white rounded-full px-3 py-1 text-white text-xs flex items-center space-x-1 border">
            <CountryFlag />
            <span>EN</span>
          </button>
        </div>

        {/* Card Stack Carousel */}
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
        <p className="text-gray-400 text-sm text-center">
          ISCE Ecosystem Compromises of Smart ISCE Product to make your daily
          life smooth and stress free
        </p>

        {/* Progress Dots */}
        <div className="absolute bottom-8 flex space-x-2">
          {cardImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                currentSlide === idx ? "bg-white" : "bg-gray-500"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[60%] justify-center flex flex-col bg-black rounded-r-[12px] text-white overflow-y-auto">
        <div className="flex justify-between p-6 items-center mb-8">
          <button className="text-2xl font-bold">||</button>
          <span className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link href={signUpHref} className="text-white underline">
              Login
            </Link>
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 lg:px-12">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">
                Get Started with ISCE Ecosystem
              </h2>

              {/* Progress Bar */}
              <div className="flex items-center justify-center mt-6 mb-8">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index + 1 <= currentStep
                          ? "bg-white"
                          : index + 1 === currentStep + 1
                          ? "bg-gray-400"
                          : "bg-gray-600"
                      }`}
                    />
                    {index < totalSteps - 1 && (
                      <div
                        className={`w-16 h-0.5 ${
                          index + 1 < currentStep ? "bg-white" : "bg-gray-600"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {children}
          </div>
        </div>

        <div className="p-6 flex justify-end space-x-6 font-medium text-xs text-white">
          <Link href="/privacy-policy" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/services" className="hover:text-white">
            Services
          </Link>
        </div>
      </div>
    </div>
  );
}
