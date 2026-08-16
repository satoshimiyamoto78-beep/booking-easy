import { NextRequest, NextResponse } from "next/server";
import { decrypt, SESSION_COOKIE_NAME } from "@/lib/session";

const PUBLIC_PLATFORM_ROUTES = ["/platform/login"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/platform")) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_PLATFORM_ROUTES.includes(pathname);
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decrypt(token);
  const isValidSession = Boolean(session?.platformAdminId);

  if (!isPublicRoute && !isValidSession) {
    const loginUrl = new URL("/platform/login", req.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicRoute && isValidSession) {
    return NextResponse.redirect(new URL("/platform", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/platform/:path*"],
};
