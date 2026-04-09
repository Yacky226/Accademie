import type { ReactNode } from "react";
import type { WorkspaceNavIconName } from "../model/workspace-nav.types";

interface WorkspaceNavIconProps {
  name: WorkspaceNavIconName;
  className?: string;
}

interface IconFrameProps {
  className?: string;
  children: ReactNode;
}

function IconFrame({ className, children }: IconFrameProps) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function WorkspaceNavIcon({ name, className }: WorkspaceNavIconProps) {
  switch (name) {
    case "dashboard":
      return (
        <IconFrame className={className}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </IconFrame>
      );
    case "notifications":
      return (
        <IconFrame className={className}>
          <path d="M6 10a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </IconFrame>
      );
    case "courses":
      return (
        <IconFrame className={className}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
          <path d="M8.5 7.5H16" />
          <path d="M8.5 11.5H16" />
        </IconFrame>
      );
    case "evaluations":
      return (
        <IconFrame className={className}>
          <rect x="6" y="4" width="12" height="16" rx="2" />
          <path d="M9.5 4.5h5a1 1 0 0 1 1 1V7h-7V5.5a1 1 0 0 1 1-1z" />
          <path d="M9 11h6" />
          <path d="M9 15h4" />
          <path d="m8.7 10.8.9.9 1.6-2" />
        </IconFrame>
      );
    case "payments":
      return (
        <IconFrame className={className}>
          <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
          <path d="M3 10h18" />
          <path d="M7 14h4" />
        </IconFrame>
      );
    case "leaderboard":
      return (
        <IconFrame className={className}>
          <path d="M8 4h8v3.5A4 4 0 0 1 12 11.5 4 4 0 0 1 8 7.5z" />
          <path d="M16 5.5h2a2 2 0 0 1-2 3.5" />
          <path d="M8 5.5H6A2 2 0 0 0 8 9" />
          <path d="M12 11.5V16" />
          <path d="M9 20h6" />
          <path d="M10 16h4" />
        </IconFrame>
      );
    case "code":
      return (
        <IconFrame className={className}>
          <path d="m9 8-4 4 4 4" />
          <path d="m15 8 4 4-4 4" />
          <path d="m13 6-2 12" />
        </IconFrame>
      );
    case "logout":
      return (
        <IconFrame className={className}>
          <path d="M9 4.5H6.8A2.8 2.8 0 0 0 4 7.3v9.4a2.8 2.8 0 0 0 2.8 2.8H9" />
          <path d="M14 8.5 19 12l-5 3.5" />
          <path d="M10 12h9" />
        </IconFrame>
      );
    case "calendar":
      return (
        <IconFrame className={className}>
          <rect x="3" y="5" width="18" height="16" rx="2.2" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M3 10h18" />
        </IconFrame>
      );
    case "settings":
      return (
        <IconFrame className={className}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.5v2.3" />
          <path d="M12 19.2v2.3" />
          <path d="m4.9 4.9 1.6 1.6" />
          <path d="m17.5 17.5 1.6 1.6" />
          <path d="M2.5 12h2.3" />
          <path d="M19.2 12h2.3" />
          <path d="m4.9 19.1 1.6-1.6" />
          <path d="m17.5 6.5 1.6-1.6" />
        </IconFrame>
      );
    case "support":
      return (
        <IconFrame className={className}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
          <path d="m16.8 7.2-2.6 2.6" />
          <path d="m9.8 14.2-2.6 2.6" />
          <path d="m16.8 16.8-2.6-2.6" />
          <path d="m9.8 9.8-2.6-2.6" />
        </IconFrame>
      );
    case "users":
      return (
        <IconFrame className={className}>
          <circle cx="9" cy="8" r="3" />
          <path d="M4.5 19a4.5 4.5 0 0 1 9 0" />
          <path d="M16.5 11a2.5 2.5 0 1 0 0-5" />
          <path d="M15.5 19a3.5 3.5 0 0 1 3.5-3.5" />
        </IconFrame>
      );
    case "announcements":
      return (
        <IconFrame className={className}>
          <path d="M4 10v4" />
          <path d="m4 10 10-4v12L4 14" />
          <path d="M14 10h3a2 2 0 1 1 0 4h-3" />
          <path d="m6 14 1.5 4" />
        </IconFrame>
      );
    case "analytics":
      return (
        <IconFrame className={className}>
          <path d="M5 19v-6" />
          <path d="M12 19V6" />
          <path d="M19 19v-9" />
          <path d="M3 19h18" />
        </IconFrame>
      );
    case "audit":
      return (
        <IconFrame className={className}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
        </IconFrame>
      );
    case "systemHealth":
      return (
        <IconFrame className={className}>
          <rect x="3" y="5" width="18" height="14" rx="2.2" />
          <path d="M7 12h2l2-3 2 6 2-4h2" />
        </IconFrame>
      );
    default:
      return (
        <IconFrame className={className}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </IconFrame>
      );
  }
}
