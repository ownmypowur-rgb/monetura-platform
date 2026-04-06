import HeroSection from "@/components/home/HeroSection";
import StorySection from "@/components/home/StorySection";
import ProblemSection from "@/components/home/ProblemSection";
import SolutionSection from "@/components/home/SolutionSection";
import OfferSection from "@/components/home/OfferSection";
import TiersSection from "@/components/home/TiersSection";
import UrgencySection from "@/components/home/UrgencySection";
import CTASection from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StorySection />
      <ProblemSection />
      <SolutionSection />
      <OfferSection />
      <TiersSection />
      <UrgencySection />
      <CTASection />
    </main>
  );
}
