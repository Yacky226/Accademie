export interface FooterLink {
  label: string;
  href: string;
}

export interface SocialProvider {
  label: string;
  icon: "google" | "github";
}

export interface OtpTimer {
  minutes: string;
  seconds: string;
}
