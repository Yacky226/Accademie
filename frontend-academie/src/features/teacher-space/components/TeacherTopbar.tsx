import { WorkspaceProfileBadge } from "@/features/workspace-shell/components/WorkspaceProfileBadge";
import { WorkspaceChromeIcon } from "@/features/workspace-shell/components/WorkspaceChromeIcon";
import styles from "../teacher-space.module.css";

interface TeacherTopbarProps {
  activePath: string;
  title: string;
}

export function TeacherTopbar({ activePath, title }: TeacherTopbarProps) {
  const statusLabel =
    activePath === "/teacher/evaluations"
      ? "Evaluation workflows"
      : activePath === "/teacher/programs"
        ? "Course delivery workspace"
        : "Teaching workspace";

  return (
    <header className={styles.workspaceTopbar}>
      <div className={styles.topbarLead}>
        <span className={styles.workspaceBadge}>Teacher space</span>
        <div className={styles.topbarTitleWrap}>
          <h1>{title}</h1>
          <p className={styles.topbarSubtitle}>
            Manage cohorts, evaluation quality and course delivery without losing context.
          </p>
        </div>
      </div>

      <div className={styles.topbarRight}>
        <label className={styles.searchShell}>
          <WorkspaceChromeIcon className={styles.searchIcon} name="search" />
          <input
            aria-label="Search teacher workspace"
            className={styles.search}
            placeholder="Search learners, sessions, modules..."
          />
        </label>

        <span className={styles.topbarStatus}>
          <WorkspaceChromeIcon className={styles.topbarStatusIcon} name="spark" />
          {statusLabel}
        </span>

        <WorkspaceProfileBadge
          avatarFallbackClassName={styles.avatarFallback}
          avatarImageClassName={styles.avatarImage}
          avatarShellClassName={styles.avatarShell}
          defaultName="Teacher"
          defaultRole="Mentor"
          href="/teacher/settings"
          linkClassName={styles.profileCard}
          metaClassName={styles.profileMeta}
          nameClassName={styles.profileName}
          roleClassName={styles.profileRole}
        />
      </div>
    </header>
  );
}
