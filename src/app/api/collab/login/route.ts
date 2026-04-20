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

  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  const { data: collab } = await supabase
    .from('form_collaborators')
    .select('id, email, senha_hash, role, expires_at')
    .eq('form_id', form.id)
    .eq('email', email.toLowerCase().trim())
    .single()

  if (!collab) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  if (collab.expires_at && new Date(collab.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Acesso expirado' }, { status: 403 })
  }

  const valid = await bcrypt.compare(senha, collab.senha_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

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
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return response
}