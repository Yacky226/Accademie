import { WorkspaceProfileBadge } from "@/features/shared/components/WorkspaceProfileBadge";
import styles from "../teacher-space.module.css";

interface TeacherTopbarProps {
  activePath: string;
  title: string;
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16L20 20" />
    </svg>
  );
}

export function TeacherTopbar({ activePath, title }: TeacherTopbarProps) {
  const statusLabel =
    activePath === "/teacher/evaluations" ? "17 reviews pending" : "9 live sessions this week";

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
          <SearchIcon className={styles.searchIcon} />
          <input
            aria-label="Search teacher workspace"
            className={styles.search}
            placeholder="Search learners, sessions, modules..."
          />
        </label>

        <span className={styles.topbarStatus}>{statusLabel}</span>

        <WorkspaceProfileBadge
          avatarFallbackClassName={styles.avatarFallback}
          avatarImageClassName={styles.avatarImage}
          avatarShellClassName={styles.avatarShell}
          defaultAvatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDxwstNUnCev--Q0rFTSV_i1Ai4jzKw698fvDZm6JX5N7adx-NxiBm0c_xbJZGspNmMAfYjpbnK6nfGpZPkK53gI5m41dI45tRuz79IarMXh2v-u3pwgysXLqgU_zv1ZtuZhRvBXq-pKBIte7QX022m-0YgR5p_2Ss7d3OOJrw1urU3iE_5cnOpDaCetiHnqJMYoRsPaVY4foMmIhRPlX7IGP9p-57J4HUd0CSuGmpfeyOyZFWU_8a5R6VdA2KJnCwBSpGR5qWwqXP5"
          defaultName="Sarah Jenkins"
          defaultRole="Lead Mentor"
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
