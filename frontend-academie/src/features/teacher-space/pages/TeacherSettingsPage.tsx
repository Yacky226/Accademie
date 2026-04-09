"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useAppDispatch } from "@/core/store/app-store-hooks";
import { fetchCurrentSessionThunk } from "@/features/auth/model/auth.slice";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import { AccountSecurityPanel } from "@/features/auth/ui/components/AccountSecurityPanel";
import {
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
} from "@/features/users/api/user-profile.client";
import type {
  UpdateUserProfilePayload,
  UserProfile,
} from "@/features/users/model/user-profile.types";
import {
  fetchWorkspaceCourses,
  fetchWorkspaceEvaluations,
  fetchWorkspaceMyCalendarEvents,
} from "@/features/workspace-data/api/workspace-api.client";
import {
  formatWorkspaceDate,
  getWorkspaceInitials,
} from "@/features/workspace-data/model/workspace-ui.utils";
import styles from "../teacher-space.module.css";
import { TeacherShell } from "../components/TeacherShell";

const EMPTY_FORM: UpdateUserProfilePayload = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  bio: "",
};

function toForm(profile: UserProfile): UpdateUserProfilePayload {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    country: profile.country,
    bio: profile.bio,
  };
}

export function TeacherSettingsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useCurrentAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [courseCount, setCourseCount] = useState(0);
  const [evaluationCount, setEvaluationCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const avatarSrc = profile?.avatarUrl ?? user?.avatarUrl ?? null;
  const fullName = profile?.fullName || user?.name || "Teacher";
  const hasChanges =
    profile !== null &&
    (profile.firstName !== form.firstName ||
      profile.lastName !== form.lastName ||
      profile.email !== form.email ||
      profile.phone !== form.phone ||
      profile.city !== form.city ||
      profile.country !== form.country ||
      profile.bio !== form.bio);

  useEffect(() => {
    void loadSettings();
  }, [user?.id]);

  async function loadSettings() {
    setLoading(true);

    try {
      const [currentProfile, courses, evaluations, events] = await Promise.all([
        fetchCurrentUserProfile(),
        fetchWorkspaceCourses(),
        fetchWorkspaceEvaluations(),
        fetchWorkspaceMyCalendarEvents(),
      ]);

      setProfile(currentProfile);
      setForm(toForm(currentProfile));
      setCourseCount(user?.id ? courses.filter((course) => course.creator.id === user.id).length : courses.length);
      setEvaluationCount(
        user?.id
          ? evaluations.filter((evaluation) => evaluation.creator.id === user.id).length
          : evaluations.length,
      );
      setEventCount(user?.id ? events.filter((event) => event.createdBy.id === user.id).length : events.length);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger les parametres Teacher.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function syncSessionState() {
    await dispatch(fetchCurrentSessionThunk()).unwrap();
    router.refresh();
  }

  async function handleSave() {
    if (!profile) {
      return;
    }

    setSaving(true);
    try {
      const nextProfile = await updateCurrentUserProfile(form);
      setProfile(nextProfile);
      setForm(toForm(nextProfile));
      setSuccessMessage("Le profil Teacher a ete mis a jour.");
      setErrorMessage(null);
      await syncSessionState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d enregistrer le profil.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const nextProfile = await uploadCurrentUserAvatar(file);
      setProfile(nextProfile);
      setForm(toForm(nextProfile));
      setSuccessMessage("La photo Teacher a ete mise a jour.");
      setErrorMessage(null);
      await syncSessionState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d envoyer la photo.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <TeacherShell activePath="/teacher/settings" title="Parametres Teacher">
      <section>
        <h2 className={styles.sectionTitle}>Profil Teacher</h2>
        <p className={styles.sectionSub}>
          Mettez a jour votre identite, votre photo et vos informations de contact avec vos
          donnees reelles.
        </p>
      </section>

      {errorMessage ? <p className={`${styles.sectionSub} ${styles.messageError}`}>{errorMessage}</p> : null}
      {successMessage ? (
        <p className={`${styles.sectionSub} ${styles.messageSuccess}`}>{successMessage}</p>
      ) : null}

      <section className={`${styles.gridKpi} ${styles.sectionSpacing}`}>
        <Stat label="Cours" value={String(courseCount)} note="Cours relies a votre compte" />
        <Stat label="Evaluations" value={String(evaluationCount)} note="QCM et devoirs crees" />
        <Stat label="Sessions" value={String(eventCount)} note="Evenements planifies" />
        <Stat label="Compte" value={profile?.emailVerified ? "Verifie" : "A verifier"} note={`Depuis ${formatWorkspaceDate(profile?.createdAt)}`} />
      </section>

      <section className={styles.split}>
        <article className={styles.card}>
          <h3>Identite</h3>
          <div className={styles.profileStack}>
            <div className={styles.rowWrapCenter}>
              {avatarSrc ? (
                <Image
                  alt={fullName}
                  className={styles.avatarFrame}
                  height={112}
                  src={avatarSrc}
                  width={112}
                />
              ) : (
                <div className={styles.avatarFallback}>
                  {getWorkspaceInitials(fullName)}
                </div>
              )}
              <div className={styles.avatarActions}>
                <strong>{fullName}</strong>
                <label className={`${styles.ghostBtn} ${styles.inlineCenterButton}`}>
                  {uploading ? "Envoi..." : "Changer la photo"}
                  <input className={styles.hiddenInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarSelection} />
                </label>
              </div>
            </div>

            <div className={styles.formGrid}>
              <input className={styles.input} disabled={loading || saving} placeholder="Prenom" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
              <input className={styles.input} disabled={loading || saving} placeholder="Nom" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
              <input className={styles.input} disabled={loading || saving} placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              <input className={styles.input} disabled={loading || saving} placeholder="Telephone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              <input className={styles.input} disabled={loading || saving} placeholder="Ville" value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} />
              <input className={styles.input} disabled={loading || saving} placeholder="Pays" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
              <textarea className={styles.textarea} disabled={loading || saving} placeholder="Bio Teacher" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
            </div>
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.primaryBtn} disabled={!hasChanges || saving || uploading} type="button" onClick={() => void handleSave()}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </article>

        <article className={styles.card}>
          <h3>Compte Teacher</h3>
          <div className={styles.infoList}>
            <Info label="Role" value="Teacher" />
            <Info label="Email verifie" value={profile?.emailVerified ? "Oui" : "Non"} />
            <Info label="Derniere connexion" value={formatWorkspaceDate(profile?.lastLoginAt)} />
            <Info label="Membre depuis" value={formatWorkspaceDate(profile?.createdAt)} />
          </div>
        </article>
      </section>

      <AccountSecurityPanel
        description="Fermez vos sessions actives et gardez le compte Teacher protege sur vos differents appareils."
        eyebrow="Teacher security"
        title="Securiser l espace Teacher"
      />
    </TeacherShell>
  );
}

function Stat({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: string;
}) {
  return (
    <article className={styles.card}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      <p className={styles.kpiTrend}>{note}</p>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.metricValueCompact}>{value}</strong>
    </div>
  );
}
