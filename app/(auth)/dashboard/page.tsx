"use client";

import { getRedirect } from "@/lib/auth-flow";
import { PRODUCTS } from "@/lib/products";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import {
  Briefcase,
  LogOut,
  ShoppingBag,
  TicketIcon,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { MdBackupTable } from "react-icons/md";
import DashboardSkeleton from "@/shared/skeleton/DashboardSkeleton";

const ICON_MAP: any = {
  contact: MdBackupTable,
  briefcase: Briefcase,
  calendar: TicketIcon,
  "shopping-bag": ShoppingBag,
  wallet: Wallet,
};

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
  });

  const router = useRouter();

  if (status === "loading") {
    return <DashboardSkeleton />;
  }

  if (!session) {
    router.push("/sign-in");
    return null;
  }
  const { user } = session;
  const accessToken = user.accessToken;

  const handleLaunch = (product: any) => {
    if (!product.active) return;

    if (!accessToken) {
      alert("Missing access token. Please login again.");
      router.push("/snig-in");
      return;
    }

    const safe = getSafeRedirect(getRedirect());
    const target = new URL(product.url);

    const callback = new URL("/auth/callback", target.origin);
    callback.searchParams.set("token", accessToken);
    callback.searchParams.set("redirect", safe || "/");

    window.location.href = callback.toString();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image
            width={50}
            height={50}
            src={user.image!}
            alt="Isce Authenticated User"
          />
          <div>
            <p className="font-semibold text-background text-lg">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-white/50">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 border px-3 py-2 rounded-lg border-white/20 hover:bg-white/10 transition">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-3">Welcome back 👋</h1>
      <p className="text-white/60 mb-2">
        You are currently signed in on ISCE Auth.
      </p>
      <p className="text-white/40 mb-8">
        Select a product below to continue using your ISCE account.
      </p>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map((item) => {
          const Icon = ICON_MAP[item.icon];

          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: item.active ? 1.03 : 1 }}
              whileTap={{ scale: item.active ? 0.98 : 1 }}
              onClick={() => handleLaunch(item)}
              className={`p-6 border rounded-xl bg-white/5 backdrop-blur-md cursor-pointer transition group 
                ${
                  item.active
                    ? "border-white/20 hover:border-white/40"
                    : "border-white/10 opacity-40 cursor-not-allowed"
                }
              `}>
              <Icon
                className={`w-10 h-10 mb-4 ${
                  item.active ? "text-white" : "text-white/40"
                }`}
              />

              <p className="font-semibold text-lg">{item.name}</p>
              <p className="text-white/40 text-sm mt-1">
                {item.active
                  ? "Open product"
                  : "Coming soon — not yet available"}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-auto pt-10 text-center text-white/40 text-sm">
        ISCE Digital Concept © {new Date().getFullYear()}
      </div>
    </div>
  );
}
