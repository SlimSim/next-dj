"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { StarRating } from "@/components/ui/star-rating";
import { NumberBadge } from "@/components/ui/number-badge";
// import { cn } from "@/lib/utils";
import { AdvancedFilter } from "./playlist-controls";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils/common";

interface AdvancedFilterSelectProps {
  value: AdvancedFilter;
  onChange: (value: AdvancedFilter) => void;
}

interface FilterIconProps {
  ratingFilterActive: boolean;
  tempoFilterActive: boolean;
  ratingValue: number;
  minBPM: number;
  maxBPM: number | undefined;
  recentHoursFilter: {
    active: boolean;
    value: number;
  };
  monthlyFilter: {
    active: boolean;
    value: number;
  };
  totalPlaysFilter: {
    active: boolean;
    value: number;
  };
}

const FilterIcon = ({
  ratingFilterActive,
  tempoFilterActive,
  ratingValue,
  minBPM,
  maxBPM,
  recentHoursFilter,
  monthlyFilter,
  totalPlaysFilter,
}: FilterIconProps) => {
  return (
    <div className="xxxx grid grid-cols-2 grid-rows-3 gap-x-0.5 gap-y-0 place-items-center">
      <div>
        <StarRating
          fillLevel={ratingFilterActive ? (ratingValue / 5) / 5 : 0}
          className={cn(
            "w-2.5 h-2.5",
            !ratingFilterActive && "text-muted-foreground"
          )}
        />
      </div>
      <NumberBadge
        number={recentHoursFilter.value}
        size="xs"
        variant={recentHoursFilter.active ? 'primary' : 'ghost'}
        className="h-2.5"
      />
      <div className="text-[7px] -mt-2.5 text-muted-foreground h-2.5">
        {minBPM || 0}
      </div>
      <NumberBadge
        number={monthlyFilter.value}
        size="xs"
        variant={monthlyFilter.active ? 'primary' : 'ghost'}
        className="h-2.5"
      />
      <div className="text-[7px] -mt-2.5 text-muted-foreground h-2.5">
        {tempoFilterActive ? (maxBPM ?? '∞') : ''}
      </div>
      <NumberBadge
        number={totalPlaysFilter.active ? totalPlaysFilter.value : '∞'}
        size="xs"
        variant={totalPlaysFilter.active ? 'primary' : 'ghost'}
        className="h-2.5"
      />
    </div>
  );
};

