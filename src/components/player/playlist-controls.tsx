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
import { FilterSelect } from "./filter-select";

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
export type FilterCriteria = {
  artist?: string;
  album?: string;
  genre?: string; // Even though genre is string[] in metadata, we filter by a single genre
} & {
  [K in `custom_${string}`]?: string; // Allow custom metadata fields
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

  // Get unique values for filters
  const uniqueValues = useMemo(() => {
    const values = {
      artist: new Set<string>(),
      album: new Set<string>(),
      genre: new Set<string>(),
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

      // Custom metadata values
      customMetadata.fields.forEach((field) => {
        const customKey = `custom_${field.id}`;
        const value = (track as any)[customKey];
        
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

  const getSortLabel = (field: string) => {
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

  return (
    <div
      className={cn(
        "transition-all justify-center",
        showFilters
          ? "flex flex-wrap gap-2 items-center px-3 py-2 border-b"
          : "h-0 overflow-hidden"
      )}
    >
      <div className="w-36">
        <Select
          value={sortField}
          onValueChange={(value: SortField) => onSortChange(value, sortOrder)}
        >
          <SelectTrigger className="w-36">
            <SelectValue>
              <span className="line-clamp-2">
                {getSortLabel(sortField)} {sortOrder === "asc" ? "↑" : "↓"}
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

      <FilterSelect
        value={filters.artist}
        onValueChange={(value) =>
          onFilterChange({
            ...filters,
            artist: value,
          })
        }
        placeholder="Artist"
        items={Array.from(uniqueValues.artist)}
      />

      <FilterSelect
        value={filters.album}
        onValueChange={(value) =>
          onFilterChange({
            ...filters,
            album: value,
          })
        }
        placeholder="Album"
        items={Array.from(uniqueValues.album)}
      />

      <FilterSelect
        value={filters.genre}
        onValueChange={(value) =>
          onFilterChange({
            ...filters,
            genre: value,
          })
        }
        placeholder="Genre"
        items={Array.from(uniqueValues.genre)}
      />

      {/* Custom Metadata Filters */}
      {customMetadata.fields.map((field) => {
        const customKey = `custom_${field.id}` as `custom_${string}`;
        const options = Array.from(uniqueValues[customKey] || new Set());
        
        return (
          <FilterSelect
            key={field.id}
            value={filters[customKey]}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                [customKey]: value === '(Empty)' ? '' : value,
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
