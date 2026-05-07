import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const allowed = await prisma.whitelist.findUnique({
        where: { email: user.email },
      });

      if (allowed) return true;

      const parseList = (value?: string | null) =>
        (value ?? "")
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean);

      const adminEmails = new Set(parseList(process.env.SEED_ADMIN_EMAIL));
      const studentEmails = new Set(
        parseList(process.env.SEED_STUDENT_EMAILS),
      );

      const isAllowed = adminEmails.has(user.email) || studentEmails.has(user.email);

      if (!isAllowed) return false;

      await prisma.whitelist.upsert({
        where: { email: user.email },
        update: {},
        create: { email: user.email },
      });

      await prisma.user.upsert({
        where: { email: user.email },
        update: { role: adminEmails.has(user.email) ? "ADMIN" : "STUDENT" },
        create: {
          email: user.email,
          role: adminEmails.has(user.email) ? "ADMIN" : "STUDENT",
          name: user.name ?? null,
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        token.role = dbUser?.role ?? "STUDENT";
        token.name = dbUser?.name ?? token.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? "STUDENT";
        session.user.name = token.name ?? session.user.name;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
