import { TRIP_RECORDS_DISCLAIMER } from "@/lib/trips/constants";

// Every Trip Records page renders inside this layout, so the disclaimer footer
// cannot be left off a page.
export default function TripsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#1A0F0A] text-monetura-cream">
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-10">{children}</div>
      <footer
        className="border-t border-monetura-mocha px-4 py-5 text-center text-sm text-[#C4A882]"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        {TRIP_RECORDS_DISCLAIMER}
      </footer>
    </div>
  );
}
