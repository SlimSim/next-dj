"use client";

import { usePlayerStore } from "@/lib/store";
import { useSettings } from "@/lib/settings";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Input } from "../../ui/input";

export function AdvancedTab() {
  const practiceMode = usePlayerStore((state) => state.practiceMode);
  const setPracticeMode = usePlayerStore((state) => state.setPracticeMode);
  const use5BandEQ = usePlayerStore((state) => state.use5BandEQ);
  const setUse5BandEQ = usePlayerStore((state) => state.setUse5BandEQ);

  const recentPlayHours = useSettings((state) => state.recentPlayHours);
  const setRecentPlayHours = useSettings((state) => state.setRecentPlayHours);
  const monthlyPlayDays = useSettings((state) => state.monthlyPlayDays);
  const setMonthlyPlayDays = useSettings((state) => state.setMonthlyPlayDays);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="practice-mode"
            checked={practiceMode}
            onCheckedChange={setPracticeMode}
          />
          <Label htmlFor="practice-mode">Practice Mode</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="use-5-band-eq"
            checked={use5BandEQ}
            onCheckedChange={(enabled) => {
              setUse5BandEQ(enabled);
            }}
          />
          <Label htmlFor="use-5-band-eq">Use 5-band EQ</Label>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="recent-play-hours">Recent Play Hours</Label>
          <Input
            id="recent-play-hours"
            type="number"
            value={recentPlayHours}
            onChange={(e) => setRecentPlayHours(Number(e.target.value))}
            min={1}
            max={168}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="monthly-play-days">Monthly Play Days</Label>
          <Input
            id="monthly-play-days"
            type="number"
            value={monthlyPlayDays}
            onChange={(e) => setMonthlyPlayDays(Number(e.target.value))}
            min={1}
            max={31}
          />
        </div>
      </div>
    </div>
  );
}
