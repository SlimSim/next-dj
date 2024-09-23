import React from "react";
import Icon, { IconType } from "./icon/Icon";

interface InfoBannerProps {
  icon?: IconType;
  className?: string;
  children?: React.ReactNode;
}

const InfoBanner: React.FC<InfoBannerProps> = ({
  icon = "alertCircle",
  className,
  children,
}) => {
  return (
    <div
      className={`flex select-text flex-col gap-16px rounded-8px border border-outlineVariant p-16px text-outline sm:flex-row sm:items-center ${className}`}
    >
      <Icon type={icon} className="flex-shrink-0 text-outline" />
      <span>{children}</span>
    </div>
  );
};

export default InfoBanner;
