# Form Collaborators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow form owners to share access with collaborators via email + password, with 3 permission levels (editor, viewer, readonly), no account required.

**Architecture:** New `form_collaborators` table with bcryptjs-hashed passwords. HMAC-signed cookie (`collab_session`) for collaborator auth. Same FormEditor UI with role-based prop to hide/show actions. New "Compartilhar" tab alongside Editor and Respostas.

**Tech Stack:** Next.js 16 App Router, Supabase, bcryptjs, Node.js crypto (HMAC), Zustand

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Modify | Add bcryptjs + @types/bcryptjs |
| `supabase/migrations/002_collaborators.sql` | Create | DB table, RLS, indexes |
| `src/types/index.ts` | Modify | Add CollabRole, Collaborator types |
| `src/lib/collab-session.ts` | Create | HMAC sign/verify cookie helpers |
| `src/app/api/forms/[id]/collaborators/route.ts` | Create | GET (list) + POST (add) collaborators |
| `src/app/api/forms/[id]/collaborators/[cid]/route.ts` | Create | DELETE collaborator |
| `src/app/api/collab/login/route.ts` | Create | Collaborator login endpoint |
| `src/middleware.ts` | Modify | Validate collab_session cookie, inject headers |
| `src/app/f/[slug]/collab/page.tsx` | Create | Collaborator login page |
| `src/components/editor/EditorSharing.tsx` | Create | Sharing tab content (list, add, copy link) |
| `src/components/editor/FormEditor.tsx` | Modify | Accept `collabRole` prop, add Compartilhar tab, hide actions by role |
| `src/app/dashboard/forms/[id]/FormEditorClient.tsx` | Modify | Read collab headers, pass role to FormEditor |
| `src/app/dashboard/forms/[id]/page.tsx` | Modify | Allow collaborator access (not just owner) |

---

### Task 1: Install bcryptjs

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install bcryptjs**

```bash
cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz"
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Verify install**

Run: `npm ls bcryptjs`
Expected: `bcryptjs@x.x.x` listed

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add bcryptjs for collaborator password hashing"
```

---

### Task 2: Add TypeScript types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add CollabRole and Collaborator types**

Append to end of `src/types/index.ts`:

```typescript
export type CollabRole = 'editor' | 'viewer' | 'readonly'

export interface Collaborator {
  id: string
  form_id: string
  email: string
  nome: string
  role: CollabRole
  expires_at: string | null
  created_at: string
}
```

- [ ] **Step 2: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add CollabRole and Collaborator types"
```

---

### Task 3: Create HMAC session helpers

**Files:**
- Create: `src/lib/collab-session.ts`

- [ ] **Step 1: Create collab-session.ts**

Create `src/lib/collab-session.ts` with this content:

```typescript
import { createHmac, timingSafeEqual } from 'crypto'
import { CollabRole } from '@/types'

const SECRET = process.env.COLLAB_SECRET || 'dev-secret-change-in-prod'
const COOKIE_NAME = 'collab_session'
const EXPIRES_HOURS = 24

