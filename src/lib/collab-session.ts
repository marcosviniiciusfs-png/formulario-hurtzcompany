import { createHmac, timingSafeEqual } from 'crypto'
import { CollabRole } from '@/types'

const SECRET = process.env.COLLAB_SECRET || 'dev-secret-change-in-prod'
const COOKIE_NAME = 'collab_session'
const EXPIRES_HOURS = 24

interface CollabPayload {
  sub: string
  form_id: string
  role: CollabRole
  iat: number
  exp: number
}

function sign(payload: CollabPayload): string {
  const json = JSON.stringify(payload)
  const base64 = Buffer.from(json).toString('base64url')
  const hmac = createHmac('sha256', SECRET).update(base64).digest('base64url')
  return `${base64}.${hmac}`
}

function verify(token: string): CollabPayload | null {
  const [base64, hmac] = token.split('.')
  if (!base64 || !hmac) return null

  const expected = createHmac('sha256', SECRET).update(base64).digest('base64url')
  const hmacBuf = Buffer.from(hmac)
  const expectedBuf = Buffer.from(expected)
  if (hmacBuf.length !== expectedBuf.length) return null
  if (!timingSafeEqual(hmacBuf, expectedBuf)) return null

  try {
    const payload: CollabPayload = JSON.parse(Buffer.from(base64, 'base64url').toString())
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function createCollabSession(collabId: string, formId: string, role: CollabRole): string {
  const now = Date.now()
  return sign({
    sub: collabId,
    form_id: formId,
    role,
    iat: now,
    exp: now + EXPIRES_HOURS * 60 * 60 * 1000,
  })
}

export function verifyCollabSession(token: string): CollabPayload | null {
  return verify(token)
}

export { COOKIE_NAME }