"use client";

import { useState, useEffect } from "react";
import { IoMdArrowBack } from "react-icons/io";
import { FaRegEye } from "react-icons/fa";
import { LuEyeClosed } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthService } from "@/lib/auth-service";
import { stepGuard } from "@/lib/auth-flow";
import { SlideTransition } from "@/components/ui/slide-transition";

export default function ResetPasswordPage() {
  const router = useRouter();

  const email =
    typeof window !== "undefined"
      ? sessionStorage.getItem("reset_email")
      : null;

  const resetCode =
    typeof window !== "undefined" ? sessionStorage.getItem("reset_code") : null;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    stepGuard(!!resetCode, router, "/forgot-password");
  }, [resetCode]);

  const handleReset = async () => {
    if (!password || !confirm) return toast.error("Both fields are required.");

    if (password !== confirm) return toast.error("Passwords do not match.");

    const response = await AuthService.resetPasswordWithCode(
      resetCode!,
      password
    );

    if (response.success) {
      toast.success("Password reset successful!");
      sessionStorage.removeItem("reset_code");
      sessionStorage.removeItem("reset_email");
      router.push("/forgot-password/success");
    } else toast.error(response.message);
  };

  return (
    <SlideTransition>
      <div className="p-6 h-[100svh] flex flex-col">
        <IoMdArrowBack
          onClick={() => router.push("/forgot-password/verify")}
          className="w-6 h-6 cursor-pointer active:scale-90 transition"
        />

        <h1 className="mt-6 text-[24px] font-bold">Set a new password</h1>

        {/* PASSWORD */}
        <label className="mt-10 text-[14px] font-medium">New Password</label>
        <div className="relative">
          <input
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

        {/* CONFIRM */}
        <label className="mt-6 text-[14px] font-medium">Confirm Password</label>

        <div className="relative">
          <input
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
          disabled={!password || !confirm}
          className="mt-auto w-full p-4 bg-white text-black rounded-xl font-semibold disabled:opacity-40 active:scale-[0.97]">
          Reset Password
        </button>
      </div>
    </SlideTransition>
  );
}
