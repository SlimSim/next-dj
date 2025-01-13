"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface FilterSelectProps {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  placeholder: string;
  items: string[];
  allItemsLabel?: string;
}

export function FilterSelect({
  value,
  onValueChange,
  placeholder,
  items,
  allItemsLabel = `All ${placeholder}s`,
}: FilterSelectProps) {
  return (
    <div className="w-36">
      <Select
        value={value === undefined ? "all" : value}
        onValueChange={(value) =>
          onValueChange(value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder={placeholder}>
            <span className="line-clamp-2">{value === undefined ? allItemsLabel : value}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allItemsLabel}</SelectItem>
          {items.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
