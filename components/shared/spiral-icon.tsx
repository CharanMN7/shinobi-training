import { cn } from "@/lib/utils";

interface SpiralIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SpiralIcon({ size = 24, className, style }: SpiralIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={cn(className)}
      style={style}
      aria-hidden="true"
    >
      <path
        d="M20 20
           m0,-13
           a13,13 0 1,1 -0.001,0
           M20 20
           m0,-8
           a8,8 0 1,1 -0.001,0
           M20 20
           m0,-3
           a3,3 0 1,1 -0.001,0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0"
      />
      {/* Custom original spiral — Uzumaki-style but original */}
      <path
        d="M20 7
           C26.5 7 32 12.5 32 19
           C32 25.5 26.5 31 20 31
           C13.5 31 8 25.5 8 19
           C8 12.5 13.5 7 20 7
           M20 11
           C24.4 11 28 14.6 28 19
           C28 23.4 24.4 27 20 27
           C15.6 27 12 23.4 12 19
           C12 14.6 15.6 11 20 11
           M20 15
           C22.2 15 24 16.8 24 19
           C24 21.2 22.2 23 20 23
           C17.8 23 16 21.2 16 19
           M20 19 L26 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function SpiralLogo({ size = 32, className }: SpiralIconProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <SpiralIcon size={size} className="text-[#F97316]" />
      <span
        className="font-black tracking-tight text-[#F5F6F7]"
        style={{ fontFamily: "var(--font-archivo)", fontSize: size * 0.6 }}
      >
        SHINOBI
      </span>
    </div>
  );
}
