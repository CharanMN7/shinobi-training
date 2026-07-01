"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpiralIcon } from "@/components/shared/spiral-icon";
import { registerUser } from "@/src/actions/auth";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerUser({
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        displayName: fd.get("displayName") as string,
      });

      if ("error" in result) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Account created — ikuzo!");
        router.push("/login");
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <SpiralIcon size={52} className="text-[#F97316]" />
          <div className="text-center">
            <h1 className="text-2xl font-black font-[var(--font-archivo)] text-[#F5F6F7] tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-[#6B7076] mt-0.5">Begin your shinobi path</p>
          </div>
        </div>

        <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-[#A1A6AD] text-xs uppercase tracking-wider">
                Display Name
              </Label>
              <Input
                id="displayName"
                name="displayName"
                required
                placeholder="Your name"
                className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] placeholder:text-[#6B7076] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
              />
            </div>

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
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Min 8 chars"
                className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] placeholder:text-[#6B7076] focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
              />
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
                  Creating…
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-[#6B7076] mt-4">
            Already have one?{" "}
            <a href="/login" className="text-[#F97316] hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
