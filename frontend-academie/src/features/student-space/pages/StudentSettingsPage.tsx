"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
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
import { StudentShell } from "../components/StudentShell";
import styles from "../student-space.module.css";

const EMPTY_FORM: UpdateUserProfilePayload = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  bio: "",
};

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

function toProfileForm(profile: UserProfile): UpdateUserProfilePayload {
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

export function StudentSettingsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useCurrentAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UpdateUserProfilePayload>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const currentProfile = await fetchCurrentUserProfile();

        if (!isActive) {
          return;
        }

        setProfile(currentProfile);
        setForm(toProfileForm(currentProfile));
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger votre profil.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  const profileName = profile?.fullName || user?.name || "Architect Academy Student";
  const avatarSrc = profile?.avatarUrl ?? user?.avatarUrl ?? null;
  const hasChanges =
    profile !== null &&
    (profile.firstName !== form.firstName ||
      profile.lastName !== form.lastName ||
      profile.email !== form.email ||
      profile.phone !== form.phone ||
      profile.city !== form.city ||
      profile.country !== form.country ||
      profile.bio !== form.bio);

  function updateField<K extends keyof UpdateUserProfilePayload>(
    field: K,
    value: UpdateUserProfilePayload[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function syncSessionState() {
    await dispatch(fetchCurrentSessionThunk()).unwrap();
    router.refresh();
  }

  async function handleSaveProfile() {
    if (!profile) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedProfile = await updateCurrentUserProfile(form);
      setProfile(updatedProfile);
      setForm(toProfileForm(updatedProfile));
      setSuccessMessage("Votre profil a ete mis a jour.");
      await syncSessionState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de mettre a jour le profil.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarSelection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedProfile = await uploadCurrentUserAvatar(file);
      setProfile(updatedProfile);
      setForm(toProfileForm(updatedProfile));
      setSuccessMessage("Votre photo de profil a ete mise a jour.");
      await syncSessionState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d envoyer la photo.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleResetChanges() {
    if (!profile) {
      return;
    }

    setForm(toProfileForm(profile));
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  return (
    <StudentShell activePath="/student/settings" topbarTitle="Parametres">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.pageEyebrow}>Student profile</p>
          <h1 className={styles.heroTitle}>Parametres de Compte</h1>
          <p className={styles.heroSub}>
            Mettez a jour vos informations personnelles et votre photo de profil depuis cet espace.
          </p>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.ghostBtn}
            disabled={!hasChanges || isSaving || isUploading}
            onClick={handleResetChanges}
          >
            Annuler
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!hasChanges || isLoading || isSaving || isUploading}
            onClick={() => void handleSaveProfile()}
          >
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </section>

      {errorMessage ? <p className={styles.settingsStatusError}>{errorMessage}</p> : null}
      {successMessage ? <p className={styles.settingsStatusSuccess}>{successMessage}</p> : null}

      <div className={styles.settingsGrid}>
        <article className={styles.settingsSectionCard}>
          <div className={styles.settingsSectionHead}>
            <div>
              <span className={styles.supportInsightLabel}>Profile data</span>
              <h2>Mon Profil</h2>
            </div>
          </div>

          <div className={styles.settingsProfileEditor}>
            <div className={styles.settingsAvatarPanel}>
              {avatarSrc ? (
                <Image
                  className={styles.settingsAvatarImage}
                  src={avatarSrc}
                  alt={profileName}
                  height={176}
                  sizes="112px"
                  width={176}
                />
              ) : (
                <div aria-hidden className={styles.settingsAvatarFallback}>
                  {getInitials(profileName)}
                </div>
              )}

              <div className={styles.settingsPhotoActions}>
                <label className={`${styles.ghostBtn} ${styles.settingsPhotoButton}`}>
                  {isUploading ? "Envoi..." : "Changer la photo"}
                  <input
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className={styles.settingsHiddenInput}
                    disabled={isUploading}
                    onChange={handleAvatarSelection}
                    type="file"
                  />
                </label>
                <p className={styles.settingsFieldHint}>PNG, JPG, WEBP ou GIF, maximum 5 Mo.</p>
              </div>
            </div>

            <div className={styles.settingsFormGrid}>
              <label className={styles.settingsFormField}>
                <span>Prenom</span>
                <input
                  className={styles.settingsInput}
                  disabled={isLoading || isSaving}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder="Votre prenom"
                  type="text"
                  value={form.firstName}
                />
              </label>

              <label className={styles.settingsFormField}>
                <span>Nom</span>
                <input
                  className={styles.settingsInput}
                  disabled={isLoading || isSaving}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  placeholder="Votre nom"
                  type="text"
                  value={form.lastName}
                />
              </label>

              <label className={styles.settingsFormField}>
                <span>Email</span>
                <input
                  className={styles.settingsInput}
                  disabled={isLoading || isSaving}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="nom@academie.com"
                  type="email"
                  value={form.email}
                />
              </label>

              <label className={styles.settingsFormField}>
                <span>Telephone</span>
                <input
                  className={styles.settingsInput}
                  disabled={isLoading || isSaving}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="+212 ..."
                  type="tel"
                  value={form.phone}
                />
              </label>

              <label className={styles.settingsFormField}>
                <span>Ville</span>
                <input
                  className={styles.settingsInput}
                  disabled={isLoading || isSaving}
                  onChange={(event) => updateField("city", event.target.value)}
                  placeholder="Votre ville"
                  type="text"
                  value={form.city}
                />
              </label>

              <label className={styles.settingsFormField}>
                <span>Pays</span>
                <input
                  className={styles.settingsInput}
                  disabled={isLoading || isSaving}
                  onChange={(event) => updateField("country", event.target.value)}
                  placeholder="Votre pays"
                  type="text"
                  value={form.country}
                />
              </label>

              <label className={`${styles.settingsFormField} ${styles.settingsFormFieldWide}`}>
                <span>Bio</span>
                <textarea
                  className={styles.settingsTextarea}
                  disabled={isLoading || isSaving}
                  onChange={(event) => updateField("bio", event.target.value)}
                  placeholder="Ajoutez quelques mots sur votre parcours ou vos objectifs."
                  rows={5}
                  value={form.bio}
                />
              </label>
            </div>
          </div>
        </article>
      </div>

      <AccountSecurityPanel
        description="Manage verification, trusted sessions and cross-device access without leaving the student workspace."
        eyebrow="Student identity security"
        title="Secure your learning account"
      />
    </StudentShell>
  );
}
