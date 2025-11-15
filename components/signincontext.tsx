"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { getSession, signIn, signOut } from "next-auth/react";
import { DesktopSignInForm } from "./forms/auth/desktop/signInDesktopform";
import CountryFlag from "./shared/country-flag";
import { SignInFormData } from "@/schemas/desktop";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { PasswordResetModal } from "./forms/auth/password-reset-modal";

type Props = { callbackUrl: string | null };

export default function SignInClient({ callbackUrl }: Props) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] =
    useState(false);
  const singleProduct = useSearchParams();

  // Carousel State
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

  const prompt = singleProduct.get("prompt") === "login" ? "&prompt=login" : "";
  const signUpHref = callbackUrl
    ? `/sign-up?redirect=${encodeURIComponent(callbackUrl)}${prompt}`
    : `/sign-up${prompt}`;

  useEffect(() => {
    async function maybeForceReauth() {
      if (singleProduct.get("prompt") === "login") {
        const session = await getSession();
        if (session) {
          await signOut({ redirect: false });
        }
      }
    }
    maybeForceReauth();
  }, [singleProduct]);

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    try {
      console.log("Attempting sign in with:", { email: data.email });

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        toast.error("Invalid email or password. Please try again.");
        return;
      }
      if (!result?.ok) {
        toast.error("Sign in failed. Please try again.");
        return;
      }

      if (result?.ok) {
        const session = await getSession();
        console.log("Session after sign in:", session);

        toast.success("Welcome back!");

        const safe = getSafeRedirect(callbackUrl);
        const token = (session as any)?.user?.accessToken;

        if (safe && token) {
          const target = new URL(safe);
          const callback = new URL("/auth/callback", target.origin);
          callback.searchParams.set("token", token);

          const finalPath = target.pathname + target.search + target.hash;
          callback.searchParams.set("redirect", finalPath);

          window.location.href = callback.toString();
          return;
        }
        if ((session as any)?.user?.userType === "business") {
          router.push("/business-dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => setIsPasswordResetModalOpen(true);
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Future implementation for Google OAuth
      console.log("Google sign in - to be implemented");
      toast.info("Google sign-in will be available soon!");
    } catch (error) {
      console.error("Google sign in error:", error);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      // Future implementation for Apple OAuth
      console.log("Apple sign in - to be implemented");
      toast.info("Apple sign-in will be available soon!");
    } catch (error) {
      console.error("Apple sign in error:", error);
      toast.error("Apple sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
              onClick={() => setCurrent(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                current === idx ? "bg-white" : "bg-gray-500"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[60%] justify-center flex flex-col bg-black rounded-r-[12px] text-white">
        <div className="flex justify-between p-6 items-center mb-8">
          <button className="text-2xl font-bold">||</button>
          <p className="text-sm">
            Don’t Have an Account?{" "}
            <Link href={signUpHref} className="text-white font-semibold">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 lg:px-12">
          <div className="max-w-md mx-auto w-full space-y-6">
            <DesktopSignInForm
              onSubmit={handleSignIn}
              onForgotPassword={handleForgotPassword}
              onGoogleSignIn={handleGoogleSignIn}
              onAppleSignIn={handleAppleSignIn}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="p-6 flex justify-end space-x-6 font-medium text-xs text-white">
          <Link
            href="/privacy-policy"
            className="hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/services" className="hover:text-white transition-colors">
            Services
          </Link>
        </div>
      </div>

      <PasswordResetModal
        isOpen={isPasswordResetModalOpen}
        onClose={() => setIsPasswordResetModalOpen(false)}
        onLoginRedirect={() => setIsPasswordResetModalOpen(false)}
      />
    </div>
  );
}
