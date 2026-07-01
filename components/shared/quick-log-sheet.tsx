"use client";

import { useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logLift } from "@/src/actions/lifts";
import { logBodyStat } from "@/src/actions/body";
import { logRun } from "@/src/actions/running";
import { toast } from "sonner";
import { SpiralIcon } from "./spiral-icon";
import { format } from "date-fns";

type Category = "lift" | "weight" | "run" | "mobility";

interface QuickLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickLogSheet({ open, onOpenChange }: QuickLogSheetProps) {
  const [category, setCategory] = useState<Category>("lift");
  const [isPending, startTransition] = useTransition();
  const today = format(new Date(), "yyyy-MM-dd");

  function handleClose() {
    onOpenChange(false);
  }

  function handleLiftSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const lift = fd.get("lift") as string;
    const weightKg = parseFloat(fd.get("weightKg") as string);
    const reps = parseInt(fd.get("reps") as string, 10);
    const rpe = fd.get("rpe") ? parseFloat(fd.get("rpe") as string) : null;

    startTransition(async () => {
      const result = await logLift({ date: today, lift: lift as "squat", weightKg, reps, rpe });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Set logged — ikuzo!");
        handleClose();
      }
    });
  }

  function handleWeightSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const weightKg = parseFloat(fd.get("weightKg") as string);

    startTransition(async () => {
      const result = await logBodyStat({ date: today, weightKg });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Weight logged!");
        handleClose();
      }
    });
  }

  function handleRunSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const type = fd.get("type") as "easy" | "long_easy" | "intervals" | "recovery";
    const distanceKm = parseFloat(fd.get("distanceKm") as string);
    const durationMin = parseFloat(fd.get("durationMin") as string);

    startTransition(async () => {
      const result = await logRun({ date: today, type, distanceKm, durationMin });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Run logged — yoshi!");
        handleClose();
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="bg-[#161719] border-t border-[#2A2D31] rounded-t-2xl safe-bottom"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="text-[#F5F6F7] font-black font-[var(--font-archivo)] uppercase tracking-wide flex items-center gap-2">
            <SpiralIcon size={18} className="text-[#F97316]" />
            Quick Log
          </SheetTitle>
        </SheetHeader>

        <Tabs value={category} onValueChange={(v: string) => setCategory(v as Category)}>
          <TabsList className="grid grid-cols-3 bg-[#0D0D0F] mb-4 h-10">
            <TabsTrigger value="lift" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-[#0D0D0F]">
              Lift
            </TabsTrigger>
            <TabsTrigger value="weight" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-[#0D0D0F]">
              Weight
            </TabsTrigger>
            <TabsTrigger value="run" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-[#0D0D0F]">
              Run
            </TabsTrigger>
          </TabsList>

          {category === "lift" && (
            <form onSubmit={handleLiftSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Lift</Label>
                  <Select name="lift" defaultValue="squat" required>
                    <SelectTrigger className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E2023] border-[#2A2D31]">
                      {["squat", "deadlift", "bench", "ohp", "pullup"].map((l) => (
                        <SelectItem key={l} value={l} className="text-[#F5F6F7] capitalize">
                          {l === "ohp" ? "OHP" : l.charAt(0).toUpperCase() + l.slice(1).replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Weight (kg)</Label>
                  <Input name="weightKg" type="number" step="0.5" min="0" required placeholder="100" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Reps</Label>
                  <Input name="reps" type="number" min="1" max="100" required placeholder="5" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">RPE (optional)</Label>
                  <Input name="rpe" type="number" step="0.5" min="1" max="10" placeholder="8" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
                </div>
              </div>
              <Button type="submit" disabled={isPending} className="w-full bg-[#F97316] hover:bg-[#EA6B10] text-[#0D0D0F] font-bold h-11">
                {isPending ? <SpiralIcon size={16} className="spiral-spin" /> : "Log Set"}
              </Button>
            </form>
          )}

          {category === "weight" && (
            <form onSubmit={handleWeightSubmit} className="space-y-3">
              <div>
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Weight (kg)</Label>
                <Input name="weightKg" type="number" step="0.1" min="30" max="300" required placeholder="70.5" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1 text-xl h-14" />
              </div>
              <Button type="submit" disabled={isPending} className="w-full bg-[#F97316] hover:bg-[#EA6B10] text-[#0D0D0F] font-bold h-11">
                {isPending ? <SpiralIcon size={16} className="spiral-spin" /> : "Log Weight"}
              </Button>
            </form>
          )}

          {category === "run" && (
            <form onSubmit={handleRunSubmit} className="space-y-3">
              <div>
                <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Type</Label>
                <Select name="type" defaultValue="easy" required>
                  <SelectTrigger className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E2023] border-[#2A2D31]">
                    <SelectItem value="easy" className="text-[#F5F6F7]">Easy</SelectItem>
                    <SelectItem value="long_easy" className="text-[#F5F6F7]">Long Easy</SelectItem>
                    <SelectItem value="intervals" className="text-[#F5F6F7]">Intervals</SelectItem>
                    <SelectItem value="recovery" className="text-[#F5F6F7]">Recovery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Distance (km)</Label>
                  <Input name="distanceKm" type="number" step="0.1" min="0.1" required placeholder="5.0" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-[#A1A6AD] uppercase tracking-wider">Duration (min)</Label>
                  <Input name="durationMin" type="number" step="1" min="1" required placeholder="30" className="bg-[#0D0D0F] border-[#2A2D31] text-[#F5F6F7] mt-1" />
                </div>
              </div>
              <Button type="submit" disabled={isPending} className="w-full bg-[#F97316] hover:bg-[#EA6B10] text-[#0D0D0F] font-bold h-11">
                {isPending ? <SpiralIcon size={16} className="spiral-spin" /> : "Log Run"}
              </Button>
            </form>
          )}

          {category === "mobility" && (
            <div className="text-center py-8">
              <p className="text-[#A1A6AD] text-sm">Use the full Mobility page for detailed logging.</p>
              <Button
                variant="outline"
                className="mt-3 border-[#2A2D31] text-[#A1A6AD]"
                onClick={() => {
                  handleClose();
                  window.location.href = "/mobility";
                }}
              >
                Go to Mobility →
              </Button>
            </div>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
