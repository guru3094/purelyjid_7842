import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect /admin-panel routes (except the login page itself)
  if (pathname.startsWith('/admin-panel') && !pathname.startsWith('/admin-panel/login')) {
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin-panel/login';
      return NextResponse.redirect(url);
    }
    try {
      const parsed = JSON.parse(adminSession.value);
      if (!parsed?.email) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin-panel/login';
        return NextResponse.redirect(url);
      }
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = '/admin-panel/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin routes (legacy — keep for backward compat)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin-panel')) {
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin-panel/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
