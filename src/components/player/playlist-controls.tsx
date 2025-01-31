"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { getUniqueValues } from "@/db/audio-operations";
import { cn } from "@/lib/utils/common";
import { usePlayerStore } from "@/lib/store";
import { useSettings } from "../settings/settings-context";
import { FilterSelect } from "./filter-select";
import { Switch } from "../ui/switch";
import { AdvancedFilterSelect } from "./advanced-filter-select";
import { asCustomKey } from "@/lib/utils/metadata";
import { StandardMetadataField } from "@/lib/types/settings";
import { CustomMetadataField } from "@/lib/types/customMetadata";
import { Label } from "@radix-ui/react-label";

export type SortField =
  | "title"
  | "artist"
  | "album"
  | "duration"
  | "playCount"
  | "bpm"
  | "track"
  | "year";
export type SortOrder = "asc" | "desc";

export type FilterValue = {
  values: string[];
  exclude: boolean;
};

export type AdvancedFilter = {
  recentPlayHours?: {
    enabled: boolean;
    maxPlays: number;
    withinHours: number;
  };
  monthlyPlayCount?: {
    enabled: boolean;
    maxPlays: number;
    withinDays: number;
  };
  totalPlayCount?: {
    enabled: boolean;
    min?: number;
    max?: number;
  };
  rating?: {
    enabled: boolean;
    min?: number;
    max?: number;
  };
  tempo?: {
    enabled: boolean;
    min?: number;
    max?: number;
  };
};

export type FilterCriteria = {
  advanced?: AdvancedFilter;
  [key: string]: AdvancedFilter | FilterValue | undefined;
};

interface PlaylistControlsProps {
  onSortChange: (field: SortField, order: SortOrder) => void;
  onFilterChange: (filters: FilterCriteria) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  filters: FilterCriteria;
}

