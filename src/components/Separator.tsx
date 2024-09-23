// src/components/ui/Separator.tsx
import { cn } from "@/utils/clx";
import React from "react";

interface SeparatorProps {
  vertical?: boolean;
  className?: string;
}

const Separator: React.FC<SeparatorProps> = ({ vertical, className }) => {
  return (
    <div
      role="separator"
      className={cn(
        className,
        "border-outlineVariant shrink-0 self-stretch",
        vertical ? "w-0 border-r" : "h-0 border-b"
      )}
    />
  );
};

export default Separator;
