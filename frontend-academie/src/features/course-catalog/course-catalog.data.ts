import type {
  CatalogCourse,
  CatalogFilter,
  CatalogFooterLink,
  CatalogNavItem,
} from "./course-catalog.types";

export const catalogFilters: CatalogFilter[] = [
  { label: "All Modules", active: true },
  { label: "Frontend" },
  { label: "Backend" },
  { label: "DevOps" },
  { label: "Algo" },
  { label: "System Design" },
];

export const catalogNavItems: CatalogNavItem[] = [
  { label: "Courses", href: "/formations", active: true },
  { label: "Mentors", href: "/#mentors" },
  { label: "Pricing", href: "/#pricing" },
];

export const catalogFooterLinks: CatalogFooterLink[] = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Cookie Policy", href: "#" },
  { label: "Sitemap", href: "#" },
  { label: "Contact", href: "#" },
];

export const catalogTotalCourses = 342;

export const catalogUserAvatarUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAe5c6P1DpCOZ3ks48-Azrv6TpP1cdihLzpn5_SEdITGh2NgqFKgRuRLozp5V2Yp0uE3iFvAJx15SvGYYhM7Y6dY5CrVjI29mmNsttrbYYo_qCwHaKngl4qZ1dmYIqm1s2LgbqIb1yFZyzlxIntLMBu0LkzM89rFx9m89zf6GyH8oGHDpxJtaF-cQ7la8cRYoULdw7Ps1WoYRETyb8Cr1XXhdVXTdqCJOmreQlKxsAeKoFgoWzisik8P-TeJN5srUJbm7TA6RFrsvcD";

