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