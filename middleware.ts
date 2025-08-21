import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthRoute = ["/login", "/signup"].includes(req.nextUrl.pathname);
  const isDashboardRoute = req.nextUrl.pathname.startsWith("/dashboard");

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!session && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*", // Protect dashboard and its subroutes
    "/profile/:path*", // Protect profile routes
    "/settings/:path*", // Protect settings
  ],
};
