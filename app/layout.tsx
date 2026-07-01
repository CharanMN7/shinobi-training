import type { Metadata, Viewport } from "next";
import { Inter, Archivo } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Shinobi — Training", template: "%s · Shinobi" },
  description: "Private fitness tracker. Strength, body, running, mobility.",
  applicationName: "Shinobi — Training",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shinobi",
  },
  formatDetection: { telephone: false },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0D0D0F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${archivo.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="h-full antialiased font-[var(--font-inter)]">
        <TooltipProvider delay={300}>
          {children}
          <Toaster
            position="top-center"
            theme="dark"
            toastOptions={{
              classNames: {
                toast: "bg-[#1E2023] border border-[#2A2D31] text-[#F5F6F7]",
                success: "border-[#2F9E44]",
                error: "border-[#E63946]",
              },
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