export function PlaylistControls({
  onFilterChange,
  filters,
  sortField,
  onSortChange,
  sortOrder,
}: PlaylistControlsProps) {
  const tracks = usePlayerStore((state) => state.metadata);
  const customMetadata = usePlayerStore((state) => state.customMetadata);
  const standardMetadataFields = usePlayerStore((state) => state.standardMetadataFields);

  // Get unique values for filters
  const uniqueValues = useMemo(() => {
    const values = {
      artist: new Set<string>(),
      album: new Set<string>(),
      genre: new Set<string>(),
      track: new Set<string>(),
      year: new Set<string>(),
      comment: new Set<string>(),
    } as Record<string, Set<string>>;

    // Initialize sets for custom metadata fields
    customMetadata.fields.forEach((field) => {
      values[`custom_${field.id}`] = new Set<string>();
    });

    // Collect all values including custom metadata
    tracks.forEach((track) => {
      // Standard metadata
      if (track.artist) values.artist.add(track.artist);
      if (track.album) values.album.add(track.album);
      if (track.genre) track.genre.forEach((g) => values.genre.add(g));
      if (track.track) values.track.add(track.track.toString().padStart(2, '0'));
      if (track.year) values.year.add(track.year.toString());
      if (track.comment) values.comment.add(track.comment);

      // Custom metadata values
      customMetadata.fields.forEach((field) => {
        const customKey = asCustomKey(field.id);
        const value = track.customMetadata?.[customKey];
        
        if (value === undefined || value === '') {
          values[customKey].add('(Empty)');
        } else if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed) values[customKey].add(trimmed);
        }
      });
    });

    return values;
  }, [tracks, customMetadata.fields]);

  const getSortFieldLabel = (field: string) => {
    switch (field) {
      case "title":
        return "Title";
      case "artist":
        return "Artist";
      case "album":
        return "Album";
      case "duration":
        return "Duration";
      case "playCount":
        return "Play Count";
      case "bpm":
        return "BPM";
      case "track":
        return "Track #";
      case "year":
        return "Year";
      default:
        return field;
    }
  };

  const showFilters = usePlayerStore((state) => state.showFilters);

  // Only show custom metadata fields that have showInFilter enabled
  const visibleCustomFields = useMemo(() => 
    customMetadata.fields?.filter((field: CustomMetadataField) => field.showInFilter) ?? [],
    [customMetadata.fields]
  );

  // Only show standard metadata fields that have showInFilter enabled
  const visibleStandardFields = useMemo(() => 
    standardMetadataFields?.filter((field: StandardMetadataField) => field.showInFilter) ?? [],
    [standardMetadataFields]
  );

  const filterFields = useMemo(() => [...visibleStandardFields, ...visibleCustomFields], 
    [visibleStandardFields, visibleCustomFields]
  );

  return (
    <div
      className={cn(
        "transition-all justify-center",
        showFilters
          ? "flex flex-wrap gap-2 items-center px-3 py-2 border-b"
          : "h-0 overflow-hidden"
      )}
    >
            <AdvancedFilterSelect
        value={filters.advanced || {}}
        onChange={(advanced) => {
          onFilterChange({
            ...filters,
            advanced,
          });
        }}
      />
      <div className="w-36">
        <Select
          value={sortField}
          onValueChange={(value: SortField) => onSortChange(value, sortOrder)}
        >
          <SelectTrigger className="w-36">
            <SelectValue>
              <span className="line-clamp-2">
                {getSortFieldLabel(sortField)} {sortOrder === "asc" ? "↑" : "↓"}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="px-2 py-1.5">Sort Direction</SelectLabel>
              <div className="flex gap-2 p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1",
                    sortOrder === "asc" && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => onSortChange(sortField, "asc")}
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Ascending
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1",
                    sortOrder === "desc" && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => onSortChange(sortField, "desc")}
                >
                  <ArrowDown className="h-4 w-4 mr-1" />
                  Descending
                </Button>
              </div>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="px-2 py-1.5">Sort By</SelectLabel>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="artist">Artist</SelectItem>
              <SelectItem value="album">Album</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
              <SelectItem value="playCount">Play Count</SelectItem>
              <SelectItem value="bpm">BPM</SelectItem>
              <SelectItem value="track">Track #</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Standard metadata filters */}
      {visibleStandardFields.map((field) => {
        const filterKey = field.key as keyof FilterCriteria;
        const currentFilter = filters[filterKey] as FilterValue | undefined;
        const options = Array.from(uniqueValues[filterKey] || new Set());

        return (
          <FilterSelect
            key={field.key}
            value={currentFilter?.values ?? []}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                [filterKey]: {
                  values: value,
                  exclude: currentFilter?.exclude ?? false,
                } as FilterValue,
              })
            }
            exclude={currentFilter?.exclude ?? false}
            onExcludeChange={(exclude) =>
              onFilterChange({
                ...filters,
                [filterKey]: {
                  values: currentFilter?.values ?? [],
                  exclude,
                } as FilterValue,
              })
            }
            placeholder={`Filter by ${field.name}`}
            items={options}
          />
        );
      })}

      {/* Custom metadata filters */}
      {visibleCustomFields.map((field) => {
        const filterKey = `custom_${field.id}` as keyof FilterCriteria;
        const currentFilter = filters[filterKey] as FilterValue | undefined;
        const options = Array.from(uniqueValues[filterKey] || new Set());
        
        return (
          <FilterSelect
            key={field.id}
            value={currentFilter?.values ?? []}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                [filterKey]: { 
                  values: value, 
                  exclude: currentFilter?.exclude ?? false 
                } as FilterValue,
              })
            }
            exclude={currentFilter?.exclude ?? false}
            onExcludeChange={(exclude) =>
              onFilterChange({
                ...filters,
                [filterKey]: {
                  values: currentFilter?.values ?? [],
                  exclude,
                } as FilterValue,
              })
            }
            placeholder={`Filter by ${field.name}`}
            items={options}
          />
        );
      })}
    </div>
  );
}
