// Session type augmentation for Monetura platform
// memberTier values match monetura_members.membership_tier enum in drizzle/monetura-schema.ts

import type { DefaultSession } from "next-auth";

export type MemberTier = "free" | "community" | "software" | "founder" | "admin";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      memberId: number;
      memberTier: MemberTier;
      founderNumber: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    memberId: number;
    memberTier: MemberTier;
    founderNumber: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    memberId: number;
    memberTier: MemberTier;
    founderNumber: number | null;
  }
}
