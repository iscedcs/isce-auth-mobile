"use client";

import { useState } from "react";
import { AuthService } from "@/lib/auth-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getRedirect } from "@/lib/auth-flow";

import { FaRegEye } from "react-icons/fa";
import { LuEyeClosed } from "react-icons/lu";
import { MdEmail } from "react-icons/md";
import { BiRename } from "react-icons/bi";
import { FaPhoneAlt } from "react-icons/fa";
import { MdOutlinePassword } from "react-icons/md";
import Link from "next/link";

export default function QuickRegisterForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

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

    const response = await AuthService.quickRegister({
      firstName,
      lastName,
      email,
      phone,
      password,
    });

    setLoading(false);

    if (!response.success) {
      toast.error(response.message);
      return;
    }

    toast.success("Account created successfully");

    router.push(`/sign-in?redirect=${encodeURIComponent(getRedirect())}`);
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
          href={`/sign-in?redirect=${encodeURIComponent(getRedirect())}`}
          className="text-primary hover:underline font-medium">
          Login
        </Link>
      </div>
    </div>
  );
}
