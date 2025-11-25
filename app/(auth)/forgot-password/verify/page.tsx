"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthService } from "@/lib/auth-service";
import { IoMdArrowBack } from "react-icons/io";
import { stepGuard } from "@/lib/auth-flow";
import { SlideTransition } from "@/components/ui/slide-transition";

export default function VerifyResetCodePage() {
  const router = useRouter();
  const email =
    typeof window !== "undefined"
      ? sessionStorage.getItem("reset_email")
      : null;

  const [otp, setOtp] = useState("");

  useEffect(() => {
    stepGuard(!!email, router, "/forgot-password");
  }, [email]);

  const handleVerify = () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit reset code.");
      return;
    }

    const validation = AuthService.validateResetCode(otp);
    if (!validation.isValid) return toast.error(validation.issues.join(", "));

    sessionStorage.setItem("reset_code", otp);
    router.push("/forgot-password/reset");
  };

  const handleResend = async () => {
    const res = await AuthService.requestPasswordReset({ email: email! });
    res.success
      ? toast.success("A new reset code has been sent to your email.")
      : toast.error(res.message);
  };

  return (
    <SlideTransition>
      <div className="p-6 h-[100svh] flex flex-col">
        <IoMdArrowBack
          onClick={() => router.push("/forgot-password")}
          className="w-6 h-6 cursor-pointer active:scale-90 transition"
        />

        <h1 className="mt-6 text-[24px] font-bold">Enter reset code</h1>
        <p className="text-gray-400 mt-1">
          Code was sent to <span className="font-semibold">{email}</span>
        </p>

        <input
          maxLength={6}
          className="mt-10 p-3 text-center text-[24px] tracking-widest bg-black border-b border-gray-700 outline-none focus:border-white transition"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button
          onClick={handleVerify}
          disabled={otp.length !== 6}
          className="mt-auto w-full p-4 bg-white text-black rounded-xl font-semibold disabled:opacity-40 active:scale-[0.97]">
          Continue
        </button>

        <button
          onClick={handleResend}
          className="mt-4 w-full text-center text-gray-300 underline active:scale-95">
          Resend code
        </button>
      </div>
    </SlideTransition>
  );
}
