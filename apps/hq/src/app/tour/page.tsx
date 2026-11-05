import type { Metadata } from "next";
import { HQClient } from "@/hud/HQClient";
import { publicWorld } from "@/server/projection";

export const metadata: Metadata = {
  title: "Monetura HQ · Public Tour",
  description: "A guided tour of the Monetura corporate headquarters island.",
};

export default function TourPage() {
  return <HQClient world={publicWorld()} />;
}
