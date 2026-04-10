"use client";

import { useState, useEffect } from "react";
import { useSuperAdmin } from "@/hooks/use-superadmin";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  CreditCard,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Overview",
    href: "/superadmin",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/superadmin/users",
    icon: Users,
  },
  {
    label: "Devices",
    href: "/superadmin/devices",
    icon: CreditCard,
  },
  {
    label: "Settings",
    href: "/superadmin/settings",
    icon: Settings,
  },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useSuperAdmin();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/sign-in?prompt=login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="w-10 h-10 text-white/40 animate-pulse" />
          <p className="text-white/40 text-sm">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white/50 hover:text-white/80 transition text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          {/* Close button — mobile only */}
          <button
            title="close menu"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-white/50 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm">Super Admin</p>
            <p className="text-xs text-white/40 truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/superadmin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                isActive
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/95 backdrop-blur-sm">
        <button
          title="Open menu"
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" />
          <span className="font-semibold text-sm">Super Admin</span>
        </div>
      </div>

      <div className="flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
						fixed lg:sticky top-0 left-0 z-50 lg:z-auto
						h-screen w-64 border-r border-white/10 flex flex-col p-4 shrink-0
						bg-black lg:bg-transparent
						transition-transform duration-200 ease-in-out
						${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
					`}
        >
          {sidebarContent}
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
