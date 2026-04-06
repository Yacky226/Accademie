"use client";

import { useState } from "react";
import Image from "next/image";
import {
  checkoutBenefits,
  checkoutSummaryLines,
} from "./payment-checkout.data";
import styles from "./payment-checkout.module.css";

export default function PaymentCheckoutPage() {
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <h1 className={styles.brand}>Architect Academy</h1>
        <span className={styles.securePill}>Paiement Securise</span>
      </header>

      <section className={styles.shell}>
        <div className={styles.leftCol}>
          <article className={styles.trustBanner}>
            <div className={styles.trustIcon}>OK</div>
            <div>
              <h3>Garantie de satisfaction 30 jours</h3>
              <p>
                Remboursement integral si le programme ne repond pas a vos
                attentes.
              </p>
            </div>
          </article>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.step}>01</span>
              Paiement Express
            </h2>
            <div className={styles.expressGrid}>
              <button type="button" className={styles.expressBtn}>
                Apple Pay
              </button>
              <button type="button" className={styles.expressBtnLight}>
                Google Pay
              </button>
            </div>
            <div className={styles.divider}>
              <span>Ou par carte</span>
            </div>
          </section>

          <section>
            <h2 className={styles.sectionTitle}>
              <span className={styles.step}>02</span>
              Details de paiement
            </h2>
            <form className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="card-name">Nom sur la carte</label>
                <input id="card-name" placeholder="JEAN DUPONT" />
              </div>

              <div className={styles.field}>
                <label htmlFor="card-number">Numero de carte</label>
                <input id="card-number" placeholder="0000 0000 0000 0000" />
              </div>

              <div className={styles.twoCols}>
                <div className={styles.field}>
                  <label htmlFor="card-expiration">Expiration</label>
                  <input id="card-expiration" placeholder="MM / YY" />
                </div>
                <div className={styles.field}>
                  <label htmlFor="card-cvc">CVC</label>
                  <input id="card-cvc" placeholder="123" />
                </div>
              </div>

              <button type="submit" className={styles.payButton}>
                Payer 499,00 EUR
              </button>
              <p className={styles.ssl}>
                Vos donnees sont chiffrees en 256-bit SSL par Stripe.
              </p>
            </form>
          </section>
        </div>

        <aside className={styles.rightCol}>
          <article className={styles.summaryCard}>
            <div className={styles.cover}>
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr7vdNh--x4aJwKL9mskrWpCoedUFzcW28h5jQ-OOlitRxv_OgUpENn02YLwXzaUT_TNOlyObRv38lO_PuMU67AzNK13KCvZYJPojm_ScpSQLXcVtkLZdrc4umYUt9Ilr91YGozp19ihsmaxevpqCSjENkVT-eBYw0YgGZnvvfOE2ETYngyD2OfcJLxNBSiJjUdPncGQmK5I0L5MbmjB0YqZXnUsume_RsoDJG7UuQy-DlkZNJnSpSMqhECaZ4aHiFYDTdsTQypH6I"
                alt="Advanced Microservices Architecture"
                height={960}
                sizes="(max-width: 900px) 100vw, 32vw"
                width={1280}
              />
              <div className={styles.coverOverlay}>
                <div>
                  <span className={styles.coverLabel}>Niveau Avance</span>
                  <h2 className={styles.coverTitle}>
                    Advanced Microservices Architecture
                  </h2>
                </div>
              </div>
            </div>

            <div className={styles.summaryBody}>
              <h3 className={styles.summaryHeading}>Recapitulatif</h3>
              <ul className={styles.summaryList}>
                {checkoutSummaryLines.map((line) => (
                  <li className={styles.summaryRow} key={line.label}>
                    <div>
                      <p>{line.label}</p>
                      {line.detail ? (
                        <p className={styles.summaryDetail}>{line.detail}</p>
                      ) : null}
                    </div>
                    <span className={styles.summaryAmount}>{line.amount}</span>
                  </li>
                ))}
              </ul>

              <div className={styles.total}>
                <div>
                  <p>Total a payer</p>
                  <h3>499,00 EUR</h3>
                </div>
                <div>
                  <small>Inclus</small>
                  <strong>Certification Incluse</strong>
                </div>
              </div>

              <div className={styles.benefits}>
                {checkoutBenefits.map((benefit) => (
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

          <blockquote className={styles.quote}>
            &quot;La precision des cours d Architect Academy m a permis de refondre
            notre infrastructure cloud en moins de 3 mois.&quot;
            <strong>Thomas L., Senior Lead Architect</strong>
          </blockquote>
        </aside>
      </section>

      <footer className={styles.footer}>
        <div>
          <p className={styles.footerTitle}>Architectural Ledger EdTech</p>
          <p className={styles.footerSub}>
            Copyright 2024 Precise Engineering for Minds. Tous droits reserves.
          </p>
        </div>
        <div className={styles.footerLinks}>
          <span>Politique de Confidentialite</span>
          <span>Conditions Generales</span>
          <span>Contact</span>
        </div>
      </footer>
    </main>
  );
}
