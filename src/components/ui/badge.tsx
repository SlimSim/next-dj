"use client";

import * as React from "react";
import { cn } from "@/lib/utils/common";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary";
}

const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        variant === "default" && "bg-gray-100 text-gray-800",
        variant === "secondary" && "bg-blue-100 text-blue-800",
        className
      )}
      {...props}
    />
  );
};

export { Badge };
