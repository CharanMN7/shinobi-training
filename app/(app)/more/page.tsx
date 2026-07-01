import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Wind, Star, Target, Settings, Activity } from "lucide-react";

const links = [
  { href: "/running",   label: "Running",   icon: Activity, kanji: "走", color: "#2F9E44" },
  { href: "/mobility",  label: "Mobility",  icon: Wind,     kanji: "柔", color: "#F4C20D" },
  { href: "/skills",    label: "Skills",    icon: Star,     kanji: "技", color: "#F97316" },
  { href: "/standards", label: "Standards", icon: Target,   kanji: "準", color: "#3B82F6" },
  { href: "/settings",  label: "Settings",  icon: Settings, kanji: "設", color: "#A1A6AD" },
];

export default function MorePage() {
  return (
    <div className="min-h-screen bg-[#0D0D0F]">
      <Header title="MORE" />
      <div className="px-4 pt-4 pb-safe-nav space-y-2">
        {links.map(({ href, label, icon: Icon, kanji, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 bg-[#161719] border border-[#2A2D31] rounded-2xl active:scale-[0.98] transition-transform"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${color}20` }}
            >
              <Icon size={18} style={{ color }} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#F5F6F7]">{label}</p>
            </div>
            <span className="text-sm text-[#6B7076]">{kanji}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
