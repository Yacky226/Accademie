"use client";

import type { ReactNode } from "react";
import { useWorkspaceSidebarState } from "@/features/workspace-shell/hooks/useWorkspaceSidebarState";
import styles from "../teacher-space.module.css";
import { TeacherFooter } from "./TeacherFooter";
import { TeacherSidebar } from "./TeacherSidebar";
import { TeacherTopbar } from "./TeacherTopbar";

interface TeacherShellProps {
  activePath: string;
  title: string;
  children: ReactNode;
}

export function TeacherShell({ activePath, title, children }: TeacherShellProps) {
  const { isCollapsed, toggleSidebar } = useWorkspaceSidebarState();

  return (
    <div className={styles.workspaceShell}>
      <div
        className={`${styles.workspaceLayout} ${isCollapsed ? styles.workspaceLayoutCollapsed : ""}`}
      >
        <div className={styles.workspaceSidebarSlot}>
          <TeacherSidebar
            activePath={activePath}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        </div>
        <div className={styles.workspaceContent}>
          <TeacherTopbar activePath={activePath} title={title} />
          <div className={styles.workspacePage}>{children}</div>
          <TeacherFooter />
        </div>
      </div>
    </div>
  );
}
