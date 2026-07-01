import { SpiralLogo } from "@/components/shared/spiral-icon";
import { auth } from "@/src/lib/auth";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export async function Header({ title, subtitle }: HeaderProps) {
  const session = await auth();
  const name = (session?.user as { displayName?: string })?.displayName ?? session?.user?.email ?? "Shinobi";

  return (
    <header className="headband-plate sticky top-0 z-20 px-4 h-14 flex items-center justify-between md:hidden">
      <SpiralLogo size={20} />
      <div className="flex flex-col items-end">
        {title ? (
          <>
            <span className="text-xs font-black font-[var(--font-archivo)] text-[#F5F6F7] uppercase tracking-wider">
              {title}
            </span>
            {subtitle && (
              <span className="text-[10px] text-[#6B7076]">{subtitle}</span>
            )}
          </>
        ) : (
          <span className="text-xs text-[#A1A6AD]">{name}</span>
        )}
      </div>
    </header>
  );
}

export function DesktopPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-black font-[var(--font-archivo)] text-[#F5F6F7] uppercase tracking-tight">
        {title}
      </h1>
      {subtitle && <p className="text-sm text-[#A1A6AD] mt-0.5">{subtitle}</p>}
    </div>
  );
}
