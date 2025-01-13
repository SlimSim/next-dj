"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ArrowUpDown } from "lucide-react";
import { getUniqueValues } from "@/db/audio-operations";

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
  genre?: string;  // Even though genre is string[] in metadata, we filter by a single genre
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

  return (
    <div className="flex gap-2 items-center px-3 py-2 border-b overflow-x-auto">
      <div className="flex items-center gap-2">
        <Select
          value={sortField}
          onValueChange={(value: SortField) => onSortChange(value, sortOrder)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="artist">Artist</SelectItem>
            <SelectItem value="album">Album</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
            <SelectItem value="playCount">Play Count</SelectItem>
            <SelectItem value="bpm">BPM</SelectItem>
            <SelectItem value="track">Track #</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            onSortChange(sortField, sortOrder === "asc" ? "desc" : "asc")
          }
        >
          <ArrowUpDown
            className={`h-4 w-4 ${sortOrder === "desc" ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      <div className="flex items-center gap-2 ml-2">
        <Select
          value={filters.artist || "all"}
          onValueChange={(value) =>
            onFilterChange({ ...filters, artist: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="w-[160px]">
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

        <Select
          value={filters.album || "all"}
          onValueChange={(value) =>
            onFilterChange({ ...filters, album: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="w-[160px]">
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

        <Select
          value={filters.genre || "all"}
          onValueChange={(value) =>
            onFilterChange({ ...filters, genre: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="w-[160px]">
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
