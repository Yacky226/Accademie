import type { ReactNode } from "react";

export type WorkspaceChromeIconName = "bell" | "pulse" | "search" | "spark";

interface WorkspaceChromeIconProps {
  name: WorkspaceChromeIconName;
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

export function WorkspaceChromeIcon({ name, className }: WorkspaceChromeIconProps) {
  switch (name) {
    case "search":
      return (
        <IconFrame className={className}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16L20 20" />
        </IconFrame>
      );
    case "bell":
      return (
        <IconFrame className={className}>
          <path d="M7.8 17H16.2A1.8 1.8 0 0 0 18 15.2V10.8A6 6 0 0 0 13.5 5V4.5A1.5 1.5 0 0 0 12 3a1.5 1.5 0 0 0-1.5 1.5V5A6 6 0 0 0 6 10.8v4.4A1.8 1.8 0 0 0 7.8 17Z" />
          <path d="M10 18.5a2.2 2.2 0 0 0 4 0" />
        </IconFrame>
      );
    case "spark":
      return (
        <IconFrame className={className}>
          <path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3Z" />
          <path d="m18.5 14 .7 1.9L21 16.6l-1.8.6-.7 1.8-.6-1.8-1.9-.7 1.9-.7Z" />
          <path d="m6 14 .9 2.4L9.3 17l-2.4.8L6 20.2l-.8-2.4L2.8 17l2.4-.6Z" />
        </IconFrame>
      );
    case "pulse":
      return (
        <IconFrame className={className}>
          <path d="M3 12h4l2.2-4 3.2 8 2.3-5H21" />
        </IconFrame>
      );
    default:
      return (
        <IconFrame className={className}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16L20 20" />
        </IconFrame>
      );
  }
}
