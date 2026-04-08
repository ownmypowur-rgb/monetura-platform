import { Suspense } from "react";
import { SocialSettingsClient } from "./SocialSettingsClient";

export default function SocialSettingsPage() {
  return (
    <Suspense fallback={<div />}>
      <SocialSettingsClient />
    </Suspense>
  );
}
