"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

interface SuccessStepProps {
  onLogin: () => void;
}

export function SuccessStep({ onLogin }: SuccessStepProps) {
  return (
    <div className="p-8 space-y-6 text-center">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-40 h-40 flex items-center justify-center">
          <Image
            src="/images/checked.png"
            alt="Forgot Password Icon"
            width={100}
            height={100}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Password Reset Successful
        </h2>
        <p className="text-gray-400 text-sm">
          You have successfully set a new password for your account
        </p>
      </div>

      {/* Login Button */}
      <Button
        onClick={onLogin}
        className="w-full bg-white hover:bg-gray-100 text-black py-3 rounded-lg font-medium">
        Login
      </Button>
    </div>
  );
}
