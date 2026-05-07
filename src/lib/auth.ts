import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const CODE_ADMIN_EMAILS = new Set(["izaurietamatiasignacio@gmail.com"]);

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

      const parseList = (value?: string | null) =>
        (value ?? "")
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean);

      const adminEmails = new Set([
        ...CODE_ADMIN_EMAILS,
        ...parseList(process.env.SEED_ADMIN_EMAIL),
      ]);
      const studentEmails = new Set(
        parseList(process.env.SEED_STUDENT_EMAILS),
      );

      const isAdmin = adminEmails.has(user.email);
      const isStudent = studentEmails.has(user.email);

      const allowed = await prisma.whitelist.findUnique({
        where: { email: user.email },
      });

      const isAllowed = Boolean(allowed) || isAdmin || isStudent;

      if (!isAllowed) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      const role = isAdmin
        ? "ADMIN"
        : isStudent
          ? "STUDENT"
          : dbUser?.role ?? "STUDENT";

      await prisma.whitelist.upsert({
        where: { email: user.email },
        update: {},
        create: { email: user.email },
      });

      await prisma.user.upsert({
        where: { email: user.email },
        update: { role },
        create: {
          email: user.email,
          role,
          name: user.name ?? null,
          image: user.image ?? null,
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      const parseList = (value?: string | null) =>
        (value ?? "")
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean);

      if (user?.email || token.email) {
        const email = user?.email ?? token.email;
        if (!email) return token;

      const adminEmails = new Set([
        ...CODE_ADMIN_EMAILS,
        ...parseList(process.env.SEED_ADMIN_EMAIL),
      ]);
        const studentEmails = new Set(
          parseList(process.env.SEED_STUDENT_EMAILS),
        );

        const dbUser = await prisma.user.findUnique({
          where: { email },
        });

        if (adminEmails.has(email)) {
          token.role = "ADMIN";
          if (dbUser && dbUser.role !== "ADMIN") {
            await prisma.user.update({
              where: { email },
              data: { role: "ADMIN" },
            });
          }
        } else if (studentEmails.has(email)) {
          token.role = "STUDENT";
        } else {
          token.role = dbUser?.role ?? "STUDENT";
        }

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
