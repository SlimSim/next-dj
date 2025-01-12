"use client";

import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Input } from "../ui/input";
import { FilterIcon, ArrowUpDown } from "lucide-react";

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
  genre?: string;
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
  return (
    <div className="flex gap-2 items-center px-3 py-2 border-b">
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

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FilterIcon className="h-4 w-4" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filter Tracks</h4>
              <p className="text-sm text-muted-foreground">
                Filter your playlist by artist, album, or genre
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="artist" className="text-right">
                  Artist
                </label>
                <Input
                  id="artist"
                  value={filters.artist || ""}
                  className="col-span-3"
                  onChange={(e) =>
                    onFilterChange({ ...filters, artist: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="album" className="text-right">
                  Album
                </label>
                <Input
                  id="album"
                  value={filters.album || ""}
                  className="col-span-3"
                  onChange={(e) =>
                    onFilterChange({ ...filters, album: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="genre" className="text-right">
                  Genre
                </label>
                <Input
                  id="genre"
                  value={filters.genre || ""}
                  className="col-span-3"
                  onChange={(e) =>
                    onFilterChange({ ...filters, genre: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
