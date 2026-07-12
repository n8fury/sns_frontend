import { NextResponse, type NextRequest } from 'next/server';

import { TOKEN_COOKIE } from '@/store/useAuthStore';

const PROTECTED_ROUTES = ['/tasks', '/annotate'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/tasks', request.url));
  }

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (isProtected && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/login' && hasToken) {
    return NextResponse.redirect(new URL('/tasks', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/tasks/:path*', '/annotate/:path*'],
};
