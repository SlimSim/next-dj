"use client";

import React, { useState } from "react";
import { clx } from "@/utils/clx"; // Assuming clx is a utility for class names

interface SwitchProps {
  checked: boolean;
}

const Switch: React.FC<SwitchProps> = ({ checked: initialChecked }) => {
  const [checked, setChecked] = useState(initialChecked);

  const toggle = () => {
    setChecked(!checked);
  };

  return (
    <div
      className={clx(
        "w-52px h-32px border-2 cursor-pointer shrink-0 flex items-center rounded-32px transition-all duration-150",
        checked
          ? "border-transparent bg-primary"
          : "border-outline bg-surface bg-surfaceContainerHigh"
      )}
      tabIndex={0}
      role="switch"
      aria-checked={checked}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          toggle();
        }
      }}
    >
      <input type="checkbox" checked={checked} className="hidden" readOnly />
      <div
        className={clx(
          "h-16px w-16px rounded-full ml-6px transition-all duration-150",
          checked ? "bg-onPrimary translate-x-20px scale-150" : "bg-outline"
        )}
      ></div>
    </div>
  );
};

export default Switch;
