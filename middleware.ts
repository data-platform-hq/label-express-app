//middleware.ts
import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Define public paths that don't require authentication
  const isPublicPage = path === '/auth/signin' || 
                       path === '/auth/signup' || 
                       path === '/auth/error'
                       
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    raw: true
  })
  
  // Redirect unauthenticated users to login
  if (!token && !isPublicPage) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname); // Optional: Add callbackUrl
    return NextResponse.redirect(signInUrl)
  }
  
  // Redirect authenticated users away from auth pages
  if (token && isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

// Configure which paths this middleware will run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|.*\\..*).*)',]
}