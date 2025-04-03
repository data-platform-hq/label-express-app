import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/auth/signin' || 
                       path === '/auth/signup' || 
                       path === '/auth/error'
                       
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })
  
  // Redirect unauthenticated users to login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // Redirect authenticated users away from auth pages
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

// Configure which paths this middleware will run on
export const config = {
  matcher: ['/', '/profile/:path*', '/settings/:path*', '/auth/:path*']
}