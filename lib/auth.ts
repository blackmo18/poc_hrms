import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { toNextJsHandler } from "better-auth/next-js";
import { getUserRoles, getUserPermissions } from "./auth/auth-db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      enabled: !!process.env.GITHUB_CLIENT_ID,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
    // Include roles and permissions in session
    async onCreateSession(session) {
      if (session.user) {
        const roles = await getUserRoles(BigInt(session.user.id));
        const permissions = await getUserPermissions(BigInt(session.user.id));
        
        return {
          ...session,
          user: {
            ...session.user,
            roles: roles.map(role => role.name),
            permissions
          }
        };
      }
      return session;
    }
  },
  trustedOrigins: ["http://localhost:3000"],
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET
});

export type Session = typeof auth.$Infer.Session & {
  user: typeof auth.$Infer.Session.user & {
    roles?: string[];
    permissions?: string[];
  };
};

export const handler = toNextJsHandler(auth.handler);
