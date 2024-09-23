// src/components/ui/ListItem.tsx
import React from "react";
import IconButton from "./IconButton";
import { useMenu } from "./menu/MenuRenderer";

import { MenuItem as MenuItemType } from "./menu/types";

interface MenuItem extends MenuItemType {}

interface ListItemProps {
  style?: React.CSSProperties;
  className?: string;
  ariaLabel?: string;
  ariaRowIndex?: number;
  tabIndex?: number;
  children: React.ReactNode;
  menuItems?: MenuItem[];
  onClick?: () => void;
}

const ListItem: React.FC<ListItemProps> = ({
  style,
  className,
  ariaLabel,
  ariaRowIndex,
  tabIndex = 0,
  children,
  menuItems,
  onClick,
}) => {
  const menu = useMenu();

  const handleClick = () => onClick?.();

  return (
    <div
      style={style}
      tabIndex={tabIndex}
      className={`cursor-pointer hover:bg-onSurface/10 rounded-8px overflow-hidden pl-16px pr-8px flex items-center ${className}`}
      role="row"
      aria-label={ariaLabel}
      aria-rowindex={ariaRowIndex}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleClick();
        }
      }}
      onContextMenu={(e) => {
        if (!menuItems) {
          return;
        }
        e.preventDefault();
        menu.showFromEvent(e as unknown as MouseEvent, menuItems, {
          anchor: false,
          position: { top: e.clientY, left: e.clientX },
        });
      }}
    >
      {children}
      {menuItems && (
        <IconButton
          tabIndex={-1}
          icon="moreVertical"
          className="text-onSurfaceVariant"
          tooltip="More Options"
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            if (!menuItems) {
              return;
            }
            menu.showFromEvent(e, menuItems, {
              anchor: true,
              preferredAlignment: {
                horizontal: "right",
                vertical: "top",
              },
            });
          }}
        />
      )}
    </div>
  );
};

export default ListItem;
