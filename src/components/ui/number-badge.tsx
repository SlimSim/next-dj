import React from "react";
import { cn } from "@/lib/utils/common";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

interface NumberBadgeProps {
  number: number | string;
  className?: string;
  variant?: "primary" | "danger" | "ghost" | "muted";
  size?: "xs" | "sm" | "default";
  tooltip?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  tooltipAlign?: "start" | "center" | "end";
}

export function NumberBadge({
  number,
  className,
  variant = "primary",
  size = "default",
  tooltip,
  tooltipSide = "top",
  tooltipAlign = "center",
}: NumberBadgeProps) {
  const sizeClasses = {
    xs: "h-2 w-2 text-[6px]",
    sm: "h-3 w-3 text-[8px]",
    default: "h-4 w-4 text-[10px]",
  };

  const variantClasses = {
    primary: "bg-primary text-primary-foreground",
    danger: "bg-red-500 text-white dark:bg-red-600",
    ghost: "bg-accent/50 text-accent-foreground/90",
    muted: "bg-muted text-muted-foreground",
  };

  const badge = (
    <span
      className={cn(
        "rounded-full font-medium flex items-center justify-center leading-none",
        sizeClasses[size],
        variantClasses[variant],
        tooltip && "cursor-help",
        className
      )}
    >
      {number}
    </span>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent
            side={tooltipSide}
            align={tooltipAlign}
            className="text-xs"
          >
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
