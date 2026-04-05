"use client";

interface WorkspaceSidebarToggleProps {
  className: string;
  isCollapsed: boolean;
  onClick: () => void;
}

export function WorkspaceSidebarToggle({
  className,
  isCollapsed,
  onClick,
}: WorkspaceSidebarToggleProps) {
  const ariaLabel = isCollapsed ? "Open sidebar" : "Collapse sidebar";

  return (
    <button
      aria-label={ariaLabel}
      className={className}
      onClick={onClick}
      title={ariaLabel}
      type="button"
    >
      <svg
        aria-hidden
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <rect x="3.5" y="4" width="17" height="16" rx="3.5" />
        <path d="M9 4V20" />
        {isCollapsed ? <path d="M13 12H18M16 9L19 12L16 15" /> : <path d="M18 12H13M15 9L12 12L15 15" />}
      </svg>
    </button>
  );
}
