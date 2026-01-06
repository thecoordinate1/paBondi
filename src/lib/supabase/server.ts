
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type cookies as NextCookiesType } from "next/headers";

export const createClient = (cookieStore: Awaited<ReturnType<typeof NextCookiesType>>) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE_URL') || !supabaseKey || supabaseKey.includes('YOUR_SUPABASE_ANON_KEY')) {
    throw new Error('Supabase credentials are still placeholders. Please replace "YOUR_SUPABASE_URL" and "YOUR_SUPABASE_ANON_KEY" in your .env.local file with your actual Supabase credentials.');
  }

  if (!supabaseUrl.startsWith('http')) {
    throw new Error('The Supabase URL appears to be invalid. It should start with "http" or "https". Please check your .env.local file.');
  }


  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get: (name: string) => {
          // The error "cookies() should be awaited before using its value" for cookieStore.get(name)
          // is unusual here as cookieStore is the result of cookies() and get is synchronous.
          // This explicit check is a precaution.
          const cookie = cookieStore.get(name);
          return cookie ? cookie.value : undefined;
        },
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have proxy refreshing
            // user sessions.
          }
        },
      },
    }
  );
};


