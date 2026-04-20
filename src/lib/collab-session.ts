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

function toBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function sign(payload: CollabPayload): Promise<string> {
  const json = JSON.stringify(payload)
  const base64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const key = await getKey()
  const encoder = new TextEncoder()
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(base64))
  return `${base64}.${toBase64Url(sig)}`
}

async function verify(token: string): Promise<CollabPayload | null> {
  const [base64, hmac] = token.split('.')
  if (!base64 || !hmac) return null

  const key = await getKey()
  const encoder = new TextEncoder()

  const hmacBytes = (() => {
    const padded = hmac.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(padded)
    const arr = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
    return arr
  })()

  const valid = await crypto.subtle.verify('HMAC', key, hmacBytes, encoder.encode(base64))
  if (!valid) return null

  try {
    const payload: CollabPayload = JSON.parse(fromBase64Url(base64))
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function createCollabSession(collabId: string, formId: string, role: CollabRole): Promise<string> {
  const now = Date.now()
  return sign({
    sub: collabId,
    form_id: formId,
    role,
    iat: now,
    exp: now + EXPIRES_HOURS * 60 * 60 * 1000,
  })
}

export async function verifyCollabSession(token: string): Promise<CollabPayload | null> {
  return verify(token)
}

export { COOKIE_NAME }
