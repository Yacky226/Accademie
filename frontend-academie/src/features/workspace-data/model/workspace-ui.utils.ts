export function getWorkspaceInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "AA";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function slugifyWorkspaceValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function formatWorkspaceDate(value: string | null | undefined) {
  if (!value) {
    return "Non planifie";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Non planifie";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatWorkspaceDateTime(value: string | null | undefined) {
  if (!value) {
    return "Non planifie";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Non planifie";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function toDateTimeLocalInputValue(
  value: string | null | undefined,
  fallbackOffsetHours = 0,
) {
  const sourceDate = value ? new Date(value) : new Date();
  const date = Number.isNaN(sourceDate.getTime())
    ? new Date()
    : sourceDate;

  if (!value && fallbackOffsetHours !== 0) {
    date.setHours(date.getHours() + fallbackOffsetHours);
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function formatWorkspacePercent(value: number) {
  return `${Math.round(value)}%`;
}
