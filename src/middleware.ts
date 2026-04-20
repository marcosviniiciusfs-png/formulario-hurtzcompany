import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { verifyCollabSession, COOKIE_NAME as COLLAB_COOKIE } from '@/lib/collab-session'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    // Check if there's a valid collaborator session
    const collabToken = request.cookies.get(COLLAB_COOKIE)?.value
    if (collabToken) {
      const payload = verifyCollabSession(collabToken)
      if (payload) {
        const formIdMatch = request.nextUrl.pathname.match(/\/dashboard\/forms\/([a-f0-9-]+)/)
        if (formIdMatch && formIdMatch[1] === payload.form_id) {
          supabaseResponse.headers.set('x-collab-role', payload.role)
          supabaseResponse.headers.set('x-collab-form-id', payload.form_id)
          supabaseResponse.headers.set('x-collab-id', payload.sub)
          return supabaseResponse
        }
      }
      supabaseResponse.cookies.delete(COLLAB_COOKIE)
    }

    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  if (request.nextUrl.pathname.startsWith('/auth') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Pass user info to server components
  if (user) {
    supabaseResponse.headers.set('x-user-id', user.id)
    supabaseResponse.headers.set('x-user-email', user.email || '')
  }

  // Also check collaborator session for dashboard routes (when user IS logged in)
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const collabToken = request.cookies.get(COLLAB_COOKIE)?.value
    if (collabToken) {
      const payload = verifyCollabSession(collabToken)
      if (payload) {
        supabaseResponse.headers.set('x-collab-role', payload.role)
        supabaseResponse.headers.set('x-collab-form-id', payload.form_id)
        supabaseResponse.headers.set('x-collab-id', payload.sub)
      } else {
        supabaseResponse.cookies.delete(COLLAB_COOKIE)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}