import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { HQClient } from "@/hud/HQClient";
import { hasOwnerSession } from "@/server/auth";
import { ownerWorld } from "@/server/projection";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Monetura HQ · Corporate Headquarters" };

export default async function OwnerPage() {
  // Second gate after middleware: the registry is only serialized for an owner.
  if (!(await hasOwnerSession())) redirect("/login");
  return <HQClient world={ownerWorld()} />;
}
