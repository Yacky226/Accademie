"use client";

import { useState } from "react";

export function useWorkspaceSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return {
    isCollapsed,
    toggleSidebar() {
      setIsCollapsed((current) => !current);
    },
  };
}
