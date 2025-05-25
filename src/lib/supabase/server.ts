
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type cookies as NextCookiesType } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof NextCookiesType>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // The error "cookies() should be awaited before using its value" for cookieStore.get(name)
          // is unusual here as cookieStore is the result of cookies() and get is synchronous.
          // This explicit check is a precaution.
          const cookie = cookieStore.get(name);
          return cookie ? cookie.value : undefined;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

// Note on Font Loading Errors (403 Forbidden for .woff2 files):
// The 403 Forbidden errors for font files (e.g., /_next/static/media/...woff2)
// are likely an environment-specific issue (e.g., Cloud Workstations configuration,
// network policies, or specific Next.js serving issues in that environment)
// or a very specific middleware interaction not excluding these paths correctly.
// The middleware matcher `'/((?!_next/static|_next/image|favicon.ico|auth).*)'`
// should typically exclude `/_next/static/...` paths. If these errors persist,
// further investigation into the Cloud Workstations environment or how Next.js
// serves `next/font` assets there would be needed. This is generally outside
// the scope of direct application code changes for Supabase integration.
// Consider testing with direct font links (e.g., Google Fonts via <link>)
// temporarily to isolate if 'next/font' is part of the problem in this environment.
