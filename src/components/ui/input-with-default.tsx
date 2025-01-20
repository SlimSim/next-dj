"use client";

import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils/common";

export interface InputWithDefaultProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  defaultValue?: string | number;
  onValueChange?: (value: string | number) => void;
}

const InputWithDefault = React.forwardRef<HTMLInputElement, InputWithDefaultProps>(
  ({ className, defaultValue, onValueChange, onChange, value: propValue, type, ...props }, ref) => {
    const [value, setValue] = React.useState<string>(propValue?.toString() || "");
    const [isFocused, setIsFocused] = React.useState(false);

    React.useEffect(() => {
      if (propValue !== undefined) {
        setValue(propValue.toString());
      }
    }, [propValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      onChange?.(e);
      
      if (newValue === "") {
        onValueChange?.("");
      } else {
        // For number inputs, convert to number
        const finalValue = type === "number" ? Number(newValue) : newValue;
        onValueChange?.(finalValue);
      }
    };

    const showPlaceholder = !value && !isFocused && defaultValue !== undefined;
    const displayValue = value || "";  // Never show "0", show empty string instead

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={type}
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (!value) {
              // Only set the default value when the input loses focus
              onValueChange?.(defaultValue!);
            }
          }}
          className={cn(
            showPlaceholder ? "text-transparent" : "",
            className
          )}
        />
        {showPlaceholder && (
          <div className="absolute inset-0 flex items-center px-3 text-muted-foreground pointer-events-none">
            {defaultValue}
          </div>
        )}
      </div>
    );
  }
);

InputWithDefault.displayName = "InputWithDefault";

export { InputWithDefault };
