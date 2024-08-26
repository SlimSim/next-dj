import { IconType } from "../icon/Icon";

export type MenuPosition = {
    top: number;
    left: number;
  };
  
  export interface MenuAlignment {
    horizontal?: 'left' | 'right';
    vertical?: 'top' | 'bottom';
  }
  
  interface MenuAnchorOptions {
    anchor: true;
    preferredAlignment?: MenuAlignment;
  }
  
  interface MenuPositionOptions {
    anchor: false;
    position: MenuPosition;
  }
  
  interface MenuSize {
    width?: number;
    height?: number;
  }
  
  export type MenuOptions = (MenuAnchorOptions | MenuPositionOptions) & MenuSize;
  
  export interface MenuItem {
    label: string;
    icon?: IconType; // Update this if you have a specific IconType
    selected?: boolean;
    action: () => void;
  }