"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpiralIcon } from "@/components/shared/spiral-icon";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email: fd.get("email"),
        password: fd.get("password"),
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials — try again.");
        toast.error("Authentication failed");
      } else {
        toast.success("Ikuzo — let's go!");
        router.push("/");
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <SpiralIcon size={52} className="text-[#F97316]" />
          <div className="text-center">
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#A1A6AD] mb-1">忍</p>
            <h1 className="text-2xl font-black font-[var(--font-archivo)] text-[#F5F6F7] tracking-tight">
              SHINOBI
            </h1>
            <p className="text-xs text-[#6B7076] mt-0.5">Training · Private</p>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#A1A6AD] text-xs uppercase tracking-wider">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] placeholder:text-[#6B7076] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#A1A6AD] text-xs uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] placeholder:text-[#6B7076] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7076] hover:text-[#A1A6AD]"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#E63946] text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-[#F97316] hover:bg-[#EA6B10] text-[#0D0D0F] font-bold h-11"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <SpiralIcon size={16} className="spiral-spin" />
                  Authenticating…
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {process.env.NEXT_PUBLIC_SINGLE_USER !== "true" && (
            <p className="text-center text-xs text-[#6B7076] mt-4">
              New?{" "}
              <a href="/register" className="text-[#F97316] hover:underline">
                Create account
              </a>
            </p>
          )}
        </div>

        <p className="text-center text-[10px] text-[#6B7076] mt-6">
          saate… only shinobi may enter
        </p>
      </div>
    </div>
  );
}
