"use client";

// src/components/ui/Select.tsx
import React, { useState, useRef } from "react";
import { computePosition, flip, shift } from "@floating-ui/dom";
import { nanoid } from "nanoid";
import Icon from "./Icon";

interface SelectProps<T> {
  items: readonly T[];
  key: keyof T;
  labelKey: keyof T;
  selected?: T[keyof T];
  className?: string;
}

const Select = <T,>({
  items,
  key,
  labelKey,
  selected,
  className,
}: SelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | undefined>(
    items.find((item) => item[key] === selected)
  );

  const targetRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const popupId = nanoid();

  const handleSelect = (item: T) => {
    setSelectedItem(item);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={className}>
      <button
        ref={targetRef}
        className="border border-outlineVariant h-40px rounded-4px pl-16px pr-8px gap-8px appearance-none relative overflow-hidden flex items-center"
        aria-controls={popupId}
        aria-expanded={isOpen}
        onClick={toggleOpen}
      >
        {selectedItem ? selectedItem[labelKey] : "Select item"}
        <Icon type="menuDown" className="size-20px ml-auto" />
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          id={popupId}
          className="bg-surfaceContainerHighest py-8px px-0 rounded-4px shadow-xl flex flex-col absolute m-0"
          role="listbox"
        >
          {items.map((item) => (
            <button
              key={item[key]}
              role="option"
              aria-selected={item[key] === selected}
              className="overflow-hidden relative h-40px px-16px flex items-center w-full"
              onClick={() => handleSelect(item)}
            >
              {item[labelKey]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;
