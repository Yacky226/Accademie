"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import type { CatalogCourseDetailRecord } from "@/features/course-catalog/course-catalog.types";
import {
  createCourseCheckoutPayment,
  createPackCheckoutPayment,
  createStripeCheckoutSession,
  fetchCheckoutCourse,
  fetchMyPayments,
  syncStripeCheckoutSession,
} from "./payment-checkout.client";
import { checkoutPlans, findCheckoutPlan } from "./payment-plan.catalog";
import type { CheckoutPaymentRecord } from "./payment-checkout.types";
import styles from "./payment-checkout.module.css";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useCurrentAuthSession();
  const checkoutQuery = searchParams.toString();
  const mode = searchParams.get("mode");
  const courseSlug = searchParams.get("slug");
  const planCode = searchParams.get("plan");
  const paymentId = searchParams.get("paymentId");
  const stripeResult = searchParams.get("result");
  const stripeSessionId = searchParams.get("session_id");
  const pack = useMemo(() => findCheckoutPlan(planCode), [planCode]);
  const [course, setCourse] = useState<CatalogCourseDetailRecord | null>(null);
  const [payments, setPayments] = useState<CheckoutPaymentRecord[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [successPayment, setSuccessPayment] = useState<CheckoutPaymentRecord | null>(null);

  const selectedAmount = course ? course.price : pack?.price ?? 0;
  const selectedCurrency = course ? course.currency : pack?.currency ?? "EUR";
  const selectedTitle = course ? course.title : pack?.name ?? "Souscription";
  const selectedDescription = course
    ? course.shortDescription
    : pack?.description ?? "Souscription academie";
  const redirectTarget = `/checkout?${checkoutQuery}`;

  useEffect(() => {
    if (stripeResult === "cancel") {
      setStatusMessage("Paiement Stripe annule. Vous pouvez relancer le checkout quand vous voulez.");
      setSuccessPayment(null);
    }
  }, [stripeResult]);

  useEffect(() => {
    let isActive = true;

    async function loadCheckout() {
      setLoading(true);

      try {
        if (mode === "course" && courseSlug) {
          const nextCourse = await fetchCheckoutCourse(courseSlug);
          if (!isActive) {
            return;
          }
          setCourse(nextCourse);
        } else {
          setCourse(null);
        }

        if (isAuthenticated) {
          const nextPayments = await fetchMyPayments();
          if (!isActive) {
            return;
          }
          setPayments(nextPayments);
        } else {
          setPayments([]);
        }

        setStatusMessage((current) =>
          stripeResult === "cancel"
            ? "Paiement Stripe annule. Vous pouvez relancer le checkout quand vous voulez."
            : current,
        );
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Impossible de preparer le checkout.",
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadCheckout();

    return () => {
      isActive = false;
    };
  }, [courseSlug, isAuthenticated, mode, stripeResult]);

  useEffect(() => {
    if (stripeResult !== "success" || !paymentId || !stripeSessionId) {
      return;
    }

    const currentPaymentId = paymentId;
    const currentStripeSessionId = stripeSessionId;
    let isActive = true;

    async function reconcileStripeCheckout() {
      setSubmitting(true);
      setStatusMessage("Verification du paiement Stripe en cours...");

      try {
        const syncedPayment = await syncStripeCheckoutSession(
          currentPaymentId,
          currentStripeSessionId,
        );

        if (!isActive) {
          return;
        }

        setSuccessPayment(syncedPayment);
        setPayments((current) => {
          const nextPayments = current.filter((entry) => entry.id !== syncedPayment.id);
          return [syncedPayment, ...nextPayments];
        });
        setErrorMessage(null);

        if (syncedPayment.course?.slug) {
          setStatusMessage("Paiement confirme. Redirection vers votre cours...");
          router.replace(`/student/courses/${syncedPayment.course.slug}`);
          return;
        }

        setStatusMessage("Paiement Stripe confirme. Votre pack est maintenant actif.");
        router.replace("/student/payments");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de verifier le retour Stripe.",
        );
        setStatusMessage(null);
      } finally {
        if (isActive) {
          setSubmitting(false);
        }
      }
    }

    void reconcileStripeCheckout();

    return () => {
      isActive = false;
    };
  }, [paymentId, router, stripeResult, stripeSessionId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    setSubmitting(true);
    try {
      const payment =
        mode === "course" && course
          ? await createCourseCheckoutPayment(course)
          : pack
            ? await createPackCheckoutPayment({
                amount: pack.price,
                billingInterval: pack.billingInterval,
                currency: pack.currency,
                description: `Souscription ${pack.name}`,
                planCode: pack.code,
              })
            : null;

      if (!payment) {
        throw new Error("Aucun produit n a ete selectionne pour ce checkout.");
      }

      const stripeSession = await createStripeCheckoutSession(payment.id);
      setErrorMessage(null);
      setStatusMessage("Redirection vers la page de paiement Stripe...");

      if (typeof window !== "undefined") {
        window.location.assign(stripeSession.checkoutUrl);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de finaliser le paiement.",
      );
      setStatusMessage(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <h1 className={styles.brand}>Architect Academy</h1>
        <span className={styles.securePill}>Checkout academie</span>
      </header>

      <section className={styles.shell}>
        <div className={styles.leftCol}>
          <article className={styles.trustBanner}>
            <div className={styles.trustIcon}>OK</div>
            <div>
              <h3>Stripe Checkout heberge</h3>
              <p>Creation du paiement local, redirection Stripe securisee, puis activation automatique du contenu.</p>
            </div>
          </article>

          {!isAuthenticated ? (
            <article className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.step}>01</span>
                Connexion requise
              </h2>
              <p style={{ marginTop: 12, color: "#5f6b80" }}>
                Connectez-vous pour finaliser la souscription a cette formation ou a ce pack.
              </p>
              <div className={styles.expressGrid} style={{ marginTop: 12 }}>
                <Link
                  className={styles.expressBtn}
                  href={`/auth/login?redirect=${encodeURIComponent(redirectTarget)}`}
                >
                  Se connecter
                </Link>
                <Link className={styles.expressBtnLight} href="/auth/register">
                  Creer un compte
                </Link>
              </div>
            </article>
          ) : null}

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.step}>02</span>
              Paiement
            </h2>
            {errorMessage ? <p className={styles.messageError}>{errorMessage}</p> : null}
            {statusMessage ? <p className={styles.messageInfo}>{statusMessage}</p> : null}
            {successPayment ? (
              <p className={styles.messageSuccess}>
                Paiement confirme sous la reference {successPayment.reference}.
              </p>
            ) : null}
            {loading ? <p className={styles.messageInfo}>Chargement du checkout...</p> : null}

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.hostedNotice}>
                <p className={styles.hostedTitle}>Le paiement se fait sur la page securisee Stripe.</p>
                <p className={styles.hostedText}>
                  Vous serez redirige vers Stripe pour saisir votre carte, Apple Pay ou Google Pay selon votre appareil.
                </p>
                <p className={styles.hostedText}>
                  En mode test, utilisez la carte <strong>4242 4242 4242 4242</strong>, une date future et un CVC a 3 chiffres.
                </p>
              </div>

              <div className={styles.checkoutActions}>
                <button
                  disabled={loading || submitting || (!course && !pack)}
                  type="submit"
                  className={styles.payButton}
                >
                  {submitting
                    ? "Redirection vers Stripe..."
                    : `Payer ${formatCurrency(selectedAmount, selectedCurrency)} avec Stripe`}
                </button>
              </div>
              <p className={styles.ssl}>
                Vous reviendrez ensuite automatiquement dans l application pour activer votre cours ou votre pack.
              </p>
            </form>
          </section>
        </div>

        <aside className={styles.rightCol}>
          <article className={styles.summaryCard}>
            <div className={styles.cover}>
              {course?.thumbnailUrl ? (
                <Image
                  src={course.thumbnailUrl}
                  alt={course.title}
                  height={960}
                  sizes="(max-width: 900px) 100vw, 32vw"
                  width={1280}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #dbe7ff, #eef4ff)" }} />
              )}
              <div className={styles.coverOverlay}>
                <div>
                  <span className={styles.coverLabel}>{course ? course.level : "Pack"}</span>
                  <h2 className={styles.coverTitle}>{selectedTitle}</h2>
                </div>
              </div>
            </div>

            <div className={styles.summaryBody}>
              <h3 className={styles.summaryHeading}>Recapitulatif</h3>
              <ul className={styles.summaryList}>
                <li className={styles.summaryRow}>
                  <div>
                    <p>{selectedTitle}</p>
                    <p className={styles.summaryDetail}>{selectedDescription}</p>
                  </div>
                  <span className={styles.summaryAmount}>{formatCurrency(selectedAmount, selectedCurrency)}</span>
                </li>
                {course ? (
                  <li className={styles.summaryRow}>
                    <div>
                      <p>Mentor</p>
                      <p className={styles.summaryDetail}>{course.mentorName}</p>
                    </div>
                    <span className={styles.summaryAmount}>
                      {course.durationInHours ? `${course.durationInHours}h` : "Flexible"}
                    </span>
                  </li>
                ) : null}
              </ul>

              <div className={styles.total}>
                <div>
                  <p>Total a payer</p>
                  <h3>{formatCurrency(selectedAmount, selectedCurrency)}</h3>
                </div>
                <div>
                  <small>Mode</small>
                  <strong>{course ? "Formation" : "Pack"}</strong>
                </div>
              </div>

              <div className={styles.benefits}>
                {(course
                  ? [
                      { icon: "LS", label: `${course.modules.length} modules publies` },
                      { icon: "VD", label: "Lecture video" },
                      { icon: "RS", label: "Ressources incluses" },
                      { icon: "ST", label: "Acces espace student" },
                    ]
                  : pack?.benefits ?? checkoutPlans[0].benefits
                ).map((benefit) => (
                  <div className={styles.benefit} key={benefit.label}>
                    <span className={styles.benefitIcon}>{benefit.icon}</span>
                    <span>{benefit.label}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className={styles.promoBtn}
                onClick={() => setShowPromo((value) => !value)}
              >
                Ajouter un code promotionnel
              </button>
              {showPromo ? (
                <div className={styles.promoField}>
                  <input
                    aria-label="Code promotionnel"
                    placeholder="PROMO2026"
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value)}
                  />
                  <button type="button">Appliquer</button>
                </div>
              ) : null}
            </div>
          </article>

          {isAuthenticated ? (
            <article className={styles.summaryCard} style={{ marginTop: 16, padding: 16 }}>
              <h3 className={styles.summaryHeading}>Derniers paiements</h3>
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {payments.slice(0, 4).map((payment) => (
                  <div
                    key={payment.id}
                    style={{
                      border: "1px solid #d8deee",
                      borderRadius: 12,
                      padding: 12,
                      display: "grid",
                      gap: 4,
                    }}
                  >
                    <strong>{payment.course?.title ?? payment.subscriptionPlanCode ?? payment.description ?? payment.reference}</strong>
                    <span>{payment.reference}</span>
                    <span>
                      {formatCurrency(payment.amount, payment.currency)} · {payment.status}
                    </span>
                  </div>
                ))}
                {payments.length === 0 ? <span>Aucun paiement pour le moment.</span> : null}
              </div>
            </article>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
