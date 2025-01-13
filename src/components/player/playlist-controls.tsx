"use client";

import { useEffect, useState } from "react";
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
// import { usePlayerStore } from "@/lib/store/player-store";

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
};

interface PlaylistControlsProps {
  onSortChange: (field: SortField, order: SortOrder) => void;
  onFilterChange: (filters: FilterCriteria) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  filters: FilterCriteria;
}

export function PlaylistControls({
  onSortChange,
  onFilterChange,
  sortField,
  sortOrder,
  filters,
}: PlaylistControlsProps) {
  const [uniqueValues, setUniqueValues] = useState<{
    artists: string[];
    albums: string[];
    genres: string[];
  }>({
    artists: [],
    albums: [],
    genres: [],
  });

  useEffect(() => {
    const loadUniqueValues = async () => {
      const values = await getUniqueValues();
      setUniqueValues(values);
    };
    loadUniqueValues();
  }, []);

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
        "transition-all",
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
              {getSortLabel(sortField)} {sortOrder === "asc" ? "↑" : "↓"}
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

      <div className="w-36">
        <Select
          value={filters.artist === undefined ? "all" : filters.artist}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              artist: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Artist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Artists</SelectItem>
            {uniqueValues.artists.map((artist) => (
              <SelectItem key={artist} value={artist}>
                {artist}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-36">
        <Select
          value={filters.album === undefined ? "all" : filters.album}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              album: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-36 xxx">
            <SelectValue placeholder="Album" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Albums</SelectItem>
            {uniqueValues.albums.map((album) => (
              <SelectItem key={album} value={album}>
                {album}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-36">
        <Select
          value={filters.genre === undefined ? "all" : filters.genre}
          onValueChange={(value) =>
            onFilterChange({
              ...filters,
              genre: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {uniqueValues.genres.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
