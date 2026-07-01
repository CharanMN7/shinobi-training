import { SpiralIcon } from "@/components/shared/spiral-icon";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0D0D0F] flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <SpiralIcon size={64} className="text-[#2A2D31] mx-auto mb-6" />
        <h1 className="text-2xl font-black font-[var(--font-archivo)] text-[#F5F6F7] uppercase tracking-tight">
          Off the grid
        </h1>
        <p className="text-[#A1A6AD] text-sm mt-2 leading-relaxed">
          You're off the grid, shinobi — reconnect to sync.
        </p>
        <p className="text-[#6B7076] text-xs mt-4 italic">
          Your cached data is available. New entries require connection.
        </p>
      </div>
    </div>
  );
}
