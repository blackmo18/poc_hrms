// proxy.ts
import { NextResponse } from "next/server";
import { auth, Session } from "./lib/auth";

export async function proxy(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Read public routes from environment variable
  const DEFAULT_PUBLIC_ROUTES = ["/", "/signin", "/signup", "/api/auth"];
  const publicRoutesEnv = process.env.PUBLIC_ROUTES;

  const publicRoutes = publicRoutesEnv 
    ? publicRoutesEnv.split(',').map(route => route.trim()).filter(route => route.length > 0)
    : DEFAULT_PUBLIC_ROUTES; // fallback to default
  
  const isPublic = publicRoutes.some((p) => pathname === p || pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  // -----------------------------
  // 1) Read cookie from request
  // -----------------------------
  const cookieHeader = req.headers.get("cookie") ?? "";

  // -----------------------------
  // 2) Get session from Better Auth using the cookies
  // -----------------------------
  const session: Session | null = await auth.api.getSession({
    headers: new Headers({ cookie: cookieHeader }),
  });

  if (!session?.user) {
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // -----------------------------
  // 3) Check permissions for protected routes
  // -----------------------------
  // Note: Better Auth session doesn't include custom permissions/roles
  // These would need to be fetched separately if required
  const userPermissions: string[] = [];
  const userRoles: string[] = [];

  // Example permission checks for specific routes
  if (pathname.startsWith("/api/admin")) {
    if (!userRoles.includes("ADMIN")) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (pathname.startsWith("/api/users")) {
    if (!userPermissions.includes("users:read")) {
      return new NextResponse(
        JSON.stringify({ error: "Forbidden: User read permission required" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Add user context to request headers for downstream use
  const response = NextResponse.next();
  response.headers.set("x-user-id", session.user.id);
  response.headers.set("x-user-roles", JSON.stringify(userRoles));
  response.headers.set("x-user-permissions", JSON.stringify(userPermissions));

  return response;
}

// Apply proxy to all routes
export const config = {
  matcher: ["/:path*"],
};
