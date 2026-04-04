import type { ReactNode } from "react";
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
  return (
    <div className={styles.workspaceShell}>
      <div className={styles.workspaceLayout}>
        <div className={styles.workspaceSidebarSlot}>
          <TeacherSidebar activePath={activePath} />
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
