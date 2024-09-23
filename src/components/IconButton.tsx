import React from "react";
import Button from "./Button";
import Icon, { IconType } from "./icon/Icon";

interface IconButtonProps {
  icon?: IconType;
  children?: React.ReactNode;
  [key: string]: any; // To allow other props
}

const IconButton: React.FC<IconButtonProps> = ({ icon, children, ...rest }) => {
  return (
    <Button
      {...rest}
      kind="filled"
      className={`interactable flex justify-center shrink-0 h-44px w-44px items-center rounded-full ${rest.className} ${
        rest.disabled ? "opacity-54" : ""
      }`}
    >
      {children || (icon && <Icon type={icon} />)}
    </Button>
  );
};

export default IconButton;
