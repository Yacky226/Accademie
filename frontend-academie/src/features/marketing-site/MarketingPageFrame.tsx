import type { ReactNode } from "react";
import { navItems } from "@/features/home/home.data";
import { FooterSection } from "@/features/home/components/FooterSection";
import { TopNavBar } from "@/features/home/components/TopNavBar";

interface MarketingPageFrameProps {
  children: ReactNode;
  mainClassName?: string;
  pageClassName?: string;
}

export function MarketingPageFrame({
  children,
  mainClassName,
  pageClassName,
}: MarketingPageFrameProps) {
  const pageClasses = [pageClassName].filter(Boolean).join(" ");
  const mainClasses = [mainClassName].filter(Boolean).join(" ");

  return (
    <div className={pageClasses}>
      <TopNavBar navItems={navItems} />
      <main className={mainClasses}>{children}</main>
      <FooterSection />
    </div>
  );
}
