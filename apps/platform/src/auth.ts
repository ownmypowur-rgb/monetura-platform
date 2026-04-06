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
import { db, moneturaMembers, moneturaFounderKeys } from "@monetura/db";
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
        const users = await db
          .select()
          .from(apexcrmUsers)
          .where(eq(apexcrmUsers.email, email))
          .limit(1);

        const user = users[0];
        if (!user?.passwordHash) return null;

        // Step 2: Verify password (bcrypt, 12 rounds)
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        // Step 3: Confirm an active Monetura member record exists
        const members = await db
          .select()
          .from(moneturaMembers)
          .where(eq(moneturaMembers.email, email))
          .limit(1);

        const member = members[0];
        if (!member || member.status !== "active") return null;

        // Step 4: Fetch founder number for founder-tier members
        let founderNumber: number | null = null;
        if (member.membershipTier === "founder") {
          const founderKeys = await db
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
    jwt({ token, user }) {
      if (user) {
        token.memberId = user.memberId;
        token.memberTier = user.memberTier;
        token.founderNumber = user.founderNumber;
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.sub ?? "";
      // token fields are typed via next-auth/jwt JWT augmentation in types/next-auth.d.ts
      session.user.memberId = token.memberId as number;
      session.user.memberTier = token.memberTier as MemberTier;
      session.user.founderNumber = token.founderNumber as number | null;
      return session;
    },
  },
});