interface CollabPayload {
  sub: string    // collaborator id
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
```

- [ ] **Step 2: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/lib/collab-session.ts
git commit -m "feat: add HMAC session helpers for collaborator auth"
```

---

### Task 4: Create database migration

**Files:**
- Create: `supabase/migrations/002_collaborators.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/002_collaborators.sql` with this content:

```sql
-- Form collaborators: share forms with people without accounts
CREATE TABLE IF NOT EXISTS form_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  email text NOT NULL,
  senha_hash text NOT NULL,
  nome text NOT NULL,
  role text NOT NULL CHECK (role IN ('editor', 'viewer', 'readonly')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(form_id, email)
);

ALTER TABLE form_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage collaborators"
  ON form_collaborators
  FOR ALL
  USING (
    form_id IN (SELECT id FROM forms WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_collaborators_form ON form_collaborators(form_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_email ON form_collaborators(form_id, email);
```

- [ ] **Step 2: Run migration in Supabase**

Execute the SQL in the Supabase SQL Editor (dashboard). Verify table `form_collaborators` appears in the Table Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_collaborators.sql
git commit -m "feat: add form_collaborators migration"
```

---

### Task 5: Create collaborators API (GET + POST)

**Files:**
- Create: `src/app/api/forms/[id]/collaborators/route.ts`

- [ ] **Step 1: Create the route file**

Create `src/app/api/forms/[id]/collaborators/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!form) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('form_collaborators')
    .select('id, email, nome, role, expires_at, created_at')
    .eq('form_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!form) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const { email, senha, nome, role, expires_at } = body

  if (!email || !senha || !nome || !role) {
    return NextResponse.json({ error: 'email, senha, nome e role são obrigatórios' }, { status: 400 })
  }

  if (!['editor', 'viewer', 'readonly'].includes(role)) {
    return NextResponse.json({ error: 'Role inválida' }, { status: 400 })
  }

  const senha_hash = await bcrypt.hash(senha, 10)

  const { data, error } = await supabase
    .from('form_collaborators')
    .insert({
      form_id: id,
      email: email.toLowerCase().trim(),
      senha_hash,
      nome: nome.trim(),
      role,
      expires_at: expires_at || null,
    })
    .select('id, email, nome, role, expires_at, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Este email já tem acesso a este formulário' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 2: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/forms/[id]/collaborators/route.ts
git commit -m "feat: add GET/POST collaborators API"
```

---

### Task 6: Create collaborators DELETE API

**Files:**
- Create: `src/app/api/forms/[id]/collaborators/[cid]/route.ts`

- [ ] **Step 1: Create the route file**

Create `src/app/api/forms/[id]/collaborators/[cid]/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cid: string }> }
) {
  const { id, cid } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!form) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('form_collaborators')
    .delete()
    .eq('id', cid)
    .eq('form_id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/forms/[id]/collaborators/[cid]/route.ts
git commit -m "feat: add DELETE collaborator API"
```

---

### Task 7: Create collaborator login API

**Files:**
- Create: `src/app/api/collab/login/route.ts`

- [ ] **Step 1: Create the login route**

Create `src/app/api/collab/login/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createCollabSession, COOKIE_NAME } from '@/lib/collab-session'

export async function POST(request: NextRequest) {
  const { email, senha, slug } = await request.json()

  if (!email || !senha || !slug) {
    return NextResponse.json({ error: 'email, senha e slug são obrigatórios' }, { status: 400 })
  }

  const supabase = await createClient()

  // Find form by slug
  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  // Find collaborator
  const { data: collab } = await supabase
    .from('form_collaborators')
    .select('id, email, senha_hash, role, expires_at')
    .eq('form_id', form.id)
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!collab) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  // Check expiration
  if (collab.expires_at && new Date(collab.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Acesso expirado' }, { status: 403 })
  }

  // Verify password
  const valid = await bcrypt.compare(senha, collab.senha_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  // Create session
  const token = createCollabSession(collab.id, form.id, collab.role)

  const response = NextResponse.json({
    success: true,
    form_id: form.id,
    role: collab.role,
  })

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  })

  return response
}
```

- [ ] **Step 2: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/collab/login/route.ts
git commit -m "feat: add collaborator login API"
```

---

### Task 8: Update middleware for collaborator sessions

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Rewrite middleware to handle collab_session**

Replace the entire content of `src/middleware.ts` with:

```typescript
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
        // Valid collaborator — allow access to specific form editor
        const formIdMatch = request.nextUrl.pathname.match(/\/dashboard\/forms\/([a-f0-9-]+)/)
        if (formIdMatch && formIdMatch[1] === payload.form_id) {
          supabaseResponse.headers.set('x-collab-role', payload.role)
          supabaseResponse.headers.set('x-collab-form-id', payload.form_id)
          supabaseResponse.headers.set('x-collab-id', payload.sub)
          return supabaseResponse
        }
      }
      // Invalid or expired — clear cookie
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
```

- [ ] **Step 2: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: middleware validates collab_session for collaborator access"
```

---

### Task 9: Create collaborator login page

**Files:**
- Create: `src/app/f/[slug]/collab/page.tsx`

- [ ] **Step 1: Create server component**

Create `src/app/f/[slug]/collab/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CollabLoginClient } from './CollabLoginClient'

export default async function CollabLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Find form by slug (published or not — collaborators can access drafts too)
  const { data: form } = await supabase
    .from('forms')
    .select('id, titulo')
    .eq('slug', slug)
    .single()

  if (!form) notFound()

  // Check if form has collaborators
  const { count } = await supabase
    .from('form_collaborators')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', form.id)

  if (!count || count === 0) {
    // No collaborators — redirect to public form
    const { redirect } = await import('next/navigation')
    redirect(`/f/${slug}`)
  }

  return <CollabLoginClient slug={slug} titulo={form.titulo} />
}
```

- [ ] **Step 2: Create client component**

Create `src/app/f/[slug]/collab/CollabLoginClient.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'

