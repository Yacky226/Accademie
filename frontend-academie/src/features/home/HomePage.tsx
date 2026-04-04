import {
  featuredCourses,
  heroMetrics,
  pricingPlans,
  proofLogos,
} from "./home.data";
import styles from "./home.module.css";
import { FeaturedCoursesSection } from "./components/FeaturedCoursesSection";
import { FinalCtaSection } from "./components/FinalCtaSection";
import { HeroSection } from "./components/HeroSection";
import { PricingSection } from "./components/PricingSection";
import { ProofSection } from "./components/ProofSection";
import { MarketingPageFrame } from "../marketing-site/MarketingPageFrame";

export function HomePage() {
  return (
    <MarketingPageFrame mainClassName={styles.main} pageClassName={styles.page}>
      <HeroSection metrics={heroMetrics} />
      <ProofSection logos={proofLogos} />
      <FeaturedCoursesSection courses={featuredCourses} />
      <PricingSection plans={pricingPlans} />
      <FinalCtaSection />
    </MarketingPageFrame>
  );
}
