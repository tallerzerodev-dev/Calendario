import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const normalizeEmail = (value?: string | null) =>
  (value ?? "").trim().toLowerCase();

const parseList = (value?: string | null) =>
  (value ?? "")
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);

const CODE_ADMIN_EMAILS = new Set(["izaurietamatiasignacio@gmail.com"]);

const getAdminEmails = () =>
  new Set([...CODE_ADMIN_EMAILS, ...parseList(process.env.SEED_ADMIN_EMAIL)]);

const getStudentEmails = () =>
  new Set(parseList(process.env.SEED_STUDENT_EMAILS));

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
      const email = normalizeEmail(user.email);
      if (!email) return false;

      const adminEmails = getAdminEmails();
      const studentEmails = getStudentEmails();

      const isAdmin = adminEmails.has(email);
      const isStudent = studentEmails.has(email);

      const allowed = await prisma.whitelist.findUnique({
        where: { email },
      });

      const isAllowed = Boolean(allowed) || isAdmin || isStudent;

      if (!isAllowed) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email },
      });

      const role = isAdmin
        ? "ADMIN"
        : isStudent
          ? "STUDENT"
          : dbUser?.role ?? "STUDENT";

      await prisma.whitelist.upsert({
        where: { email },
        update: {},
        create: { email },
      });

      await prisma.user.upsert({
        where: { email },
        update: { role },
        create: {
          email,
          role,
          name: user.name ?? null,
          image: user.image ?? null,
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email || token.email) {
        const email = normalizeEmail(user?.email ?? token.email);
        if (!email) return token;
        token.email = email;

        const adminEmails = getAdminEmails();
        const studentEmails = getStudentEmails();

        const dbUser = await prisma.user.findUnique({
          where: { email },
        });

        if (adminEmails.has(email)) {
          token.role = "ADMIN";
          await prisma.user.upsert({
            where: { email },
            update: { role: "ADMIN" },
            create: { email, role: "ADMIN" },
          });
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
        const email = normalizeEmail(token.email ?? session.user.email);
        const adminEmails = getAdminEmails();
        const studentEmails = getStudentEmails();

        if (email && adminEmails.has(email)) {
          session.user.role = "ADMIN";
        } else if (email && studentEmails.has(email)) {
          session.user.role = "STUDENT";
        } else {
          session.user.role = (token.role as string) ?? "STUDENT";
        }

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
