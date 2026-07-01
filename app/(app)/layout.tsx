import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { SessionProvider } from "next-auth/react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="flex h-full min-h-screen bg-[#0D0D0F]">
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <BottomTabs />
      </div>
    </SessionProvider>
  );
}
