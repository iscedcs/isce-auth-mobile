"use client";

import { useState } from "react";
import { IoMdArrowBack } from "react-icons/io";
import { FaRegEye } from "react-icons/fa";
import { LuEyeClosed } from "react-icons/lu";
import { Mail, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthService } from "@/lib/auth-service";
import { SlideTransition } from "@/components/ui/slide-transition";

type Step = "email" | "verify" | "reset" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");

  // Step 1 — email
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Step 2 — verify
  const [otp, setOtp] = useState("");

  // Step 3 — reset
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const resetCode =
    typeof window !== "undefined"
      ? sessionStorage.getItem("rp_reset_code")
      : null;

  // --- Handlers ---

  const handleSendCode = async () => {
    if (!AuthService.validateEmail(email)) {
      return toast.error("Please enter a valid email address.");
    }
    setEmailLoading(true);
    try {
      const res = await AuthService.requestPasswordReset({ email });
      if (res.success) {
        sessionStorage.setItem("rp_email", email);
        toast.success("A reset code has been sent to your email.");
        setStep("verify");
      } else {
        toast.error(res.message);
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResend = async () => {
    const stored =
      typeof window !== "undefined"
        ? sessionStorage.getItem("rp_email")
        : email;
    const res = await AuthService.requestPasswordReset({
      email: stored ?? email,
    });
    res.success
      ? toast.success("A new reset code has been sent.")
      : toast.error(res.message);
  };

  const handleVerify = () => {
    if (otp.length !== 6) return toast.error("Enter the 6-digit reset code.");
    const validation = AuthService.validateResetCode(otp);
    if (!validation.isValid) return toast.error(validation.issues.join(", "));
    sessionStorage.setItem("rp_reset_code", otp);
    setStep("reset");
  };

  const handleReset = async () => {
    if (!password || !confirm) return toast.error("Both fields are required.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    if (password.length < 8)
      return toast.error("Password must be at least 8 characters.");

    const code =
      typeof window !== "undefined"
        ? sessionStorage.getItem("rp_reset_code")
        : null;
    if (!code) return toast.error("Reset session expired. Please start again.");

    setResetLoading(true);
    try {
      const res = await AuthService.resetPasswordWithCode(code, password);
      if (res.success) {
        sessionStorage.removeItem("rp_reset_code");
        sessionStorage.removeItem("rp_email");
        setStep("success");
      } else {
        toast.error(res.message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SlideTransition>
      <div className="p-6 h-[100svh] flex flex-col">
        {/* ── Step: email ── */}
        {step === "email" && (
          <>
            <IoMdArrowBack
              onClick={() => router.push("/dashboard")}
              className="w-6 h-6 cursor-pointer active:scale-90 transition"
            />

            <h1 className="mt-6 text-[24px] font-bold">Reset password</h1>
            <p className="text-gray-400 mt-1 w-[85%]">
              Enter your email and we'll send you a reset code.
            </p>

            <div className="mt-10 relative">
              <label className="text-[14px] font-medium">Email Address</label>
              <Mail className="absolute right-0 top-[38px] h-5 w-5 text-gray-400" />
              <input
                title="email input"
                type="email"
                className="w-full mt-1 p-3 pr-10 bg-black border-b border-gray-700 outline-none focus:border-white transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              disabled={
                !(email.length > 4 && email.includes("@")) || emailLoading
              }
              onClick={handleSendCode}
              className="mt-auto w-full p-4 rounded-lg font-semibold transition disabled:bg-white/20 disabled:text-white/40 bg-white text-black active:scale-[0.97]"
            >
              {emailLoading ? "Sending..." : "Send reset code"}
            </button>
          </>
        )}

        {/* ── Step: verify ── */}
        {step === "verify" && (
          <>
            <IoMdArrowBack
              onClick={() => setStep("email")}
              className="w-6 h-6 cursor-pointer active:scale-90 transition"
            />

            <h1 className="mt-6 text-[24px] font-bold">Enter reset code</h1>
            <p className="text-gray-400 mt-1">
              Code was sent to <span className="font-semibold">{email}</span>
            </p>

            <input
              title="otp input"
              maxLength={6}
              className="mt-10 p-3 text-center text-[24px] tracking-widest bg-black border-b border-gray-700 outline-none focus:border-white transition"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              onClick={handleVerify}
              disabled={otp.length !== 6}
              className="mt-auto w-full p-4 bg-white text-black rounded-xl font-semibold disabled:opacity-40 active:scale-[0.97]"
            >
              Continue
            </button>

            <button
              onClick={handleResend}
              className="mt-4 w-full text-center text-gray-300 underline active:scale-95"
            >
              Resend code
            </button>
          </>
        )}

        {/* ── Step: reset ── */}
        {step === "reset" && (
          <>
            <IoMdArrowBack
              onClick={() => setStep("verify")}
              className="w-6 h-6 cursor-pointer active:scale-90 transition"
            />

            <h1 className="mt-6 text-[24px] font-bold">Set a new password</h1>

            {/* New Password */}
            <label className="mt-10 text-[14px] font-medium">
              New Password
            </label>
            <div className="relative">
              <input
                title="new password"
                type={showPass ? "text" : "password"}
                className="mt-1 p-3 w-full bg-black border-b border-gray-700 pr-10 outline-none focus:border-white transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {showPass ? (
                <FaRegEye
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 cursor-pointer"
                  onClick={() => setShowPass(false)}
                />
              ) : (
                <LuEyeClosed
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 cursor-pointer"
                  onClick={() => setShowPass(true)}
                />
              )}
            </div>

            {/* Confirm Password */}
            <label className="mt-8 text-[14px] font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <input
                title="confirm password"
                type={showConfirm ? "text" : "password"}
                className="mt-1 p-3 w-full bg-black border-b border-gray-700 pr-10 outline-none focus:border-white transition"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {showConfirm ? (
                <FaRegEye
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 cursor-pointer"
                  onClick={() => setShowConfirm(false)}
                />
              ) : (
                <LuEyeClosed
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 cursor-pointer"
                  onClick={() => setShowConfirm(true)}
                />
              )}
            </div>

            <button
              onClick={handleReset}
              disabled={!password || !confirm || resetLoading}
              className="mt-auto w-full p-4 bg-white text-black rounded-xl font-semibold disabled:opacity-40 active:scale-[0.97]"
            >
              {resetLoading ? "Resetting..." : "Reset password"}
            </button>
          </>
        )}

        {/* ── Step: success ── */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center flex-1 gap-5">
            <CheckCircle className="w-16 h-16 text-green-400" />
            <h1 className="text-[24px] font-bold">Password reset!</h1>
            <p className="text-gray-400 text-center">
              Your password has been updated successfully.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 w-full p-4 bg-white text-black rounded-xl font-semibold active:scale-[0.97]"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </SlideTransition>
  );
}
