import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { ratelimit } from './lib/ratelimit'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/public(.*)'])

export default clerkMiddleware(async (auth, request, event) => {
  if (!isPublicRoute(request)) {
    auth().protect()
  }

  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.ip ?? '127.0.0.1'
    const { success, pending } = await ratelimit.limit(ip)

    if (event && pending) {
      event.waitUntil(pending)
    }

    if (!success) {
      return new NextResponse('Rate limit exceeded', { status: 429 })
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
}
