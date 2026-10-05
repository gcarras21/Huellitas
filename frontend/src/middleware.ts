import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if there is any cookie that looks like a Supabase auth token
  const hasAuthToken = request.cookies.getAll().some(cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'));
  
  // Protect internal routes and client portal
  if (!hasAuthToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/perros/:path*', 
    '/solicitudes/:path*', 
    '/foster/:path*', 
    '/health/:path*', 
    '/events/:path*', 
    '/reports/:path*', 
    '/usuarios/:path*', 
    '/ai-metrics/:path*', 
    '/mi-cuenta/:path*'
  ],
};