interface CollabLoginClientProps {
  slug: string
  titulo: string
}

export function CollabLoginClient({ slug, titulo }: CollabLoginClientProps) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/collab/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha, slug }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login')
        return
      }

      router.push(`/dashboard/forms/${data.form_id}`)
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Lock size={24} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-gray-900 text-center mb-1">{titulo}</h1>
          <p className="text-sm text-gray-500 text-center mb-6">Acesse com suas credenciais</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/f/[slug]/collab/page.tsx src/app/f/[slug]/collab/CollabLoginClient.tsx
git commit -m "feat: add collaborator login page at /f/[slug]/collab"
```

---

### Task 10: Create EditorSharing component

**Files:**
- Create: `src/components/editor/EditorSharing.tsx`

- [ ] **Step 1: Create the sharing tab component**

Create `src/components/editor/EditorSharing.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { CollabRole, Collaborator } from '@/types'
import { Plus, Trash2, Copy, Check, Users, Loader2, Clock } from 'lucide-react'

interface EditorSharingProps {
  formId: string
  slug: string
}

const ROLE_LABELS: Record<CollabRole, { label: string; color: string }> = {
  editor: { label: 'Editor', color: 'bg-blue-50 text-blue-700' },
  viewer: { label: 'Ver respostas', color: 'bg-green-50 text-green-700' },
  readonly: { label: 'Somente leitura', color: 'bg-gray-100 text-gray-600' },
}

