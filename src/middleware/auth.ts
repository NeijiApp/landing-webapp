import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Protected route configuration
 */
const PROTECTED_ROUTES = [
  '/protected',
  '/admin',
  '/api/chat/history',
  '/api/user',
];

const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/auth/callback',
  '/api/auth',
];

/**
 * Rate limiting configuration
 */
type RateLimit = { requests: number; windowMs: number };

const RATE_LIMITS: Record<string, RateLimit[]> = {
  // Open to visitors without an account and costly, so kept low, with a
  // second longer window.
  '/api/meditation': [
    { requests: 4, windowMs: 60_000 },
    { requests: 10, windowMs: 3_600_000 },
  ],
  '/api/chat': [
    { requests: 30, windowMs: 60_000 },
    { requests: 300, windowMs: 3_600_000 },
  ],
};
const DEFAULT_RATE_LIMITS: RateLimit[] = [{ requests: 100, windowMs: 60_000 }];

/**
 * In-memory store: one per server instance, so these limits are per instance.
 * A limit shared by all instances needs an external store.
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_STORE_MAX = 5000;

function purgeExpired(now: number) {
  for (const [key, record] of rateLimitStore) {
    if (record.resetTime < now) rateLimitStore.delete(key);
  }
  // Still full of live entries: drop the oldest ones (Map keeps insertion order).
  for (const key of rateLimitStore.keys()) {
    if (rateLimitStore.size <= RATE_LIMIT_STORE_MAX) break;
    rateLimitStore.delete(key);
  }
}

/**
 * Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Check rate limits
 */
function checkRateLimit(pathname: string, clientId: string): boolean {
  const specific = Object.hasOwn(RATE_LIMITS, pathname) ? RATE_LIMITS[pathname] : undefined;
  const limits = specific ?? DEFAULT_RATE_LIMITS;
  // Other paths share one bucket per client, so the store does not grow with
  // the number of distinct URLs.
  const bucket = specific ? pathname : 'default';
  const now = Date.now();

  if (rateLimitStore.size > RATE_LIMIT_STORE_MAX) purgeExpired(now);

  const records = limits.map((limit) => {
    const key = `${clientId}:${bucket}:${limit.windowMs}`;
    const record = rateLimitStore.get(key);
    return { key, limit, record: record && record.resetTime >= now ? record : undefined };
  });

  // Refuse when any window is full, without counting the refused request.
  if (records.some(({ record, limit }) => record && record.count >= limit.requests)) {
    return false;
  }

  for (const { key, limit, record } of records) {
    if (record) record.count++;
    else rateLimitStore.set(key, { count: 1, resetTime: now + limit.windowMs });
  }
  return true;
}

/**
 * Enhanced authentication middleware
 */
export async function authMiddleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Get pathname
  const pathname = request.nextUrl.pathname;

  // Check rate limiting
  const clientId = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  if (!checkRateLimit(pathname, clientId)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // Check if route is protected
  if (isProtectedRoute(pathname)) {
    // Get session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      // Redirect to login for web routes, return 401 for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      const redirectUrl = new URL('/auth', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Add user context to headers for API routes
    if (pathname.startsWith('/api/')) {
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-email', session.user.email || '');
    }
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}
