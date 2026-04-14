"use client";

import styles from "../admin-space.module.css";

type AdminDangerConfirmActionProps = {
  busy?: boolean;
  busyLabel?: string;
  confirmLabel?: string;
  confirming: boolean;
  disabled?: boolean;
  idleLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  onRequestConfirm: () => void;
};

export function AdminDangerConfirmAction({
  busy = false,
  busyLabel = "Suppression...",
  confirmLabel = "Confirmer",
  confirming,
  disabled = false,
  idleLabel = "Delete",
  onCancel,
  onConfirm,
  onRequestConfirm,
}: AdminDangerConfirmActionProps) {
  if (confirming) {
    return (
      <>
        <button
          type="button"
          className={styles.dangerBtn}
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          disabled={busy}
          onClick={onCancel}
        >
          Annuler
        </button>
      </>
    );
  }

  return (
    <button
      type="button"
      className={styles.dangerBtn}
      disabled={busy || disabled}
      onClick={onRequestConfirm}
    >
      {busy ? busyLabel : idleLabel}
    </button>
  );
}
