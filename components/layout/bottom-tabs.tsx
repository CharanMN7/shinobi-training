"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Dumbbell, Plus, Scale, MoreHorizontal } from "lucide-react";
import { SpiralIcon } from "@/components/shared/spiral-icon";
import { useState } from "react";
import { QuickLogSheet } from "@/components/shared/quick-log-sheet";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/lifts", label: "Lifts",  icon: Dumbbell },
  null, // FAB placeholder
  { href: "/body",  label: "Body",   icon: Scale },
  { href: "/more",  label: "More",   icon: MoreHorizontal },
];

export function BottomTabs() {
  const pathname = usePathname();
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161719] border-t border-[#2A2D31] safe-bottom"
        aria-label="Bottom navigation"
      >
        <div className="flex items-end justify-around h-16 px-2">
          {tabs.map((tab, i) => {
            if (!tab) {
              return (
                <button
                  key="fab"
                  onClick={() => setQuickLogOpen(true)}
                  className="relative -top-5 flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F97316] shadow-hard text-[#0D0D0F] active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F97316]"
                  aria-label="Quick log"
                >
                  <SpiralIcon size={24} className="absolute opacity-30" />
                  <Plus size={22} strokeWidth={2.5} />
                </button>
              );
            }

            const Icon = tab.icon;
            const moreRoutes = ["/mobility", "/skills", "/standards", "/settings", "/more"];
            const active =
              tab.href === "/more"
                ? moreRoutes.some((r) => pathname.startsWith(r))
                : pathname === tab.href || pathname.startsWith(tab.href + "/");

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors min-h-[44px]",
                  active ? "text-[#F97316]" : "text-[#6B7076]"
                )}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span className="text-[9px] font-semibold uppercase tracking-wider">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <QuickLogSheet open={quickLogOpen} onOpenChange={setQuickLogOpen} />
    </>
  );
}
