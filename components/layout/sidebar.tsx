"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SpiralLogo } from "@/components/shared/spiral-icon";
import {
  LayoutDashboard,
  Dumbbell,
  Scale,
  Wind,
  Star,
  Target,
  Settings,
  LogOut,
  Activity,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard",   label: "Dashboard",  icon: LayoutDashboard, kanji: "総" },
  { href: "/lifts",      label: "Lifts",      icon: Dumbbell,        kanji: "力" },
  { href: "/body",       label: "Body",       icon: Scale,           kanji: "体" },
  { href: "/running",    label: "Running",    icon: Activity,        kanji: "走" },
  { href: "/mobility",   label: "Mobility",   icon: Wind,            kanji: "柔" },
  { href: "/skills",     label: "Skills",     icon: Star,            kanji: "技" },
  { href: "/standards",  label: "Standards",  icon: Target,          kanji: "準" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden md:flex flex-col w-56 shrink-0 h-screen sticky top-0 bg-[#161719] border-r border-[#2A2D31] overflow-y-auto z-30"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="p-4 border-b border-[#2A2D31]">
        <SpiralLogo size={24} />
      </div>

      {/* Nav */}
      <div className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map(({ href, label, icon: Icon, kanji }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-[#F97316] text-[#0D0D0F] shadow-hard-sm"
                  : "text-[#A1A6AD] hover:bg-[#1E2023] hover:text-[#F5F6F7]"
              )}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.5} />
              <span className="flex-1">{label}</span>
              <span
                className={cn(
                  "text-[9px] font-semibold",
                  active ? "text-[#0D0D0F]/60" : "text-[#6B7076]"
                )}
              >
                {kanji}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="p-2 border-t border-[#2A2D31] space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-[#F97316] text-[#0D0D0F]"
              : "text-[#A1A6AD] hover:bg-[#1E2023] hover:text-[#F5F6F7]"
          )}
        >
          <Settings size={16} strokeWidth={1.5} />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#A1A6AD] hover:bg-[#1E2023] hover:text-[#E63946] transition-colors"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
