"use client";

import { useRouter } from "next/navigation";
import { getRedirect } from "@/lib/auth-flow";
import { SlideTransition } from "@/components/ui/slide-transition";

export default function SuccessResetPage() {
  const router = useRouter();

  return (
    <SlideTransition>
      <div className="p-6 h-[100svh] flex flex-col items-center justify-center text-center">
        <h1 className="text-[28px] font-bold">Password Reset!</h1>
        <p className="text-gray-400 mt-2 w-[80%]">
          Your new password has been saved successfully.
        </p>

        <button
          onClick={() =>
            router.push(
              `/sign-in?redirect=${encodeURIComponent(getRedirect())}`
            )
          }
          className="mt-10 w-full p-4 bg-white text-black rounded-xl font-semibold active:scale-[0.97]">
          Go to Login
        </button>
      </div>
    </SlideTransition>
  );
}
