"use client";

import React, { useState, useEffect, useRef } from "react";
import BackButton from "./BackButton";

interface HeaderProps {
  children?: React.ReactNode;
  title?: string;
  noBackButton?: boolean;
  mode?: "fixed" | "sticky";
}

const Header: React.FC<HeaderProps> = ({
  children,
  title,
  noBackButton,
  mode = "sticky",
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollThresholdRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsScrolled(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (scrollThresholdRef.current) {
      observer.observe(scrollThresholdRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div
        ref={scrollThresholdRef}
        className="h-0 w-full"
        aria-hidden="true"
      ></div>
      {mode === "fixed" && (
        <div
          className="h-[var(--app-header-height)] shrink-0"
          aria-hidden="true"
        ></div>
      )}
      <header
        className={`inset-x-0 top-0 z-10 flex h-[var(--app-header-height)] flex-shrink-0 transition-background-color duration-200 ease-in-out ${
          isScrolled ? "bg-surfaceContainerHigh" : ""
        } ${mode === "fixed" ? "fixed" : "sticky"}`}
      >
        <div className="max-w-1280px flex mx-auto w-full items-center pl-24px pr-8px">
          {!noBackButton && <BackButton className="mr-8px" />}
          {title && <h1 className="text-title-lg mr-auto">{title}</h1>}
          <div className="flex items-center gap-8px">{children}</div>
        </div>
      </header>
    </>
  );
};

export default Header;
