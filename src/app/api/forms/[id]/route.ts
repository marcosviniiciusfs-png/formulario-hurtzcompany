import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

  const { data, error } = await supabase
    .from('forms')
    .select('*, fields(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const { data: form, error: formError } = await supabase
    .from('forms')
    .update({
      titulo: body.titulo,
      descricao: body.descricao,
      slug: body.slug,
      publicado: body.publicado,
      configuracoes: body.configuracoes,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (formError) {
    return NextResponse.json({ error: formError.message }, { status: 500 })
  }

  // Update fields: delete old, insert new
  if (body.fields) {
    await supabase.from('fields').delete().eq('form_id', id)

    const fieldsToInsert = body.fields.map((f: Record<string, unknown>, index: number) => ({
      form_id: id,
      tipo: f.tipo,
      label: f.label,
      placeholder: f.placeholder || null,
      obrigatorio: f.obrigatorio || false,
      opcoes: f.opcoes || null,
      ordem: f.ordem || index + 1,
      canvas_meta: f.canvas_meta || null,
    }))

    const { error: fieldsError } = await supabase
      .from('fields')
      .insert(fieldsToInsert)

    if (fieldsError) {
      return NextResponse.json({ error: fieldsError.message }, { status: 500 })
    }
  }

  const { data: fullForm } = await supabase
    .from('forms')
    .select('*, fields(*)')
    .eq('id', id)
    .single()

  return NextResponse.json(fullForm)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('forms')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
