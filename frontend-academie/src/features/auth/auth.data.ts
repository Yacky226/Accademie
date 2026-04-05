import type { FooterLink, SocialProvider } from "./auth.types";

export const authFooterLinks: FooterLink[] = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export const authSocialProviders: SocialProvider[] = [
  { label: "Google", icon: "google" },
  { label: "GitHub", icon: "github" },
];
