import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { toNextJsHandler } from "better-auth/next-js";

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
    expiresIn: parseInt(process.env.SESSION_EXPIRES_IN_MINUTES || "10080") * 60, // 7 days default (10080 minutes)
    updateAge: parseInt(process.env.SESSION_UPDATE_AGE_MINUTES || "1440") * 60, // 1 day default (1440 minutes)
    cookieCache: {
      enabled: true,
      maxAge: parseInt(process.env.SESSION_COOKIE_CACHE_AGE_MINUTES || "60") * 60, // 60 minutes default (increased from 5 to prevent premature expiration)
    }
  },
  trustedOrigins: ["http://localhost:3000"],
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET
});

export const handler = toNextJsHandler(auth.handler);

export type Session = typeof auth.$Infer.Session;
