import HeroSection from "@/components/home/HeroSection";
import StorySection from "@/components/home/StorySection";
import SolutionSection from "@/components/home/SolutionSection";
import PlatformSection from "@/components/home/PlatformSection";
import OfferSection from "@/components/home/OfferSection";
import ProblemSection from "@/components/home/ProblemSection";
import TiersSection from "@/components/home/TiersSection";
import UrgencySection from "@/components/home/UrgencySection";
import CTASection from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StorySection />
      <SolutionSection />
      <PlatformSection />
      <OfferSection />
      <ProblemSection />
      <TiersSection />
      <UrgencySection />
      <CTASection />
    </main>
  );
}
