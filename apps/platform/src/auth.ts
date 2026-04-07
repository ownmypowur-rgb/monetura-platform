import "server-only";

/**
 * NextAuth v5 configuration for app.monetura.com
 *
 * Required environment variables:
 *   NEXTAUTH_SECRET  — generate with: openssl rand -base64 32
 *   DATABASE_URL     — MySQL connection string (already in Vercel, set in .env.local)
 *   NEXTAUTH_URL     — http://localhost:3001 (local) | https://app.monetura.com (prod)
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getDb, moneturaMembers, moneturaFounderKeys, getOrCreateAffiliateLink } from "@monetura/db";
import { apexcrmUsers } from "@/lib/apexcrm-users";
import { eq } from "drizzle-orm";
import type { MemberTier } from "@/types/next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const password = credentials.password;

        // Step 1: Query ApexCRM users table — read-only, never write
        console.log("AUTH: looking up user", email);
        const users = await getDb()
          .select()
          .from(apexcrmUsers)
          .where(eq(apexcrmUsers.email, email))
          .limit(1);

        const user = users[0];
        console.log("AUTH: user found", !!user, "has hash", !!user?.passwordHash);
        if (!user?.passwordHash) return null;

        // Step 2: Verify password (bcrypt, 12 rounds)
        const isValid = await bcrypt.compare(password, user.passwordHash);
        console.log("AUTH: bcrypt result", isValid);
        if (!isValid) return null;

        // Step 3: Confirm an active Monetura member record exists
        const members = await getDb()
          .select()
          .from(moneturaMembers)
          .where(eq(moneturaMembers.email, email))
          .limit(1);

        const member = members[0];
        console.log("AUTH: member found", !!member, "status", member?.status, "tier", member?.membershipTier);
        if (!member || member.status !== "active") return null;

        // Step 3b: Ensure member has an affiliate link — fire and forget
        void getOrCreateAffiliateLink(member.id).catch((err: unknown) => {
          console.error("AUTH: affiliate link creation failed (non-blocking):", err);
        });

        // Step 4: Fetch founder number for founder-tier members
        let founderNumber: number | null = null;
        if (member.membershipTier === "founder") {
          const founderKeys = await getDb()
            .select()
            .from(moneturaFounderKeys)
            .where(eq(moneturaFounderKeys.memberId, member.id))
            .limit(1);
          founderNumber = founderKeys[0]?.id ?? null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name ?? member.name,
          memberId: member.id,
          memberTier: member.membershipTier as MemberTier,
          founderNumber,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    // jwt() fires on every request. `user` is only present on the initial sign-in.
    // On subsequent requests only `token` is available.
    // We re-fetch memberTier from the DB when it is missing so that stale JWTs
    // (created before this field was added) still produce a correct session.
    // DB column: membership_tier → Drizzle field: membershipTier (camelCase)
    jwt: async ({ token, user }) => {
      if (user) {
        // Fresh sign-in: populate from the authorize() result
        token.memberId = user.memberId;
        token.memberTier = user.memberTier;
        token.founderNumber = user.founderNumber;
      }

      // Stale-token fallback: if memberId is known but memberTier is missing,
      // re-read membership_tier (→ Drizzle field: membershipTier) from the DB.
      const staleMemberId: number | undefined = token.memberId as number | undefined;
      if (staleMemberId && !token.memberTier) {
        const rows = await getDb()
          .select({
            membershipTier: moneturaMembers.membershipTier,
            founderNumber: moneturaMembers.founderNumber,
          })
          .from(moneturaMembers)
          .where(eq(moneturaMembers.id, staleMemberId))
          .limit(1);

        if (rows[0]) {
          token.memberTier = rows[0].membershipTier as MemberTier;
          token.founderNumber = rows[0].founderNumber ?? null;
        }
      }

      return token;
    },

    session({ session, token }) {
      session.user.id = token.sub ?? "";
      // Use nullish coalescing so an undefined field (stale JWT) never
      // reaches the client as undefined — it falls back to "free".
      session.user.memberId = (token.memberId ?? 0) as number;
      session.user.memberTier = (token.memberTier ?? "free") as MemberTier;
      session.user.founderNumber = (token.founderNumber ?? null) as number | null;
      return session;
    },
  },
});
