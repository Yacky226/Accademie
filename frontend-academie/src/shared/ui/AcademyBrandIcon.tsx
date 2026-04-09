interface AcademyBrandIconProps {
  className?: string;
}

export function AcademyBrandIcon({ className }: AcademyBrandIconProps) {
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
      <path d="m3 10 9-5 9 5" />
      <path d="M5.5 10.8V18h13v-7.2" />
      <path d="M9 18v-4.5h6V18" />
      <path d="M12 5v13" />
      <path d="M7.5 10.8h9" />
    </svg>
  );
}
