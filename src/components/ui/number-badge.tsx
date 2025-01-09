import React from 'react';
import { cn } from '@/lib/utils/common';

interface NumberBadgeProps {
  number: number;
  className?: string;
  variant?: 'primary' | 'danger';
  size?: 'sm' | 'default';
}

export function NumberBadge({ 
  number, 
  className,
  variant = 'primary',
  size = 'default'
}: NumberBadgeProps) {
  const sizeClasses = {
    sm: "h-3 w-3 text-[8px]",
    default: "h-4 w-4 text-[10px]"
  };

  const variantClasses = {
    primary: "bg-primary text-primary-foreground",
    danger: "bg-red-500 text-white dark:bg-red-600"
  };

  return (
    <span className={cn(
      "rounded-full font-medium flex items-center justify-center leading-none",
      sizeClasses[size],
      variantClasses[variant],
      className
    )}>
      {number}
    </span>
  );
}
