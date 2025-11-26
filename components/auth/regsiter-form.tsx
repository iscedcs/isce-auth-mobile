"use client";

import { useEffect, useState } from "react";
import { AuthService } from "@/lib/auth-service";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { getRedirect } from "@/lib/auth-flow";

import { FaRegEye } from "react-icons/fa";
import { LuEyeClosed } from "react-icons/lu";
import { MdEmail } from "react-icons/md";
import { BiRename } from "react-icons/bi";
import { FaPhoneAlt } from "react-icons/fa";
import { MdOutlinePassword } from "react-icons/md";
import Link from "next/link";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { getSession, signIn } from "next-auth/react";

export default function QuickRegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [redirectURL, setRedirectURL] = useState("/sign-in");
  const sp = useSearchParams();

  // Save redirect during onboarding
  useEffect(() => {
    const safe = getSafeRedirect(sp.get("redirect"));
    if (safe) sessionStorage.setItem("redirect_hint", safe);
  }, [sp]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    const { firstName, lastName, email, phone, password } = form;

    if (!firstName || !lastName || !email || !phone || !password) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.quickRegister({
        firstName,
        lastName,
        email,
        phone,
        password,
      });

      if (!response.success) {
        toast.error(response.message);
        setLoading(false);
        return;
      }
      const signInResult = await signIn("credentials", {
        email: email,
        password: password,
        redirect: false,
      });

      if (signInResult?.ok) {
        const session = await getSession();
        const token = (session as any)?.user?.accessToken;

        const safe = getSafeRedirect(getRedirect());

        setTimeout(() => {
          if (safe && token) {
            const target = new URL(safe);
            const callback = new URL("/auth/callback", target.origin);
            callback.searchParams.set("token", token);

            const finalPath = target.pathname + target.search + target.hash;
            callback.searchParams.set("redirect", finalPath);

            window.location.href = callback.toString();
            return;
          }

          window.location.href = "/";
        }, 1500);

        return;
      }

      const r = getRedirect();
      toast.success("Account created! Please sign in.");
      window.location.href = `/sign-in?redirect=${encodeURIComponent(r)}`;
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto h-[100svh] flex flex-col gap-8">
      <h1 className="text-3xl font-bold mt-4">Get In Quick</h1>

      {/* First Name */}
      <div className="relative">
        <BiRename className="absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] text-white" />
        <input
          type="text"
          placeholder="Enter your preferred firstname"
          className="w-full pl-10 p-3 bg-black placeholder:text-gray-50/15 border-b border-gray-700 outline-none"
          value={form.firstName}
          onChange={(e) => handleChange("firstName", e.target.value)}
        />
      </div>

      {/* Last Name */}
      <div className="relative">
        <BiRename className="absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] text-white" />
        <input
          type="text"
          placeholder="Enter your popular lastname"
          className="w-full pl-10 p-3 bg-black border-b placeholder:text-gray-50/15 border-gray-700 outline-none"
          value={form.lastName}
          onChange={(e) => handleChange("lastName", e.target.value)}
        />
      </div>

      {/* Email */}
      <div className="relative">
        <MdEmail className="absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] text-white" />
        <input
          type="email"
          placeholder="Email Address"
          className="w-full pl-10 p-3 bg-black border-b placeholder:text-gray-50/15 border-gray-700 outline-none"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
      </div>

      {/* Phone */}
      <div className="relative">
        <FaPhoneAlt className="absolute left-0 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-white" />
        <input
          type="tel"
          placeholder="Phone Number"
          className="w-full pl-10 p-3 bg-black border-b placeholder:text-gray-50/15 border-gray-700 outline-none"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
      </div>

      {/* Password */}
      <div className="relative">
        <MdOutlinePassword className="absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[24px] text-white" />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          className="w-full pl-10 pr-10 p-3 bg-black border-b placeholder:text-gray-50/15 border-gray-700 outline-none"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
        />

        {/* Show / Hide Password */}
        {!showPassword ? (
          <FaRegEye
            onClick={() => setShowPassword(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[22px] h-[22px] cursor-pointer"
          />
        ) : (
          <LuEyeClosed
            onClick={() => setShowPassword(false)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[22px] h-[22px] cursor-pointer"
          />
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-auto p-4 bg-white text-black rounded-lg font-semibold disabled:opacity-40">
        {loading ? "Creating account..." : "Register"}
      </button>
      <div className="text-center text-sm text-white/60 mt-3">
        Already have an account?{" "}
        <Link
          href={redirectURL}
          className="text-primary hover:underline font-medium">
          Login
        </Link>
      </div>
    </div>
  );
}
