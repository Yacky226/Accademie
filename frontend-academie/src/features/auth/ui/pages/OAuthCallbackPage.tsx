"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStoreDispatch } from "@/core/store/auth-store-hooks";
import {
  getDashboardPathForRole,
  resolveSafeRedirectTarget,
} from "@/core/router/route-access-control";
import { fetchCurrentSessionThunk } from "../../model/auth.slice";
import { AuthShell } from "../components/AuthShell";
import styles from "../auth-ui.module.css";

function getProviderLabel(provider: string | null) {
  if (provider === "github") {
    return "GitHub";
  }

  return "Google";
}

export function OAuthCallbackPage() {
  const dispatch = useAuthStoreDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Nous finalisons votre session securisee...",
  );

  const provider = searchParams.get("provider");
  const providerLabel = useMemo(() => getProviderLabel(provider), [provider]);
  const mode = searchParams.get("mode") === "register" ? "register" : "login";
  const redirectTarget = searchParams.get("redirect");
  const backendError = searchParams.get("error");
  const backendMessage = searchParams.get("message");

  useEffect(() => {
    let isActive = true;

    if (backendError) {
      setErrorMessage(
        backendMessage || `Impossible de finaliser la connexion ${providerLabel}.`,
      );
      setStatusMessage("La session n a pas pu etre hydratee.");
      return () => {
        isActive = false;
      };
    }

    void dispatch(fetchCurrentSessionThunk())
      .unwrap()
      .then((sessionUser) => {
        if (!isActive) {
          return;
        }

        const fallbackTarget =
          mode === "register" && sessionUser.role === "student"
            ? "/onboarding/step-1"
            : getDashboardPathForRole(sessionUser.role);
        const nextTarget = resolveSafeRedirectTarget(
          redirectTarget,
          fallbackTarget,
        );

        if (!sessionUser.emailVerified) {
          const verificationParams = new URLSearchParams();
          verificationParams.set("email", sessionUser.email ?? "");
          verificationParams.set("redirect", nextTarget);
          router.replace(`/auth/verify?${verificationParams.toString()}`);
          router.refresh();
          return;
        }

        router.replace(nextTarget);
        router.refresh();
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : `Impossible de terminer la connexion ${providerLabel}.`,
        );
        setStatusMessage("La session n a pas pu etre hydratee.");
      });

    return () => {
      isActive = false;
    };
  }, [
    backendError,
    backendMessage,
    dispatch,
    mode,
    providerLabel,
    redirectTarget,
    router,
  ]);

  return (
    <AuthShell
      description="Le retour du provider est termine. Nous rechargeons maintenant votre session locale et votre espace associe."
      eyebrow="OAuth handoff"
      headerActionHref={mode === "register" ? "/auth/register" : "/auth/login"}
      headerActionLabel={mode === "register" ? "Retour inscription" : "Retour login"}
      highlights={[
        "Le backend valide le provider puis recree la session Academie habituelle.",
        "Le refresh cookie reste le mecanisme central pour hydrater l application.",
        "Une fois la session retrouvee, la redirection repart vers le bon espace.",
      ]}
      metrics={[
        { label: "Provider", value: providerLabel },
        { label: "Flow", value: mode === "register" ? "Signup" : "Login" },
        { label: "Session", value: errorMessage ? "Retry" : "Hydrating" },
      ]}
      spotlightDescription="Aucune logique parallele n est ajoutee cote frontend: on recupere simplement la session standard deja utilisee partout ailleurs."
      spotlightLabel="Auth bridge"
      spotlightTitle="Connexion via provider, session locale unique."
      title={`Finalisation de votre connexion ${providerLabel}.`}
    >
      <article className={styles.authCard}>
        <div className={styles.formHeader}>
          <span className={styles.formEyebrow}>Connexion provider</span>
          <h2 className={styles.formTitle}>Synchronisation de session</h2>
          <p className={styles.formLead}>
            {errorMessage
              ? "La connexion a rencontre un probleme. Vous pouvez retenter avec le meme provider ou revenir au formulaire classique."
              : statusMessage}
          </p>
        </div>

        {errorMessage ? (
          <p className={styles.formNoticeError}>{errorMessage}</p>
        ) : (
          <p className={styles.formNoticeSuccess}>
            Redirection en cours vers votre espace securise.
          </p>
        )}

        <div className={styles.securityActionRow}>
          <Link
            className={styles.primaryButton}
            href={mode === "register" ? "/auth/register" : "/auth/login"}
          >
            {errorMessage ? "Revenir au formulaire" : "Ouvrir le portail d auth"}
          </Link>
          <Link className={styles.secondaryButton} href="/contact">
            Besoin d aide
          </Link>
        </div>
      </article>
    </AuthShell>
  );
}
