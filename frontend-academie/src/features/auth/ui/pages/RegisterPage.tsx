import { AuthShell } from "../components/AuthShell";
import { RegisterFormCard } from "../components/RegisterFormCard";

export function RegisterPage() {
  return (
    <AuthShell
      description="Create a polished academy identity and unlock programs, mentor loops and operational workspaces with one account."
      eyebrow="Start your premium access"
      headerActionHref="/auth/login"
      headerActionLabel="Login"
      highlights={[
        "Set up your account once and keep the same identity across student, teacher and admin spaces.",
        "Onboarding, notifications and settings all stay connected from day one.",
        "Your access layer is designed for secure growth as your role evolves.",
      ]}
      metrics={[
        { label: "Completion rate", value: "86%" },
        { label: "Support reply", value: "< 4h" },
        { label: "Live mentors", value: "42" },
      ]}
      spotlightDescription="Join a platform built to make advanced technical learning feel structured, premium and deeply connected."
      spotlightLabel="Launchpad"
      spotlightTitle="Build your Architect Academy profile in a few clean steps."
      title="Create an account that grows with your role."
    >
      <RegisterFormCard />
    </AuthShell>
  );
}
