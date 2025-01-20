"use client"

import * as React from "react"
import { Input } from "./input"
import { Button } from "./button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils/common"

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    // Merge refs to handle both forwarded ref and internal ref
    React.useImperativeHandle(ref, () => inputRef.current!)

    const handleClear = () => {
      if (onChange) {
        const event = {
          target: { value: "" }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
      onClear?.()
      inputRef.current?.focus()
    }

    return (
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={onChange}
          className={cn("pr-8 [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden", className)}
          {...props}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
