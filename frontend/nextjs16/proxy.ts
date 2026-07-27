import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hasAccessToken = request.cookies.has("access_token");
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!hasAccessToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (hasAccessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
