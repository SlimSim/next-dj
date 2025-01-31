"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "../ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "../ui/switch";
import { Label } from "@radix-ui/react-label";
import { Ban } from "lucide-react";
import { cn } from "@/lib/utils/common";

export interface FilterSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder: string;
  items: string[];
  allItemsLabel?: string;
  exclude?: boolean;
  onExcludeChange?: (exclude: boolean) => void;
}

export function FilterSelect({
  value = [],
  onValueChange,
  placeholder,
  items,
  allItemsLabel = `All ${placeholder}s`,
  exclude = false,
  onExcludeChange,
}: FilterSelectProps) {
  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "all") {
      onValueChange([]);
      return;
    }

    const newValue = value.includes(selectedValue)
      ? value.filter((v) => v !== selectedValue)
      : [...value, selectedValue];
    onValueChange(newValue);
  };

  const displayValue = value.length === 0 
    ? placeholder 
    : value.length === 1 
    ? value[0]
    : `${value.length} selected`;

  return (
    <div className="w-[200px]">
      <Select
        value="multiple"
        onValueChange={handleSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {value.map((v) => (
                  <Badge
                    key={v}
                    variant={exclude ? "default" : "secondary"}
                    className={cn(
                      "px-1 font-normal flex items-center gap-1",
                      exclude && "bg-red-100 text-red-800"
                    )}
                  >
                    {exclude && <Ban className="h-3 w-3" />}
                    {v}
                  </Badge>
                ))}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <Label className="p-2 cursor-pointer flex items-center justify-between text-sm">
            Exclude selected
            <Switch
              checked={exclude}
              onCheckedChange={onExcludeChange}
            />
          </Label>
          <SelectSeparator className="my-1" />
          <SelectItem value="all">{allItemsLabel}</SelectItem>
          {items.map((item) => (
            <SelectItem key={item} value={item}>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={value.includes(item)}
                  className="mr-2"
                  readOnly
                />
                {item}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
