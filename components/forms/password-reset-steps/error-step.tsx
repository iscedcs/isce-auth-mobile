"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ErrorStepProps {
  onTryAgain: () => void;
  errorMessage?: string;
}

export function ErrorStep({ onTryAgain }: ErrorStepProps) {
  return (
    <div className="p-8 space-y-6 text-center">
      {/* Error Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 flex items-center justify-center">
          <Image
            src="/images/failed.png"
            alt="Forgot Password Icon"
            width={100}
            height={100}
            className="w-full h-full"
          />{" "}
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Password Reset Failed
        </h2>
        <p className="text-gray-400 text-sm">
          Something went wrong while resetting your password
        </p>
      </div>

      {/* Try Again Button */}
      <Button
        onClick={onTryAgain}
        className="w-full bg-white hover:bg-gray-100 text-black py-3 rounded-lg font-medium">
        Try Again
      </Button>
    </div>
  );
}
