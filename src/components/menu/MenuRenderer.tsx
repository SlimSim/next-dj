"use client";

import React, { useContext, useState } from "react";
import { MenuItem, MenuOptions } from "./types";
import Menu from "./Menu";
import { getMeasurementsFromAnchor, positionMenu } from "./positioning";

interface MenuContextType {
  show: (
    items: MenuItem[],
    targetElement: HTMLElement,
    options: MenuOptions
  ) => void;
  showFromEvent: (
    e: MouseEvent,
    items: MenuItem[],
    options: MenuOptions
  ) => void;
}

const MenuContext = React.createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: React.ReactNode;
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
  const [menuData, setMenuData] = useState<{
    items: MenuItem[];
    targetElement: HTMLElement;
    options?: MenuOptions;
  } | null>(null);

  const showMenu = (
    items: MenuItem[],
    targetElement: HTMLElement,
    options: MenuOptions
  ) => {
    setMenuData({ items, targetElement, options });
  };

  const showFromEvent = (
    e: MouseEvent,
    items: MenuItem[],
    options: MenuOptions
  ) => {
    const target = e.target as HTMLElement;
    showMenu(items, target, options);
  };

  return (
    <MenuContext.Provider value={{ show: showMenu, showFromEvent }}>
      {children}
      {menuData && (
        <Menu
          items={menuData.items}
          onOpen={(el) => {
            const { options } = menuData;
            const baseRect = el.getBoundingClientRect();
            const rect = {
              ...baseRect,
              width: options?.width ?? baseRect.width,
              height: options?.height ?? baseRect.height,
            };
            const position = options?.anchor
              ? getMeasurementsFromAnchor(
                  rect,
                  menuData.targetElement,
                  options.preferredAlignment
                )
              : (options?.position ?? { top: 0, left: 0 });
            positionMenu(el, { ...rect, ...position });
          }}
          onClose={() => setMenuData(null)}
        />
      )}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
};
