import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "tracker_access";
const PUBLIC_PATHS = ["/locked"];

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const accessToken = process.env.ACCESS_TOKEN;

  // Erişim koruması ayarlanmadıysa (örn. yerel geliştirme), serbest bırak.
  if (!accessToken) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieValue === accessToken) {
    return NextResponse.next();
  }

  const tokenParam = searchParams.get("token");
  if (tokenParam === accessToken) {
    const cleanUrl = request.nextUrl.clone();
    cleanUrl.searchParams.delete("token");
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set(COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  }

  const lockedUrl = request.nextUrl.clone();
  lockedUrl.pathname = "/locked";
  lockedUrl.search = "";
  return NextResponse.redirect(lockedUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
