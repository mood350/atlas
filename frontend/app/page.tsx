import { GlobalNav } from "@/components/landing/GlobalNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { LogosBand } from "@/components/landing/LogosBand";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCTASection } from "@/components/landing/FinalCTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalNav />
      <main>
        <HeroSection />
        <LogosBand />
        <StatsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
