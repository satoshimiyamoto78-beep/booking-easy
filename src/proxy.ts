import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const PUBLIC_ADMIN_ROUTES = ["/admin/login"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const isPublicAdminRoute = PUBLIC_ADMIN_ROUTES.includes(pathname);
  const token = req.cookies.get("session")?.value;
  const session = await decrypt(token);

  if (!isPublicAdminRoute && !session?.adminId) {
    const loginUrl = new URL("/admin/login", req.nextUrl);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicAdminRoute && session?.adminId) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
