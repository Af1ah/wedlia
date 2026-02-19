import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// Subdomain Routing Middleware
// ============================================================

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Get root domain from environment or default
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
  
  // Extract subdomain
  // For localhost:3000, we check for studio.localhost:3000
  // For production, we check for studio.mystudios.com
  let subdomain: string | null = null;
  
  if (hostname.includes('.')) {
    // Remove port if present
    const hostnameWithoutPort = hostname.split(':')[0];
    const rootDomainWithoutPort = rootDomain.split(':')[0];
    
    // Check if this is a subdomain request
    if (hostnameWithoutPort.endsWith(rootDomainWithoutPort) && 
        hostnameWithoutPort !== rootDomainWithoutPort &&
        hostnameWithoutPort !== `www.${rootDomainWithoutPort}`) {
      subdomain = hostnameWithoutPort.replace(`.${rootDomainWithoutPort}`, '');
    }
  }
  
  // If accessing via subdomain, rewrite to portfolio route
  if (subdomain) {
    // Skip for api routes, static files, and Next.js internals
    if (url.pathname.startsWith('/api') || 
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/favicon') ||
        url.pathname.includes('.')) {
      return NextResponse.next();
    }
    
    // Rewrite to portfolio pages
    // studio.domain.com -> /p/studio
    // studio.domain.com/gallery-id -> /p/studio/gallery-id
    const newPath = `/p/${subdomain}${url.pathname}`;
    
    return NextResponse.rewrite(new URL(newPath, request.url));
  }
  
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
