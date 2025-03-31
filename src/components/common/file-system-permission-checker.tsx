"use client";

import { useEffect } from "react";
import { checkAndLogFileSystemPermissions } from "@/lib/file-system-utils";

/**
 * Component that checks file system permissions on mount and when the window gains focus
 * This ensures we log permissions on app startup and when the user returns to the app (potential reload)
 */
export function FileSystemPermissionChecker() {
  useEffect(() => {
    // Check permissions on initial mount
    if (typeof window !== "undefined") {
      // Delay slightly to ensure other initialization is complete
      const initialCheckTimeout = setTimeout(() => {
        checkAndLogFileSystemPermissions();
      }, 500);

      // Check permissions when window gains focus (which happens after reload)
      const handleFocus = () => {
        checkAndLogFileSystemPermissions();
      };

      window.addEventListener("focus", handleFocus);

      // Clean up
      return () => {
        clearTimeout(initialCheckTimeout);
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, []);

  // This component doesn't render anything
  return null;
}
