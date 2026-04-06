"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useAuthStoreDispatch } from "@/core/store/auth-store-hooks";
import { logoutThunk } from "@/features/auth/model/auth.slice";

interface WorkspaceLogoutButtonProps {
  className: string;
  label?: string;
  redirectHref?: string;
}

export function WorkspaceLogoutButton({
  className,
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
    <button className={className} disabled={isPending} onClick={handleLogout} type="button">
      {isPending ? "Logging out..." : label}
    </button>
  );
}