export function EditorSharing({ formId, slug }: EditorSharingProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'viewer' as CollabRole, expires_at: '' })

  const fetchCollaborators = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forms/${formId}/collaborators`)
      if (res.ok) {
        const data = await res.json()
        setCollaborators(data)
      }
    } finally {
      setLoading(false)
    }
  }, [formId])

  useEffect(() => {
    if (formId !== 'new') fetchCollaborators()
  }, [formId, fetchCollaborators])

  const handleAdd = async () => {
    if (!form.email || !form.senha || !form.nome) return
    setAdding(true)
    try {
      const res = await fetch(`/api/forms/${formId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          senha: form.senha,
          nome: form.nome,
          role: form.role,
          expires_at: form.expires_at || null,
        }),
      })
      if (res.ok) {
        setForm({ nome: '', email: '', senha: '', role: 'viewer', expires_at: '' })
        fetchCollaborators()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao adicionar')
      }
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (cid: string) => {
    if (!confirm('Remover acesso desta pessoa?')) return
    await fetch(`/api/forms/${formId}/collaborators/${cid}`, { method: 'DELETE' })
    fetchCollaborators()
  }

  const copyLink = () => {
    const url = `${window.location.origin}/f/${slug}/collab`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (formId === 'new') {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Salve o formulário para compartilhar
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
        {/* Share link */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users size={16} /> Link de compartilhamento
          </h3>
          <div className="flex gap-2">
            <input
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/f/${slug}/collab`}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-gray-50"
            />
            <button onClick={copyLink}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 shrink-0">
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Envie este link para a pessoa que deve acessar o formulário.</p>
        </div>

        {/* Add collaborator */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Plus size={16} /> Adicionar pessoa
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nome"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Senha de acesso"
              value={form.senha}
              onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as CollabRole }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="editor">Edição completa</option>
              <option value="viewer">Ver respostas</option>
              <option value="readonly">Somente leitura</option>
            </select>
            <input
              type="datetime-local"
              placeholder="Expira em (opcional)"
              value={form.expires_at}
              onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent col-span-2"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !form.email || !form.senha || !form.nome}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Adicionar
          </button>
        </div>

        {/* Collaborator list */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Pessoas com acesso ({collaborators.length})</h3>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <Loader2 size={20} className="animate-spin text-gray-400 mx-auto" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              Nenhuma pessoa com acesso ainda
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {collaborators.map(collab => (
                <div key={collab.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                      {collab.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{collab.nome}</p>
                      <p className="text-xs text-gray-400 truncate">{collab.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_LABELS[collab.role].color}`}>
                      {ROLE_LABELS[collab.role].label}
                    </span>
                    {collab.expires_at && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5" title={`Expira em ${new Date(collab.expires_at).toLocaleString('pt-BR')}`}>
                        <Clock size={10} />
                      </span>
                    )}
                    <button
                      onClick={() => handleRemove(collab.id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/EditorSharing.tsx
git commit -m "feat: add EditorSharing component with collaborator management UI"
```

---

### Task 11: Update FormEditor with role prop and Compartilhar tab

**Files:**
- Modify: `src/components/editor/FormEditor.tsx`

- [ ] **Step 1: Update FormEditor props and imports**

Replace the imports and interface at the top of `src/components/editor/FormEditor.tsx`:

```typescript
'use client'

import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { ListMode } from './ListMode'
import { InlineMode } from './InlineMode'
import { CanvasMode } from './CanvasMode'
import { FieldProperties } from './FieldProperties'
import { EditorResponses } from './EditorResponses'
import { EditorSharing } from './EditorSharing'
import { FieldType, CollabRole } from '@/types'
import { List, FileText, LayoutGrid, Save, Eye, Rocket, Sparkles, Loader2, MessageSquare, Copy, Check, Share2 } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { generateSlug } from '@/lib/utils'

interface FormEditorProps {
  formId: string
  collabRole?: CollabRole | null
}
```

- [ ] **Step 2: Update component signature and tab type**

Change the component signature from `export function FormEditor({ formId }: FormEditorProps)` to:

```typescript
export function FormEditor({ formId, collabRole }: FormEditorProps) {
```

Change the `activeTab` state type to include `'sharing'`:

```typescript
const [activeTab, setActiveTab] = useState<'editor' | 'responses' | 'sharing'>('editor')
```

- [ ] **Step 3: Add role check helpers**

Add these after the `showToast` callback:

```typescript
  const isOwner = !collabRole
  const canEdit = isOwner || collabRole === 'editor'
  const canViewResponses = isOwner || collabRole === 'editor' || collabRole === 'viewer'
```

- [ ] **Step 4: Hide owner-only buttons in header**

Wrap the IA button, Salvar button, Publicar button, and Copiar link button with role checks:

Replace the `<div className="flex items-center gap-2">` block (lines 160-191) with:

```tsx
          <div className="flex items-center gap-2">
            {canEdit && (
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {modeButtons.map(({ mode, icon, label }) => (
                  <button key={mode} onClick={() => setEditMode(mode)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${editMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {icon} <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            )}
            {isOwner && (
              <button onClick={() => setShowAiPanel(!showAiPanel)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                <Sparkles size={14} /> <span className="hidden sm:inline">IA</span>
              </button>
            )}
            {canEdit && (
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
              </button>
            )}
            {isOwner && formId !== 'new' && (
              <button onClick={handlePublish} disabled={publishing}
                className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg disabled:opacity-50 ${form.publicado ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {publishing ? <Loader2 size={14} className="animate-spin" /> : form.publicado ? <Eye size={14} /> : <Rocket size={14} />}
                {form.publicado ? 'Publicado' : 'Publicar'}
              </button>
            )}
            {isOwner && form.publicado && (
              <button onClick={copyLink}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar link'}
              </button>
            )}
          </div>
```

- [ ] **Step 5: Update tabs to include Compartilhar**

Replace the tabs `<div className="px-4 flex gap-1">` block (lines 195-204) with:

```tsx
        <div className="px-4 flex gap-1">
          <button onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${activeTab === 'editor' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            Editor
          </button>
          {canViewResponses && (
            <button onClick={() => setActiveTab('responses')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1 ${activeTab === 'responses' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <MessageSquare size={12} /> Respostas
            </button>
          )}
          {isOwner && (
            <button onClick={() => setActiveTab('sharing')}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors flex items-center gap-1 ${activeTab === 'sharing' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              <Share2 size={12} /> Compartilhar
            </button>
          )}
        </div>
```

- [ ] **Step 6: Update body to handle sharing tab**

Replace the body `<div className="flex-1 flex min-h-0">` block (lines 231-244) with:

```tsx
      <div className="flex-1 flex min-h-0">
        {activeTab === 'editor' ? (
          <>
            <div className="flex-1 min-h-0 flex flex-col">
              {editMode === 'list' && <ListMode readOnly={!canEdit} />}
              {editMode === 'inline' && <InlineMode readOnly={!canEdit} />}
              {editMode === 'canvas' && <CanvasMode readOnly={!canEdit} />}
            </div>
            {selectedField && editMode === 'list' && <FieldProperties field={selectedField} />}
          </>
        ) : activeTab === 'responses' ? (
          <EditorResponses formId={formId} />
        ) : (
          <EditorSharing formId={formId} slug={form.slug || generateSlug(form.titulo)} />
        )}
      </div>
```

- [ ] **Step 7: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add src/components/editor/FormEditor.tsx
git commit -m "feat: add Compartilhar tab and role-based permissions to FormEditor"
```

---

### Task 12: Update ListMode, InlineMode, CanvasMode for readOnly prop

**Files:**
- Modify: `src/components/editor/ListMode.tsx`
- Modify: `src/components/editor/InlineMode.tsx`
- Modify: `src/components/editor/CanvasMode.tsx`

- [ ] **Step 1: Add readOnly to ListMode**

Replace `src/components/editor/ListMode.tsx` entirely:

```typescript
'use client'

import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { FieldTypeSelector } from './FieldTypeSelector'
import { FieldCard } from './FieldCard'

interface ListModeProps {
  readOnly?: boolean
}

export function ListMode({ readOnly }: ListModeProps) {
  const { fields, addField, selectedFieldId } = useFormEditorStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6 px-4 space-y-3">
          {fields.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">Nenhum campo adicionado</p>
              <p className="text-sm mt-1">Adicione campos usando o botão abaixo ou use a IA para gerar</p>
            </div>
          )}
          {fields.map((field, index) => (
            <FieldCard key={field.id} field={field} index={index} readOnly={readOnly} />
          ))}
          <div className="h-20" />
        </div>
      </div>

      {!readOnly && (
        <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <FieldTypeSelector onSelect={addField} />
          </div>
        </div>
      )}
    </div>
  )
}
```

Note: `FieldCard` may not accept `readOnly` yet. If it doesn't have a `readOnly` prop, the build will still pass — it'll just be ignored. The key UX change is hiding the add button.

- [ ] **Step 2: Add readOnly to InlineMode**

In `src/components/editor/InlineMode.tsx`, change the function signature from:

```typescript
export function InlineMode() {
```

to:

```typescript
interface InlineModeProps {
  readOnly?: boolean
}

export function InlineMode({ readOnly }: InlineModeProps) {
```

Then hide the add field button when readOnly. Replace the "Adicionar campo" button section (around line 63-70):

```tsx
            {!readOnly && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Plus size={16} />
                  Adicionar campo
                </button>
              </div>
            )}
```

And hide the trash button in `InlineFieldRow`. Replace the trash button (around line 131-135):

```tsx
        {!readOnly && (
          <button
            onClick={() => removeField(field.id)}
            className="ml-2 p-1 text-gray-300 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
          >
            <Trash2 size={14} />
          </button>
        )}
```

Pass `readOnly` to `InlineFieldRow`:

```tsx
<InlineFieldRow key={field.id} field={field} removeField={removeField} updateField={updateField} readOnly={readOnly} />
```

Update `InlineFieldRow` signature:

```typescript
function InlineFieldRow({ field, removeField, updateField, readOnly }: { field: Field; removeField: (id: string) => void; updateField: (id: string, data: Partial<Field>) => void; readOnly?: boolean }) {
```

- [ ] **Step 3: Add readOnly to CanvasMode**

In `src/components/editor/CanvasMode.tsx`, change the function signature from:

```typescript
export function CanvasMode() {
```

to:

```typescript
interface CanvasModeProps {
  readOnly?: boolean
}

export function CanvasMode({ readOnly }: CanvasModeProps) {
```

Then hide the "+ Campo" button when readOnly. Replace the add button section (around line 204-212):

```tsx
      {!readOnly && (
        <div className="absolute bottom-4 left-4 z-10">
          <button
            onClick={() => setShowAddMenu(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 text-sm"
          >
            + Campo
          </button>
        </div>
      )}
```

Disable mouseDown on field cards when readOnly. Replace the outer field div's `onMouseDown` (around line 136):

```tsx
                onMouseDown={readOnly ? undefined : (e) => handleMouseDown(e, field.id, 'move')}
```

And the resize handle (around line 150):

```tsx
                {!readOnly && (
                  <div
                    className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
                    onMouseDown={(e) => handleMouseDown(e, field.id, 'resize')}
                  >
                    <svg className="absolute bottom-1 right-1 text-gray-300" width="8" height="8" viewBox="0 0 8 8">
                      <line x1="6" y1="2" x2="2" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                      <line x1="6" y1="5" x2="5" y2="6" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  </div>
                )}
```

Hide actions for readOnly:

```tsx
                {isSelected && !readOnly && (
```

- [ ] **Step 4: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/ListMode.tsx src/components/editor/InlineMode.tsx src/components/editor/CanvasMode.tsx
git commit -m "feat: add readOnly prop to editor modes for collaborator permissions"
```

- [ ] **Step 2: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/ListMode.tsx src/components/editor/InlineMode.tsx src/components/editor/CanvasMode.tsx
git commit -m "feat: add readOnly prop to editor modes for collaborator permissions"
```

---

### Task 13: Update FormEditorClient and page to pass collabRole

**Files:**
- Modify: `src/app/dashboard/forms/[id]/FormEditorClient.tsx`
- Modify: `src/app/dashboard/forms/[id]/page.tsx`

- [ ] **Step 1: Update page.tsx to read collab headers and allow collaborator access**

Replace the entire content of `src/app/dashboard/forms/[id]/page.tsx`:

```typescript
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FormEditorClient } from './FormEditorClient'
import { CollabRole } from '@/types'

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === 'new') {
    return <FormEditorClient formId="new" initialData={null} collabRole={null} />
  }

  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const collabRole = headersList.get('x-collab-role') as CollabRole | null
  const collabFormId = headersList.get('x-collab-form-id')

  const supabase = await createClient()

  // Owner access
  if (userId) {
    const { data: form } = await supabase
      .from('forms')
      .select('*, fields(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (form) {
      return <FormEditorClient formId={id} initialData={form} collabRole={null} />
    }
  }

  // Collaborator access
  if (collabRole && collabFormId === id) {
    const { data: form } = await supabase
      .from('forms')
      .select('*, fields(*)')
      .eq('id', id)
      .single()

    if (form) {
      return <FormEditorClient formId={id} initialData={form} collabRole={collabRole} />
    }
  }

  redirect('/dashboard/forms')
}
```

- [ ] **Step 2: Update FormEditorClient to pass collabRole**

Replace the entire content of `src/app/dashboard/forms/[id]/FormEditorClient.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { FormEditor } from '@/components/editor/FormEditor'
import { FormWithFields, CollabRole } from '@/types'

interface FormEditorClientProps {
  formId: string
  initialData: FormWithFields | null
  collabRole: CollabRole | null
}

export function FormEditorClient({ formId, initialData, collabRole }: FormEditorClientProps) {
  const { loadForm, resetStore } = useFormEditorStore()

  useEffect(() => {
    if (initialData) {
      loadForm(initialData, initialData.fields || [])
    } else {
      resetStore()
    }
  }, [initialData, loadForm, resetStore])

  return <FormEditor formId={formId} collabRole={collabRole} />
}
```

- [ ] **Step 3: Verify build**

Run: `cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/forms/[id]/page.tsx src/app/dashboard/forms/[id]/FormEditorClient.tsx
git commit -m "feat: pass collaborator role through page to FormEditor"
```

---

### Task 14: Add COLLAB_SECRET to env

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add COLLAB_SECRET to .env.local**

Append to `.env.local`:

```
COLLAB_SECRET=change-this-to-a-random-string-in-production
```

- [ ] **Step 2: Commit**

```bash
git add .env.local
git commit -m "chore: add COLLAB_SECRET env variable"
```

---

### Task 15: Final build verification

- [ ] **Step 1: Run full build**

```bash
cd "c:/Users/Brito/Desktop/principal/Projetos/formulário Hurtz" && npx next build
```

Expected: Build succeeds with no errors. New routes visible:
- `ƒ /api/collab/login`
- `ƒ /api/forms/[id]/collaborators`
- `ƒ /api/forms/[id]/collaborators/[cid]`
- `ƒ /f/[slug]/collab`

- [ ] **Step 2: Manual smoke test**

1. Run `npm run dev`
2. Open a form editor, verify "Compartilhar" tab appears
3. Add a collaborator via the sharing tab
4. Copy the share link, open in incognito
5. Login with the collaborator credentials
6. Verify the editor shows with correct permissions (no publish/share/IA buttons for non-owners)
