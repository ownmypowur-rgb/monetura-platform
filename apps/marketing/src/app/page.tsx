import BlogTransformSection from "@/components/home/BlogTransformSection";
import CTASection from "@/components/home/CTASection";
import DestinationsSection from "@/components/home/DestinationsSection";
import HeroSection from "@/components/home/HeroSection";
import OfferSection from "@/components/home/OfferSection";
import PlatformSection from "@/components/home/PlatformSection";
import ProblemSection from "@/components/home/ProblemSection";
import SolutionSection from "@/components/home/SolutionSection";
import StorySection from "@/components/home/StorySection";
import TiersSection from "@/components/home/TiersSection";
import TravelMomentsSection from "@/components/home/TravelMomentsSection";
import UrgencySection from "@/components/home/UrgencySection";

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-monetura-charcoal">
      <HeroSection />
      <div id="the-origin">
        <StorySection />
      </div>
      <ProblemSection />
      <SolutionSection />
      <TravelMomentsSection />
      <PlatformSection />
      <BlogTransformSection />
      <OfferSection />
      <DestinationsSection />
      <div id="founders">
        <TiersSection />
      </div>
      <UrgencySection />
      <CTASection />
    </main>
  );
}
