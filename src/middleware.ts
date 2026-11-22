import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path.startsWith('/api/auth');
  
  const token = request.cookies.get('token')?.value;

  // If already logged in and visiting login, redirect to dashboard
  if (path === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If accessing public path, allow access
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // If not authenticated, redirect to login page
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Add the paths that should be checked by the middleware
export const config = {
  matcher: [
    '/((?!api/order|api/products/all|_next|login|favicon.ico|uploads|images|fonts).*)',
  ],
};
