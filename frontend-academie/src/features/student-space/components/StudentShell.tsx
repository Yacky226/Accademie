import type { ReactNode } from "react";
import styles from "../student-space.module.css";
import { StudentFooter } from "./StudentFooter";
import { StudentSidebar } from "./StudentSidebar";
import { StudentTopBar } from "./StudentTopBar";

interface StudentShellProps {
  activePath: string;
  topbarTitle: string;
  children: ReactNode;
  hideTopbar?: boolean;
}

export function StudentShell({
  activePath,
  topbarTitle,
  children,
  hideTopbar = false,
}: StudentShellProps) {
  return (
    <div className={styles.workspaceShell}>
      <div className={styles.workspaceLayout}>
        <div className={styles.workspaceSidebarSlot}>
          <StudentSidebar activePath={activePath} />
        </div>

        <div className={styles.workspaceContent}>
          {!hideTopbar ? <StudentTopBar activePath={activePath} title={topbarTitle} /> : null}
          <div className={styles.workspacePage}>{children}</div>
          <StudentFooter />
        </div>
      </div>
    </div>
  );
}
