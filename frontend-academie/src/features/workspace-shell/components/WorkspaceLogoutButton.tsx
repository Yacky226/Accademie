"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useAuthStoreDispatch } from "@/core/store/auth-store-hooks";
import { logoutThunk } from "@/features/auth/model/auth.slice";
import type { WorkspaceNavIconName } from "../model/workspace-nav.types";
import { WorkspaceNavIcon } from "./WorkspaceNavIcon";

interface WorkspaceLogoutButtonProps {
  className: string;
  iconClassName?: string;
  iconName?: WorkspaceNavIconName;
  labelClassName?: string;
  label?: string;
  redirectHref?: string;
}

export function WorkspaceLogoutButton({
  className,
  iconClassName,
  iconName,
  labelClassName,
  label = "Logout",
  redirectHref = "/auth/login",
}: WorkspaceLogoutButtonProps) {
  const dispatch = useAuthStoreDispatch();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    await dispatch(logoutThunk());

    startTransition(() => {
      router.replace(redirectHref);
      router.refresh();
    });
  };

  return (
    <button
      aria-label={isPending ? "Logging out..." : label}
      className={className}
      disabled={isPending}
      onClick={handleLogout}
      title={label}
      type="button"
    >
      {iconName ? (
        <span className={iconClassName}>
          <WorkspaceNavIcon name={iconName} />
        </span>
      ) : null}
      <span className={labelClassName}>{isPending ? "Logging out..." : label}</span>
    </button>
  );
}
