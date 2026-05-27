import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import type { NimbleSessionPayload } from './nimble-auth'

export const AUTH_SESSION_COOKIE = 'nimble_session'

export interface AuthContext {
  session: NimbleSessionPayload
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function getSessionSecret(): string {
  const secret = useRuntimeConfig().authSessionSecret
  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Auth session secret is not configured. Set NUXT_AUTH_SESSION_SECRET or NIMBLE_WEBHOOK_SECRET in .env',
    })
  }
  return secret
}

export function encodeSessionCookie(session: NimbleSessionPayload): string {
  const secret = getSessionSecret()
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
  const signature = signPayload(payload, secret)
  return `${payload}.${signature}`
}

export function decodeSessionCookie(cookieValue: string): NimbleSessionPayload | null {
  try {
    const secret = getSessionSecret()
    const [payload, signature] = cookieValue.split('.')
    if (!payload || !signature) return null

    const expected = signPayload(payload, secret)
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null

    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as NimbleSessionPayload
  }
  catch {
    return null
  }
}

export function getSessionFromEvent(event: H3Event): NimbleSessionPayload | null {
  const cookie = getCookie(event, AUTH_SESSION_COOKIE)
  if (!cookie) return null
  return decodeSessionCookie(cookie)
}

export function setSessionCookie(event: H3Event, session: NimbleSessionPayload) {
  setCookie(event, AUTH_SESSION_COOKIE, encodeSessionCookie(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, AUTH_SESSION_COOKIE, {
    path: '/',
  })
}

export function requireAuthSession(event: H3Event): NimbleSessionPayload {
  const session = getSessionFromEvent(event)
  if (!session?.token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }
  return session
}
