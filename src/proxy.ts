import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, hasLocale, type Locale } from "./dictionaries";

function getLocaleFromPathname(pathname: string): Locale | null {
  const first = pathname.split("/").filter(Boolean)[0];
  return hasLocale(first) ? (first as Locale) : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for _next, api routes, and static files (have an extension)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.\w{1,6}$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const pathnameLocale = getLocaleFromPathname(pathname);

  if (!pathnameLocale) {
    // Prefix the URL with the default locale
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url, 308);
  }

  // Reject unsupported locales (e.g. /de/danso)
  if (!locales.includes(pathnameLocale)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname.replace(/^\/[^/]+/, "")}`;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og|gallery|reviews|story|exterior|icon\\.png|sitemap\\.xml|robots\\.txt).*)",
  ],
};