export const catalogCourses: CatalogCourse[] = [
  {
    title: "Advanced React & Distributed State",
    category: "Frontend",
    mentor: "Sarah Drasner",
    mentorAvatarAlt: "Headshot of Sarah Drasner",
    mentorAvatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCC-fOQCXDvXke-_Pcle1Y_AXh3C5KhQ-MjP13jXbsslw6q4Hz0eV7xh4eJgjd6XzPUMHzLCtjIPFUoNHdedik-jEZQpEMLK_hjIXow_-1-0KB0DEWSsETgF4Hr-3TNAMSOvzbo6QkckA7rFdhsjEycWHxX6Tba8_G1b9rvGDdNyqJAe4ZJVcyaYiRcWTZUA6--5tTgLF6J1hkQx0hguxUEnuZzgYfKz0L3pxtalyJjRY6-5F0W-D_legyvfjYQ0_uTk5s9Uf_N4wXg",
    price: "$199.00",
    paymentLabel: "One-time payment",
    rating: "4.9",
    imageAlt: "Abstract architectural shot of a modern building with blue reflections",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7_ohdq0gR0g5sgXNnm_vGGCt_Yii_HSFMQoO_rwbiVPOHwxGdHY2uWbXstFF3bob_BdUQI6-OReEm3eFl-ZQAQaIQQQcFKYVf-4bkRCmgKXwHkcP2wqIywNi28NlBTYiCwDkB3M3Oo1Pr3iSHd2ahnnqUli1AlpYoWwmrWy0CGhCODRFBhk5NsMoJqwoKxUgJPW5kU6ElbQhLsIa5HnlYkymzVaf_jYuhG7FHZe7nbW-a7rO_unEiJy79dEQ_BoG5utPPPs2d8NqD",
    qualityBadge: "A11y Compliant",
  },
  {
    title: "Architecting Global Scale Microservices",
    category: "System Design",
    mentor: "David Heinemeier",
    mentorAvatarAlt: "Headshot of David Heinemeier",
    mentorAvatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCx_kXN56CeyFUw0s4IN8jnN3GIYrnTi6xO6QimioewQmMz5vqFzGjvdDnbY34ixIHNH52WOIeH2vupWEAFNTNXEqT4D5yEzakfb4UdrQqE5UyhMMVTHd4bPrwF10D9S0HzDS4stnBWTt4J5pydk1PYcZdTEQ2DOo7D8i0qQx4kqxD1xVpLJqvMAEEJUC3i4wRrzmqI62KYvEDt41lKkRzQG3GZtuaTp6m7MRVp-0ei-a7Drot7BMklU3rm1TKFD50w8KGoEd4u6e3A",
    price: "$249.00",
    paymentLabel: "One-time payment",
    rating: "5.0",
    imageAlt: "Close-up view of server components and circuitry in cool blue tones",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBX7IrvD-tw7oZphbnwQyncYDNYhXScNtw7S9bluZ_TcUU_aRGDcDg4SvTYy7tio3fpc6iUubhq2KWZFBx2DXSvflPuSRFjXocAD994RMDL7TESn22cCF7jF_S1c5hdCWAmIhYzGrPdOsif4tNRogI6DyCZ4JZTHVaNvqNxFF-w3ZNt1xO8dQdCF75ISTseo2pDTZXj5bE6-ScEhDXeGhEWWNNUnCGZO3RpuVu1IK6gicfh9mZNtElN8pN4e9BDveOFw-MYUf3RBoHX",
    qualityBadge: "A11y Compliant",
  },
  {
    title: "Kubernetes Masterclass: Zero to Hero",
    category: "DevOps",
    mentor: "Kelsey Hightower",
    mentorAvatarAlt: "Headshot of Kelsey Hightower",
    mentorAvatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtK7ZDEj7Me9gVIzmLzOy5cNYeREM_TJyTI3UjlzbmtfObkbXGeCQSfNa28RwKtcacuRyHlTfDjchojpf9E_Wy-91qqzWRtCWc4XdNCzVxwkCf2k3SPM5Eo0yPurqHIAr4wxiiWshRVhyrIpJW3pkTqWPgo7aZjcMLpzFATt8MvumpAu85qsUjbicwAmb62D5BvivKe-u185Z_5mUL9S4G--eDaI0N0Y6n4gSEngDcwJP-H7hdRVUZJZrv1lhaleP5YYC5lFbX_BJK",
    price: "$179.00",
    paymentLabel: "One-time payment",
    rating: "4.8",
    imageAlt: "High-speed capture of ripples and droplets over a dark surface",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAmWM8XyecGEiynhGpDYGp77bSC3de8tdvmtbBRvQEmwApv0j6nKce83ncKzN17ifeox5Jb2qUy9MQiyI0WktYqhhpfObu28WFv3T6Q5ku7PUB5DVOTtZ6i9HCdZFzExuTnk7XVupujrjoySLI_ELUdGcjgYZyKF4hUDBvfaWpC4513f-4uR9z09zcYfn5FSOlNT7y5ryVwxWDtgDvTZ646Q0Fu3U67ICY5MP60S3Z2O9t6mAVLrTXl5M0bi1zXeq7D5iWcLT_JSz4K",
    qualityBadge: "A11y Compliant",
  },
  {
    title: "Competitive Programming Patterns",
    category: "Algo",
    mentor: "Gennady Korotkevich",
    mentorAvatarAlt: "Headshot of Gennady Korotkevich",
    mentorAvatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB3NokvoHF89WeViK3JYnD-nZ3kaEae4o71YrVCYstRHOrP5XZUSKTIliuZix95VebyNMJh0zsTrRajkyI-QJ3P0s_km5skN8E5jw2eIZhworOnvfVcTzdHip53fi87WEUMUhAXcaPtO3h0kuMKwSnmgoKDM00_vDpLq_wxN7voXh3tuGjQT1_ph59uNpj36lprea0RSqI1bUPUU5Uf4hVKT55SnKQwQrtU6an2ZRaBsrQNhAfiR8jbVB9-5OQcq5ch2oEiwqxK3xAz",
    price: "$129.00",
    paymentLabel: "One-time payment",
    rating: "4.9",
    imageAlt: "Minimalist geometric sculpture with smooth gradients in cool tones",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCpfmQ4Oupb1iHOax272TeBPjq8BXpFqSo3OX9EdM06wcbH6reDxkHa6Jo08ZD5Wijt7rxQ48-Xolxc0VyaK3ME-T0enDmKomqZtQC5xJ491hFruACCg9vr2dguhD9Pr-rBmxtBAOVM0ygUTm8TQw_Rh9M4dkGEX0SBuwWV_45pqfRkumpMR-STjx9opUwAOJH5zw3b44ZZ8R-0396Ca8ZAd2vd3SF4u7jJanMTKgVCACGCHl3FW8tP31UJg0WukqNUqAsN96ID-ZeV",
    qualityBadge: "A11y Compliant",
  },
  {
    title: "Distributed Database Internals",
    category: "Backend",
    mentor: "Martin Kleppmann",
    mentorAvatarAlt: "Headshot of Martin Kleppmann",
    mentorAvatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDiLvfBrcgZMjEVoVg6T6H08uGia5DHheVpaO2S-UbXmtIXRLSMwK_ax3H0_k3mIsuuOeQpFGdbPU3iZE77ujwbCGt1pYrf_X4QJh5zNTJbxU-qMdLR25RYhH7Qh-HWipBFVAWMV_i8PjLZ9cK3Ft8dySaRQDrziR7ytDIKLdBY8Ir8H7UgJwKrFbMlub-ojJ7D0G9MORa7UilTHfMFugQoSJl4gx7g9QJlvylqnrERgRs1q5GnWASiyAMGKeXaxdc8uJ8TH2bxKfmJ",
    price: "$299.00",
    paymentLabel: "One-time payment",
    rating: "5.0",
    imageAlt: "Satellite view of the earth at night with illuminated cities",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBrMP1eJCY_j0mKevIfiQ4lZBxu1kCMDdbKrQEP7LFvvRnJxPBqIS02TdsAfJPFEHNknmCUfsZ_bkEolnHJASJYvzoW5lgumNlKWbFnpMgk6AAo4-xozNLkNGhyQcEdwl7BcAbm98GivfELi73PGEnzCBU7fVmqzAsoKarekN_sRM7QFtMY6gvevDkUpiCELFzACIxRAfI8yVhL7nBcTFdI4pFYEGHNO-MjU-l-V__g68IZ9oa1KX1Qu5YoSBzbbbuCIXxLjge1Pytu",
    qualityBadge: "A11y Compliant",
  },
  {
    title: "Data Engineering Pipelines at Scale",
    category: "System Design",
    mentor: "Cassie Kozyrkov",
    mentorAvatarAlt: "Headshot of Cassie Kozyrkov",
    mentorAvatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCnP_UviNZflRN5_9Zo0JaFF4bN8TaDDjKgh67kGv8UKDIpShSqKfOyNW-M5u_AVa4Qrst3fRKKda3AulIhhZb9VUEQ-tpXCN3r9f-XVLjkpAg2wddGZHnnc8a9sDg1nSs_Syals2-VbJuWRtvz2USASPoErm1jxVCmYtA6Gn6jfg6lVOwHH_Fb7GD5CJvQxeDLelX4yMzDytA9c-pw2MO_JSwFxGXmGeyIpQzxQpfggPrtSnSyjlDutEqbj2ObZ1jObrBNRZYNkLdZ",
    price: "$149.00",
    paymentLabel: "One-time payment",
    rating: "4.7",
    imageAlt: "Modern skyscraper seen from below with a repetitive glass facade",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBe8DTjQ9lnpCzTaBueoPLWDsjFdrVd-PBq846nU9y6RyoitPUFsC3IsQFEbAfpeoyz6Na4xp1NmeZGDtbHKg6YZYymFA54pK4mEv1-E2FkPk1dWBbXl9t-ZOB7AE0fRa84EtKXbN219ra11g6mYe7bhyRSEugik7h5591zHOYLc4sliHraxWmUTMKGWpFaGCaLujT01zmE8klp9FWlcOg3wCzfWqjZbYBgVvPUBM_jK23f-b2so7Fz541lwIGei8tFY-FG9OAGvKGL",
    qualityBadge: "A11y Compliant",
  },
];
