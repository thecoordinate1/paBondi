
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If you are using Next.js middleware, please refer to the guide below for fixing cookies issues:
          // https://supabase.com/docs/guides/auth/server-side/nextjs#setting-cookies-from-middleware
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers }});
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers }});
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // const { data: { user } } = await supabase.auth.getUser();

  // const currentPath = request.nextUrl.pathname;

  // const authRoutes = ['/login', '/signup', '/forgot-password', '/update-password'];
  // // Define public routes that do not require authentication.
  // const publicAppRoutes = ['/', '/products', '/stores', '/cart']; 
  // const productDetailPattern = /^\/products\/[^\/]+$/; // Matches /products/[id]
  // const storeDetailPattern = /^\/stores\/[^\/]+$/; // Matches /stores/[id]


  // // Check if the current path is a dynamic product or store detail page
  // const isProductDetailPublic = productDetailPattern.test(currentPath);
  // const isStoreDetailPublic = storeDetailPattern.test(currentPath);

  // const isPublicRoute = publicAppRoutes.includes(currentPath) || 
  //                       authRoutes.includes(currentPath) || 
  //                       currentPath.startsWith('/auth/callback') ||
  //                       isProductDetailPublic ||
  //                       isStoreDetailPublic;


  // // If user is not signed in and trying to access a protected route
  // if (!user && !isPublicRoute) {
  //   return NextResponse.redirect(new URL('/login?message=Please sign in to access this page.', request.url));
  // }

  // // If user is signed in and trying to access auth routes (login, signup)
  // if (user && authRoutes.includes(currentPath) && currentPath !== '/update-password') { // allow access to update-password if logged in
  //   return NextResponse.redirect(new URL('/', request.url)); // Redirect to homepage or dashboard
  // }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
