"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { updateSettings } from "@/src/actions/settings";
import { updateProfile, changePassword } from "@/src/actions/auth";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { SpiralIcon } from "@/components/shared/spiral-icon";
import { LogOut, Download, Smartphone } from "lucide-react";

export function SettingsClient({
  displayName: initialName,
  email,
  goalWeightKg: initialGoal,
  timezone: initialTz,
}: {
  displayName: string;
  email: string;
  goalWeightKg: number;
  timezone: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await updateProfile({ displayName: fd.get("displayName") as string });
      if ("error" in r) toast.error(r.error); else toast.success("Profile updated!");
    });
  }

  function handleSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await updateSettings({
        goalWeightKg: parseFloat(fd.get("goalWeightKg") as string),
        timezone: fd.get("timezone") as string,
      });
      if ("error" in r) toast.error(r.error); else toast.success("Settings saved!");
    });
  }

  function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await changePassword({
        currentPassword: fd.get("currentPassword") as string,
        newPassword: fd.get("newPassword") as string,
      });
      if ("error" in r) toast.error(r.error); else { toast.success("Password changed!"); e.currentTarget.reset(); }
    });
  }

  return (
    <div className="space-y-5">
      {/* Profile */}
      <Section title="Profile" kanji="名">
        <form onSubmit={handleProfile} className="space-y-3">
          <Field label="Display Name">
            <Input name="displayName" defaultValue={initialName} placeholder="Your name" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7]" />
          </Field>
          <Field label="Email">
            <Input value={email} disabled className="bg-[#0D0D0F] border-[#2A2D31] text-[#6B7076]" />
          </Field>
          <SaveButton disabled={isPending} />
        </form>
      </Section>

      <Separator className="bg-[#2A2D31]" />

      {/* Training */}
      <Section title="Training" kanji="訓">
        <form onSubmit={handleSettings} className="space-y-3">
          <Field label="Goal Weight (kg)">
            <Input name="goalWeightKg" type="number" step="0.5" defaultValue={initialGoal} min="30" max="200" required className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7]" />
          </Field>
          <Field label="Timezone">
            <Input name="timezone" defaultValue={initialTz} placeholder="Asia/Kolkata" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7]" />
          </Field>
          <SaveButton disabled={isPending} />
        </form>
      </Section>

      <Separator className="bg-[#2A2D31]" />

      {/* Change Password */}
      <Section title="Change Password" kanji="鍵">
        <form onSubmit={handlePassword} className="space-y-3">
          <Field label="Current Password">
            <Input name="currentPassword" type="password" required className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7]" />
          </Field>
          <Field label="New Password (min 8 chars)">
            <Input name="newPassword" type="password" minLength={8} required className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7]" />
          </Field>
          <SaveButton label="Change Password" disabled={isPending} />
        </form>
      </Section>

      <Separator className="bg-[#2A2D31]" />

      {/* Export */}
      <Section title="Export Data" kanji="出">
        <div className="flex gap-3 flex-wrap">
          <a
            href="/api/export/pdf"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2023] border border-[#2A2D31] rounded-xl text-sm text-[#F5F6F7] hover:border-[#F97316] transition-colors font-medium"
          >
            <Download size={14} />
            Mission Scroll PDF
          </a>
          <a
            href="/api/export/xlsx"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1E2023] border border-[#2A2D31] rounded-xl text-sm text-[#F5F6F7] hover:border-[#2F9E44] transition-colors font-medium"
          >
            <Download size={14} />
            Spreadsheet XLSX
          </a>
        </div>
      </Section>

      <Separator className="bg-[#2A2D31]" />

      {/* Install as PWA */}
      <Section title="Install App" kanji="📲">
        <div className="bg-[#161719] border border-[#2A2D31] rounded-2xl p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Smartphone size={14} className="text-[#F97316]" />
              <p className="text-sm font-bold text-[#F5F6F7]">iPhone (iOS Safari)</p>
            </div>
            <ol className="text-xs text-[#A1A6AD] space-y-1 list-decimal list-inside">
              <li>Open this app in <strong className="text-[#F5F6F7]">Safari</strong></li>
              <li>Tap the <strong className="text-[#F5F6F7]">Share</strong> button (box with arrow)</li>
              <li>Scroll down and tap <strong className="text-[#F5F6F7]">Add to Home Screen</strong></li>
              <li>Tap <strong className="text-[#F5F6F7]">Add</strong></li>
            </ol>
          </div>
          <Separator className="bg-[#2A2D31]" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SpiralIcon size={14} className="text-[#F97316]" />
              <p className="text-sm font-bold text-[#F5F6F7]">macOS (Chrome / Edge)</p>
            </div>
            <ol className="text-xs text-[#A1A6AD] space-y-1 list-decimal list-inside">
              <li>Open this app in <strong className="text-[#F5F6F7]">Chrome</strong> or <strong className="text-[#F5F6F7]">Edge</strong></li>
              <li>Click the <strong className="text-[#F5F6F7]">⊕ Install</strong> icon in the address bar</li>
              <li>Click <strong className="text-[#F5F6F7]">Install</strong> in the dialog</li>
              <li>The app opens in its own window — pin it to your Dock</li>
            </ol>
          </div>
        </div>
      </Section>

      <Separator className="bg-[#2A2D31]" />

      {/* Sign out */}
      <Button
        onClick={() => signOut({ callbackUrl: "/login" })}
        variant="outline"
        className="w-full border-[#E63946] text-[#E63946] hover:bg-[#3d0a0e] h-11 font-bold"
      >
        <LogOut size={15} className="mr-2" />
        Sign Out
      </Button>
    </div>
  );
}

function Section({ title, kanji, children }: { title: string; kanji: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-[#6B7076]">{kanji}</span>
        <h2 className="text-sm font-black font-[var(--font-archivo)] text-[#F5F6F7] uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SaveButton({ label = "Save", disabled }: { label?: string; disabled: boolean }) {
  return (
    <Button type="submit" disabled={disabled} className="bg-[#F97316] hover:bg-[#EA6B10] text-[#0D0D0F] font-bold">
      {disabled ? <SpiralIcon size={14} className="spiral-spin mr-1" /> : null}
      {label}
    </Button>
  );
}
