import { BackLink, PageHeading } from "@/components/trips/ui";
import { TripForm } from "@/components/trips/TripForm";

export default function NewTripPage() {
  return (
    <>
      <BackLink href="/trips" label="Trips" />
      <PageHeading eyebrow="Trip Records" title="New trip" />
      <TripForm />
    </>
  );
}
