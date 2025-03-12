"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePlayerStore } from "@/lib/store";


interface AdvancedTabProps {
  recentPlayHours: number;
  setRecentPlayHours: (value: number) => void;
  monthlyPlayDays: number;
  setMonthlyPlayDays: (value: number) => void;
}

export function AdvancedTab({
  recentPlayHours,
  setRecentPlayHours,
  monthlyPlayDays,
  setMonthlyPlayDays,
}: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Play counter cutoff</h3>
        <p className="text-sm text-muted-foreground">
          Set the time window for the first 2 play counters at the left of
          the song name in the songlist
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label className="text-sm" htmlFor="recentPlayHours">Played daily hours</label>
            <Input
              type="number"
              id="recentPlayHours"
              value={recentPlayHours.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value)) {
                  setRecentPlayHours(value);
                }
              }}
              min={0}
              max={240}
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label className="text-sm" htmlFor="monthlyPlayDays">Played monthly days</label>
            <Input
              type="number"
              id="monthlyPlayDays"
              value={monthlyPlayDays.toString()}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value)) {
                  setMonthlyPlayDays(value);
                }
              }}
              min={0}
              max={101}
            />
          </div>
        </div>
      </div>

      {/* EQ Mode Switch */}
      <div className="border-t pt-4 mt-4">
        <Label className="flex w-full items-center justify-between cursor-pointer">
          <span>Use 5-band EQ:</span>
          <Switch
            checked={usePlayerStore((state) => state.eqMode === '5-band')}
            onCheckedChange={(checked) =>
              usePlayerStore.getState().setEQMode(checked ? '5-band' : '3-band')
            }
          />
        </Label>
      </div>
    </div>
  );
}