export function AdvancedFilterSelect({ value, onChange }: AdvancedFilterSelectProps) {
  const recentPlayHours = useSettings((state) => state.recentPlayHours);
  const monthlyPlayDays = useSettings((state) => state.monthlyPlayDays);
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = Object.values(value).some(
    (filter) => filter?.enabled
  );

  const handleRecentPlayHoursChange = (enabled: boolean) => {
    onChange({
      ...value,
      recentPlayHours: {
        enabled: enabled,
        maxPlays: value.recentPlayHours?.maxPlays ?? 2,
        withinHours: recentPlayHours,
      },
    });
  };

  const handleMonthlyPlayCountChange = (enabled: boolean) => {
    onChange({
      ...value,
      monthlyPlayCount: {
        enabled: enabled,
        maxPlays: value.monthlyPlayCount?.maxPlays ?? 2,
        withinDays: monthlyPlayDays,
      },
    });
  };

  const handleTotalPlayCountChange = (enabled: boolean) => {
    onChange({
      ...value,
      totalPlayCount: {
        enabled: enabled,
        min: value.totalPlayCount?.min,
        max: value.totalPlayCount?.max,
      },
    });
  };

  const handleRatingChange = (enabled: boolean) => {
    onChange({
      ...value,
      rating: {
        enabled: enabled,
        min: value.rating?.min ?? 1,
        max: value.rating?.max ?? 5,
      },
    });
  };

  const handleTempoChange = (enabled: boolean) => {
    onChange({
      ...value,
      tempo: {
        enabled: enabled,
        min: value.tempo?.min ?? 0,
        max: value.tempo?.max ?? 300,
      },
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 p-0",
            hasActiveFilters && "text-primary"
          )}
        >
          <FilterIcon
            ratingFilterActive={value.rating?.enabled ?? false}
            tempoFilterActive={value.tempo?.enabled ?? false}
            ratingValue={value.rating?.enabled ? (value.rating?.min ?? 1) * 5 : 0}
            minBPM={value.tempo?.min ?? 0}
            maxBPM={value.tempo?.enabled ? value.tempo?.max : undefined}
            recentHoursFilter={{
              active: value.recentPlayHours?.enabled ?? false,
              value: value.recentPlayHours?.maxPlays ?? 0,
            }}
            monthlyFilter={{
              active: value.monthlyPlayCount?.enabled ?? false,
              value: value.monthlyPlayCount?.maxPlays ?? 0,
            }}
            totalPlaysFilter={{
              active: value.totalPlayCount?.enabled ?? false,
              value: value.totalPlayCount?.max ?? 0,
            }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Advanced Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-2 space-y-4">
          {/* Recent Play Hours Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex-1">Played daily</Label>
              <Switch
                checked={value.recentPlayHours?.enabled ?? false}
                onCheckedChange={handleRecentPlayHoursChange}
              />
            </div>
            {value.recentPlayHours?.enabled && (
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Max</Label>
                <Input
                  type="number"
                  min={0}
                  className="w-16 h-8"
                  value={value.recentPlayHours.maxPlays ?? 0}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      recentPlayHours: {
                        enabled: value.recentPlayHours?.enabled ?? false,
                        maxPlays: parseInt(e.target.value) || 0,
                        withinHours: recentPlayHours,
                      },
                    })
                  }
                />
                <Label className="flex-1">played in the last {recentPlayHours} hours</Label>
              </div>
            )}
          </div>

          {/* Monthly Play Count Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex-1">Played Monthly</Label>
              <Switch
                checked={value.monthlyPlayCount?.enabled ?? false}
                onCheckedChange={handleMonthlyPlayCountChange}
              />
            </div>
            {value.monthlyPlayCount?.enabled && (
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Max </Label>
                <Input
                  type="number"
                  min={0}
                  className="w-16 h-8"
                  value={value.monthlyPlayCount.maxPlays ?? 2}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      monthlyPlayCount: {
                        enabled: value.monthlyPlayCount?.enabled ?? false,
                        maxPlays: parseInt(e.target.value) || 0,
                        withinDays: monthlyPlayDays,
                      },
                    })
                  }
                />
                <Label className="flex-1">played in the last {monthlyPlayDays} days</Label>
              </div>
            )}
          </div>

          {/* Total Play Count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Total plays range</Label>
              <Switch
                checked={value.totalPlayCount?.enabled ?? false}
                onCheckedChange={handleTotalPlayCountChange}
              />
            </div>
            {value.totalPlayCount?.enabled && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Min"
                  className="w-24 h-8"
                  value={value.totalPlayCount.min ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      totalPlayCount: {
                        enabled: value.totalPlayCount?.enabled ?? false,
                        min: parseInt(e.target.value) || undefined,
                        max: value.totalPlayCount?.max,
                      },
                    })
                  }
                />
                <span className="text-sm self-center">to</span>
                <Input
                  type="number"
                  min={0}
                  placeholder="Max"
                  className="w-24 h-8"
                  value={value.totalPlayCount.max ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      totalPlayCount: {
                        enabled: value.totalPlayCount?.enabled ?? false,
                        min: value.totalPlayCount?.min,
                        max: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Min rating</Label>
              <Switch
                checked={value.rating?.enabled ?? false}
                onCheckedChange={handleRatingChange}
              />
            </div>
            {value.rating?.enabled && (
              <div className="col-span-3 flex items-center gap-4">
                <Slider
                  min={0}
                  max={5}
                  step={1}
                  value={[value.rating?.min ?? 0]}
                  onValueChange={([val]) => {
                    onChange({
                      ...value,
                      rating: {
                        enabled: true,
                        min: val,
                      },
                    });
                  }}
                />
                <span className="w-12 text-sm">
                  {value.rating?.min ?? 0}
                </span>
              </div>
            )}
          </div>

          {/* Tempo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tempo range (BPM)</Label>
              <Switch
                checked={value.tempo?.enabled ?? false}
                onCheckedChange={handleTempoChange}
              />
            </div>
            {value.tempo?.enabled && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={300}
                  placeholder="Min"
                  className="w-24 h-8"
                  value={value.tempo.min ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      tempo: {
                        enabled: value.tempo?.enabled ?? false,
                        min: parseInt(e.target.value) || undefined,
                        max: value.tempo?.max,
                      },
                    })
                  }
                />
                <span className="text-sm self-center">to</span>
                <Input
                  type="number"
                  min={0}
                  max={300}
                  placeholder="Max"
                  className="w-24 h-8"
                  value={value.tempo.max ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      tempo: {
                        enabled: value.tempo?.enabled ?? false,
                        min: value.tempo?.min,
                        max: parseInt(e.target.value) || undefined,
                      },
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
