import { AuthShell } from "./components/AuthShell";
import { LoginFormCard } from "./components/LoginFormCard";

export function LoginPage() {
  return (
    <AuthShell
      description="Resume courses, mentor reviews, notifications and workspace controls from one connected access point."
      eyebrow="Secure academy access"
      headerActionHref="/auth/register"
      headerActionLabel="Get started"
      highlights={[
        "Course progress and reminders stay synced across every workspace.",
        "Mentor feedback, payment alerts and system notices remain in one timeline.",
        "One account unlocks student, teacher or admin flows based on your role.",
      ]}
      metrics={[
        { label: "Active learners", value: "12.4k" },
        { label: "Mentor response", value: "< 4h" },
        { label: "Programs online", value: "342" },
      ]}
      spotlightDescription="Sign back in to keep your study flow, live reviews and decision dashboards connected without switching tools."
      spotlightLabel="Live academy pulse"
      spotlightTitle="Everything important is already waiting in your workspace."
      title="Reconnect to your Architect Academy cockpit."
    >
      <LoginFormCard />
    </AuthShell>
  );
}
