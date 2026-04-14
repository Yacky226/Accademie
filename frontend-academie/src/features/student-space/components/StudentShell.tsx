"use client";

import type { ReactNode } from "react";
import { useWorkspaceSidebarState } from "@/features/workspace-shell/hooks/useWorkspaceSidebarState";
import styles from "../student-space.module.css";
import { StudentFooter } from "./StudentFooter";
import { StudentSidebar } from "./StudentSidebar";
import { StudentTopBar } from "./StudentTopBar";

interface StudentShellProps {
  activePath: string;
  topbarTitle: string;
  children: ReactNode;
  hideTopbar?: boolean;
  hideFooter?: boolean;
  widePage?: boolean;
  lockPageScroll?: boolean;
}

export function StudentShell({
  activePath,
  topbarTitle,
  children,
  hideTopbar = false,
  hideFooter = false,
  widePage = false,
  lockPageScroll = false,
}: StudentShellProps) {
  const { isCollapsed, toggleSidebar } = useWorkspaceSidebarState();

  return (
    <div className={styles.workspaceShell}>
      <div
        className={`${styles.workspaceLayout} ${widePage ? styles.workspaceLayoutWide : ""} ${
          isCollapsed ? styles.workspaceLayoutCollapsed : ""
        }`}
      >
        <div className={styles.workspaceSidebarSlot}>
          <StudentSidebar
            activePath={activePath}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        </div>

        <div
          className={`${styles.workspaceContent} ${
            lockPageScroll ? styles.workspaceContentLocked : ""
          }`}
        >
          {!hideTopbar ? <StudentTopBar activePath={activePath} title={topbarTitle} /> : null}
          <div
            className={`${styles.workspacePage} ${widePage ? styles.workspacePageWide : ""} ${
              lockPageScroll ? styles.workspacePageLocked : ""
            }`}
          >
            {children}
          </div>
          {!hideFooter ? <StudentFooter /> : null}
        </div>
      </div>
    </div>
  );
}
