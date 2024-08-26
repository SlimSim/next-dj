import React, { useEffect, useRef } from 'react';
import { clx } from '../../utils/clx'; // Assuming you have a clx utility
import { MenuItem } from './types';
import Icon from '../icon/Icon'; // Assuming you have an Icon component

interface MenuProps {
  items: MenuItem[];
  onOpen: (el: HTMLElement) => void;
  onClose: (el: HTMLElement) => void;
}

const Menu: React.FC<MenuProps> = ({ items, onOpen, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const menuEl = menuRef.current;
    if (menuEl) {
      onOpen(menuEl);
    }
    return () => {
      if (menuEl) {
        onClose(menuEl);
      }
    };
  }, [onOpen, onClose]);

  const closeMenu = () => {
    const menuEl = menuRef.current;
    if (menuEl) {
      onClose(menuEl);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  };

  return (
    <>
      <div onClick={closeMenu} aria-hidden="true" className="absolute inset-0 pointer-events-auto"></div>
      <div
        ref={menuRef}
        role="menu"
        tabIndex={-1}
        className="pointer-events-auto flex flex-col absolute bg-surface rounded-4px py-8px bg-surfaceContainerHigh overscroll-contain shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        {items.map((item, index) => (
          <button
            key={index}
            role="menuitem"
            tabIndex={0}
            className={clx(
              'flex items-center grow h-40px gap-16px px-16px text-body-md relative interactable',
              item.selected && 'bg-surfaceVariant text-primary',
            )}
            onClick={() => {
              item.action();
              closeMenu();
            }}
          >
            {item.icon && <Icon type={item.icon} className="mr-16px" />}
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
};

export default Menu;