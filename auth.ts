/**
 * Auth.js v5 configuration
 *
 * Strategy: JWT sessions (no DB hit per request).
 * Provider:  Credentials (email + password via bcrypt).
 *
 * Future providers to add: GitHub, Google — just add to `providers[]`.
 * Future billing:          Check `token.plan` / `token.planExpiresAt` in callbacks.
 */

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

// ─── Type augmentation ────────────────────────────────
declare module "next-auth" {
  interface User {
    role?: string;
    plan?: string;
  }
  interface Session {
    user: {
      id: string;
      role: string;
      plan: string;
    } & DefaultSession["user"];
  }
  interface JWT {
    id?: string;
    role?: string;
    plan?: string;
  }
}

// ─── NextAuth config ──────────────────────────────────
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.active) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  user.name ?? undefined,
          role:  user.role,
          plan:  user.plan,
        };
      },
    }),
  ],
});
