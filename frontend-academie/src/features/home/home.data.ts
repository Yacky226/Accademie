import type { CourseCard, HeroMetric, NavItem, PricingPlan } from "./home.types";

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Formations", href: "/formations" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const heroMetrics: HeroMetric[] = [
  { label: "Active learners", value: "15k+" },
  { label: "Live mentors", value: "42" },
  { label: "Completion rate", value: "94%" },
];

export const proofLogos: string[] = [
  "METATRON",
  "CYBERDYNE",
  "TYRELL",
  "WAYLAND",
  "STARK-SYS",
];

export const featuredCourses: CourseCard[] = [
  {
    title: "Algorithmie de haut niveau",
    category: "ALGORITHMES",
    description:
      "Optimisation asymptotique, structures de donnees persistantes et graphes complexes.",
    hours: "48 Heures",
    rating: "4.9",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuArTSQOkKcMsJXjOIOBIizCXu1WM11lrkxaRTy4QI9Qp8JVieu4rc38NfYitmRK2TgLN15Zs049ys7xMo4fNxo5bsZYTKuxR6DBX7XE-zx8XkJqOqK8l7c9BuBf5f-2LLSS-41IBeeXdnnDF7-9YAZ31QUYJFo5lHMTF0EzNuHiUDmcZfaQptqlUdjFuxUbBW_Eei4J7xVzwErO2GGgw7Koojvr6_HmNDtckn1p_U2gtkeV2z9aO0t88QQKjTe-_IDCTXZNA4wbo-b3",
    imageAlt: "Illustration algorithmie avancee",
  },
  {
    title: "Systemes distribues",
    category: "SYSTEMS",
    description:
      "Consensus, partitionnement de donnees et resilience a l echelle planetaire.",
    hours: "60 Heures",
    rating: "5.0",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDnGLJOSiB-HOfKm1GawkF4R_tGa90QLllKn-C3qLrwOSYNR09fAqd1TaycQWkrhpm-VaqT4QfkdMmF5wssI1UKvE8fL_ulwpbRnCtBtAV3yk-SyRI1qwk_XojNLl9HcY8WQnkCqygrD3sJFWIKm-__MQf6z3moJ0o-rs2slTin8d5pFUeKT5yHNOa5i6P9iSUQrH3Y7FKNnUclwMeATviSTXiQSbye4a9WhsDXzh8bg7DprBO5Jgn-37pZ4hVv63UqAkGkNqha5QgR",
    imageAlt: "Illustration systemes distribues",
  },
  {
    title: "Clean Architecture",
    category: "DESIGN",
    description:
      "Decouplez vos domaines, maitrisez les patterns SOLID et construisez pour durer.",
    hours: "32 Heures",
    rating: "4.8",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCioKGLIZHvK-Mod7WpFMswKLkBdWc8i2MEaf8T5K6jnsqF1KPWX3COZE5nl0wSr4wisZf-sqeeHrJeC5z0nfhmgTnY81-dq9IlOApovWreg7NsimoorVwAElJN-US4EILd-mX8OmvzCOHMl8TS65y5RmqAGuluBVhDzS0aSMQMSMGtFd7E0W2TTt4SQVBolq8diImmnuyLYcDokRjDC4UXCu-QHB4gt2eZEGG0CacMRjjl82MAg-eKqmpkJxG0RnLKmNlTJ56vrvxH",
    imageAlt: "Illustration clean architecture",
  },
];

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "0EUR",
    period: "/mois",
    cta: "Commencer gratuitement",
    ctaHref: "/auth/register",
    features: [
      { label: "Acces aux cours d introduction", included: true },
      { label: "Forum communautaire", included: true },
      { label: "Certifications officielles", included: false },
    ],
  },
  {
    name: "Pro",
    price: "49EUR",
    period: "/mois",
    highlighted: true,
    badge: "Recommande",
    cta: "Devenir Pro",
    ctaHref: "/pricing",
    features: [
      { label: "Acces illimite a tout le catalogue", included: true },
      { label: "Projets pratiques et code reviews", included: true },
      { label: "Certifications de l academie", included: true },
      { label: "Acces prioritaire aux mentors", included: true },
    ],
  },
  {
    name: "Enterprise",
    price: "Sur mesure",
    cta: "Contacter l equipe",
    ctaHref: "/contact",
    features: [
      { label: "Tableau de bord d equipe", included: true },
      { label: "Parcours de formation personnalises", included: true },
      { label: "Sessions de mentorat 1-on-1", included: true },
    ],
  },
];
