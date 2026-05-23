import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Auth disabled for initial deployment — uncomment to enable:
  // const { data: { user } } = await supabase.auth.getUser();
  // const publicPaths = ["/login", "/auth", "/api/calls/webhook"];
  // const isPublic = publicPaths.some((p) => request.nextUrl.pathname.startsWith(p));
  // if (!user && !isPublic) return NextResponse.redirect(new URL("/login", request.url));
  // if (user && request.nextUrl.pathname === "/login") return NextResponse.redirect(new URL("/admin", request.url));

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
