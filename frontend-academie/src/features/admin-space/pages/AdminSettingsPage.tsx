"use client";

import { AccountSecurityPanel } from "@/features/auth/ui/components/AccountSecurityPanel";
import { useEffect, useMemo, useState } from "react";
import {
  createAdminSetting,
  fetchAdminSettings,
  updateAdminSetting,
} from "../admin-space.client";
import type { AdminSettingRecord } from "../admin-space.types";
import styles from "../admin-space.module.css";
import { AdminShell } from "../components/AdminShell";

type SettingsForm = {
  maintenanceBanner: string;
  maintenanceMode: boolean;
  mfaRequired: boolean;
  platformName: string;
  primaryColor: string;
  statusPageSync: boolean;
  supportEmail: string;
  timezone: string;
};

const INITIAL_FORM: SettingsForm = {
  maintenanceBanner:
    "No maintenance window is currently planned. Platform services are operating normally.",
  maintenanceMode: false,
  mfaRequired: true,
  platformName: "Architect Academy",
  primaryColor: "#004AC6",
  statusPageSync: true,
  supportEmail: "support@architectacademy.com",
  timezone: "Africa/Casablanca",
};

function isEnabled(value: string | undefined, fallback = false) {
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function getSettingMap(settings: AdminSettingRecord[]) {
  return new Map(settings.map((setting) => [setting.key, setting]));
}

function buildSettingsForm(settings: AdminSettingRecord[]): SettingsForm {
  const settingsMap = getSettingMap(settings);

  return {
    maintenanceBanner:
      settingsMap.get("platform.maintenanceBanner")?.value ??
      INITIAL_FORM.maintenanceBanner,
    maintenanceMode: isEnabled(
      settingsMap.get("platform.maintenanceMode")?.value,
      INITIAL_FORM.maintenanceMode,
    ),
    mfaRequired: isEnabled(
      settingsMap.get("security.mfaRequired")?.value,
      INITIAL_FORM.mfaRequired,
    ),
    platformName: settingsMap.get("platform.name")?.value ?? INITIAL_FORM.platformName,
    primaryColor:
      settingsMap.get("platform.primaryColor")?.value ?? INITIAL_FORM.primaryColor,
    statusPageSync: isEnabled(
      settingsMap.get("platform.statusPageSync")?.value,
      INITIAL_FORM.statusPageSync,
    ),
    supportEmail:
      settingsMap.get("platform.supportEmail")?.value ?? INITIAL_FORM.supportEmail,
    timezone: settingsMap.get("platform.timezone")?.value ?? INITIAL_FORM.timezone,
  };
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettingRecord[]>([]);
  const [form, setForm] = useState<SettingsForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadSettings() {
      setLoading(true);

      try {
        const nextSettings = await fetchAdminSettings();
        if (!isActive) {
          return;
        }

        setSettings(nextSettings);
        setForm(buildSettingsForm(nextSettings));
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de charger les parametres.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isActive = false;
    };
  }, []);

  const integrationCount = useMemo(() => settings.length, [settings]);

  async function reloadSettings() {
    setLoading(true);

    try {
      const nextSettings = await fetchAdminSettings();
      setSettings(nextSettings);
      setForm(buildSettingsForm(nextSettings));
      setErrorMessage(null);
      setSuccessMessage("Les parametres ont ete resynchronises.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger les parametres.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function upsertSetting(
    settingKey: string,
    value: string,
    description: string,
    isPublic = false,
  ) {
    const existing = settings.find((setting) => setting.key === settingKey);

    if (existing) {
      return updateAdminSetting(settingKey, { description, isPublic, value });
    }

    return createAdminSetting({
      description,
      isPublic,
      key: settingKey,
      value,
    });
  }

  async function handleSave() {
    setSaving(true);

    try {
      const nextSettings = await Promise.all([
        upsertSetting("platform.name", form.platformName, "Nom principal de la plateforme", true),
        upsertSetting(
          "platform.primaryColor",
          form.primaryColor,
          "Couleur principale utilisee dans le shell marketing et workspace",
          true,
        ),
        upsertSetting(
          "platform.supportEmail",
          form.supportEmail,
          "Adresse support exposee dans les interfaces",
          true,
        ),
        upsertSetting(
          "platform.timezone",
          form.timezone,
          "Fuseau de reference pour l exploitation",
          true,
        ),
        upsertSetting(
          "platform.maintenanceBanner",
          form.maintenanceBanner,
          "Message de maintenance affiche aux utilisateurs",
          true,
        ),
        upsertSetting(
          "security.mfaRequired",
          String(form.mfaRequired),
          "Obligation de MFA pour les comptes privilegies",
        ),
        upsertSetting(
          "platform.maintenanceMode",
          String(form.maintenanceMode),
          "Activation du mode maintenance",
        ),
        upsertSetting(
          "platform.statusPageSync",
          String(form.statusPageSync),
          "Synchronisation du statut public",
        ),
      ]);

      setSettings(nextSettings);
      setSuccessMessage("Les parametres admin ont ete enregistres.");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d enregistrer les parametres.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell activePath="/admin/settings" title="Parametres du Systeme">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.pageEyebrow}>System governance</p>
          <h1 className={styles.heroTitle}>Configuration Globale</h1>
          <p className={styles.heroSub}>
            Parametres platforme relies au backend academie pour la marque, la securite et la
            continuite de service.
          </p>
          {errorMessage ? <p className={styles.heroSub}>{errorMessage}</p> : null}
          {successMessage ? <p className={styles.heroSub}>{successMessage}</p> : null}
        </div>
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.ghostBtn}
            disabled={loading}
            onClick={() => void reloadSettings()}
          >
            {loading ? "Chargement..." : "Rafraichir les parametres"}
          </button>
          <button type="button" className={styles.primaryBtn} disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </section>

      <section className={styles.settingsOverviewGrid}>
        <article className={styles.settingsOverviewCard}>
          <span>Brand integrity</span>
          <strong>{form.platformName}</strong>
          <p>Le nom plateforme et la couleur principale sont maintenant persistants.</p>
        </article>
        <article className={styles.settingsOverviewCard}>
          <span>Security posture</span>
          <strong>{form.mfaRequired ? "Protected" : "Review needed"}</strong>
          <p>Le flag MFA admin est stocke dans la configuration academie.</p>
        </article>
        <article className={styles.settingsOverviewCard}>
          <span>Integrations</span>
          <strong>{loading ? "..." : `${integrationCount} active`}</strong>
          <p>Parametres charges depuis le backend sans fallback statique.</p>
        </article>
      </section>

      <section className={styles.settingsLayoutGrid}>
        <article className={styles.settingsFormPanel}>
          <div className={styles.settingsPanelHeader}>
            <div>
              <span className={styles.ticketOpsPill}>Brand system</span>
              <h2>Platform identity and editorial rules</h2>
            </div>
          </div>

          <div className={styles.settingsFieldGrid}>
            <label className={styles.settingsField}>
              <span>Platform name</span>
              <input
                className={styles.settingsInput}
                value={form.platformName}
                onChange={(event) => setForm((current) => ({ ...current, platformName: event.target.value }))}
              />
            </label>
            <label className={styles.settingsField}>
              <span>Primary color</span>
              <input
                className={styles.settingsInput}
                value={form.primaryColor}
                onChange={(event) => setForm((current) => ({ ...current, primaryColor: event.target.value }))}
              />
            </label>
            <label className={styles.settingsField}>
              <span>Support email</span>
              <input
                className={styles.settingsInput}
                value={form.supportEmail}
                onChange={(event) => setForm((current) => ({ ...current, supportEmail: event.target.value }))}
              />
            </label>
            <label className={styles.settingsField}>
              <span>Operational timezone</span>
              <select
                className={styles.settingsInput}
                value={form.timezone}
                onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))}
              >
                <option>Africa/Casablanca</option>
                <option>Europe/Paris</option>
                <option>UTC</option>
              </select>
            </label>
          </div>

          <label className={styles.settingsField}>
            <span>Maintenance banner message</span>
            <textarea
              className={styles.settingsTextarea}
              value={form.maintenanceBanner}
              onChange={(event) => setForm((current) => ({ ...current, maintenanceBanner: event.target.value }))}
            />
          </label>
        </article>

        <aside className={styles.securityStack}>
          <article className={styles.securityCard}>
            <span className={styles.ticketOpsPill}>Security controls</span>
            <h3>Authentication and access policy</h3>
            <div className={styles.integrationList}>
              <button
                type="button"
                className={styles.integrationRow}
                onClick={() => setForm((current) => ({ ...current, mfaRequired: !current.mfaRequired }))}
              >
                <div>
                  <strong>Mandatory MFA</strong>
                  <p>Required for admin and teacher roles on every sign in.</p>
                </div>
                <span className={`${styles.adminToggle} ${form.mfaRequired ? styles.adminToggleOn : ""}`} />
              </button>
            </div>
          </article>

          <article className={styles.securityCard}>
            <span className={styles.ticketOpsPill}>Service health</span>
            <h3>Maintenance and delivery posture</h3>
            <div className={styles.integrationList}>
              <button
                type="button"
                className={styles.integrationRow}
                onClick={() => setForm((current) => ({ ...current, maintenanceMode: !current.maintenanceMode }))}
              >
                <div>
                  <strong>Maintenance mode</strong>
                  <p>Active ou non l etat maintenance dans la configuration centrale.</p>
                </div>
                <span className={`${styles.adminToggle} ${form.maintenanceMode ? styles.adminToggleOn : ""}`} />
              </button>
              <button
                type="button"
                className={styles.integrationRow}
                onClick={() => setForm((current) => ({ ...current, statusPageSync: !current.statusPageSync }))}
              >
                <div>
                  <strong>Status page sync</strong>
                  <p>Synchronisation du statut public d exploitation.</p>
                </div>
                <span className={`${styles.adminToggle} ${form.statusPageSync ? styles.adminToggleOn : ""}`} />
              </button>
            </div>
          </article>

          <AccountSecurityPanel
            description="Protect the administrative account, confirm verification state and rotate access across every privileged device."
            eyebrow="Administrative identity security"
            title="Control privileged authentication"
          />
        </aside>
      </section>
    </AdminShell>
  );
}
