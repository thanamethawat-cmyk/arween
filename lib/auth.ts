import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { acceptInviteForUser } from "@/lib/invite-service";
import { INVITE_COOKIE_NAME } from "@/types/schemas";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "อีเมล", type: "email" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.trim().toLowerCase();
      if (!email) {
        return "/login?error=missing_email";
      }

      const cookieStore = cookies();
      const inviteToken = cookieStore.get(INVITE_COOKIE_NAME)?.value;

      if (!inviteToken) {
        // อนุญาตให้เข้าด้วย Google ได้ถ้ามีบัญชีอยู่แล้ว หรือสร้างบัญชีว่างแล้วรอเชิญ
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: user.name || existing.name,
              emailVerified: new Date(),
            },
          });
          user.id = existing.id;
          user.role = existing.role;
          return true;
        }

        // ไม่มีคำเชิญและไม่มีบัญชี — ห้ามสมัครเอง
        return "/login?error=invite_required";
      }

      const result = await acceptInviteForUser({
        token: inviteToken,
        email,
        name: user.name || email.split("@")[0],
      });

      if (!result.ok) {
        if (result.reason === "email_mismatch") {
          return "/invite/" + inviteToken + "?error=email_mismatch";
        }
        if (result.reason === "expired" || result.reason === "accepted") {
          return "/invite/" + inviteToken + "?error=" + result.reason;
        }
        return "/login?error=invite_invalid";
      }

      const dbUser = await prisma.user.findUnique({ where: { id: result.userId } });
      if (dbUser) {
        user.id = dbUser.id;
        user.role = dbUser.role;
      }

      cookieStore.delete(INVITE_COOKIE_NAME);
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      } else if (token.email && !token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { email: String(token.email).toLowerCase() },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
};

export function isGoogleAuthConfigured() {
  return googleConfigured;
}
