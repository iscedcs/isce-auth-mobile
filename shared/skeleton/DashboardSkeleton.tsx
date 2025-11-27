"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />

          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>

        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Welcome text */}
      <div className="space-y-3 mb-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-6 border border-white/10 rounded-xl bg-white/5 backdrop-blur-md animate-pulse">
            <Skeleton className="w-10 h-10 mb-4 rounded-md" />
            <Skeleton className="h-4 w-36 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-10">
        <Skeleton className="mx-auto h-4 w-48" />
      </div>
    </div>
  );
}
