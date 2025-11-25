"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AuthService } from "@/lib/auth-service";
import { useRouter } from "next/navigation";
import { IoMdArrowBack } from "react-icons/io";
import { Mail } from "lucide-react";
import { SlideTransition } from "@/components/ui/slide-transition";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = email.length > 4 && email.includes("@");

  const handleRequestCode = async () => {
    if (!AuthService.validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);

      const response = await AuthService.requestPasswordReset({ email });

      if (response.success) {
        sessionStorage.setItem("reset_email", email);
        toast.success("A reset code has been sent to your email");

        router.push("/forgot-password/verify");
      } else toast.error(response.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SlideTransition>
      <div className="p-6 h-[100svh] flex flex-col">
        <IoMdArrowBack
          className="w-6 h-6 cursor-pointer active:scale-90 transition"
          onClick={() => router.back()}
        />

        <h1 className="mt-6 text-[24px] font-bold">Forgot your password?</h1>

        <p className="text-gray-400 mt-1 w-[85%]">
          Enter your email and we’ll send you a reset code.
        </p>

        <div className="mt-10 relative">
          <label className="text-[14px] font-medium">Email Address</label>

          <Mail className="absolute right-0 top-[38px] h-5 w-5 text-gray-400" />

          <input
            type="email"
            className="w-full mt-1 p-3 pr-10 bg-black border-b border-gray-700 outline-none focus:border-white transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button
          disabled={!isValid || loading}
          onClick={handleRequestCode}
          className={`mt-auto w-full p-4 rounded-lg font-semibold transition 
            ${
              !isValid
                ? "bg-white/20 text-white/40"
                : "bg-white text-black active:scale-[0.97]"
            }`}>
          {loading ? "Sending..." : "Request code"}
        </button>
      </div>
    </SlideTransition>
  );
}
