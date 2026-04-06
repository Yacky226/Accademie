"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { formatUserRoleLabel } from "@/entities/user/model/user-session.types";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";

interface WorkspaceProfileBadgeProps {
  href: string;
  linkClassName: string;
  avatarShellClassName: string;
  avatarImageClassName: string;
  avatarFallbackClassName: string;
  metaClassName: string;
  nameClassName: string;
  roleClassName: string;
  defaultName: string;
  defaultRole: string;
  defaultAvatarSrc?: string | null;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "AA";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function WorkspaceProfileBadge({
  href,
  linkClassName,
  avatarShellClassName,
  avatarImageClassName,
  avatarFallbackClassName,
  metaClassName,
  nameClassName,
  roleClassName,
  defaultName,
  defaultRole,
  defaultAvatarSrc = null,
}: WorkspaceProfileBadgeProps) {
  const { isAuthenticated, user } = useCurrentAuthSession();
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);
  const profileName = isAuthenticated && user ? user.name : defaultName;
  const profileRole =
    isAuthenticated && user ? formatUserRoleLabel(user.role) : defaultRole;
  const preferredAvatarSrc = isAuthenticated && user ? user.avatarUrl : defaultAvatarSrc;
  const avatarSrc =
    preferredAvatarSrc && failedAvatarSrc !== preferredAvatarSrc ? preferredAvatarSrc : null;
  const initials = useMemo(() => getInitials(profileName), [profileName]);

  return (
    <Link className={linkClassName} href={href}>
      <span className={avatarShellClassName}>
        {avatarSrc ? (
          <Image
            alt={profileName}
            className={avatarImageClassName}
            height={96}
            onError={() => setFailedAvatarSrc(preferredAvatarSrc)}
            sizes="48px"
            src={avatarSrc}
            width={96}
          />
        ) : (
          <span aria-hidden className={avatarFallbackClassName}>
            {initials}
          </span>
        )}
      </span>
      <span className={metaClassName}>
        <strong className={nameClassName}>{profileName}</strong>
        <span className={roleClassName}>{profileRole}</span>
      </span>
    </Link>
  );
}
