"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { SortAsc, SortDesc, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/common";

export type HistoryFilterConfig = {
  timeFilter: string;
  sortOrder: "asc" | "desc";
};

interface HistoryControlsProps {
  sortOrder: "asc" | "desc";
  timeFilter: string;
  onTimeFilterChange: (value: string) => void;
  onSortOrderChange: (order: "asc" | "desc") => void;
}

export function HistoryControls({
  sortOrder,
  timeFilter,
  onTimeFilterChange,
  onSortOrderChange,
}: HistoryControlsProps) {
  
  return (
    <div className="container mx-auto p-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Time period:</span>
          <Select value={timeFilter} onValueChange={onTimeFilterChange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort order:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange("asc")}
            className={cn(
              "transition-colors",
              sortOrder === "asc" ? "bg-accent" : ""
            )}
          >
            <SortAsc className="h-4 w-4 mr-2" />
            Oldest first
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange("desc")}
            className={cn(
              "transition-colors",
              sortOrder === "desc" ? "bg-accent" : ""
            )}
          >
            <SortDesc className="h-4 w-4 mr-2" />
            Newest first
          </Button>
        </div>
      </div>
    </div>
  );
}
