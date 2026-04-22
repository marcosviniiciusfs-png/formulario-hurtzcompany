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

  // Activity log
  const prevPublicado = body._prev_publicado
  if (prevPublicado !== undefined && prevPublicado !== body.publicado) {
    await supabase.from('form_activity_log').insert({
      form_id: id, user_id: user.id,
      action: body.publicado ? 'form_published' : 'form_unpublished',
      details: { titulo: body.titulo },
    })
  } else {
    await supabase.from('form_activity_log').insert({
      form_id: id, user_id: user.id,
      action: 'form_updated',
      details: { titulo: body.titulo },
    })
  }

  // Log field changes
  if (body.fields) {
    const { data: oldFields } = await supabase.from('fields').select('label').eq('form_id', id)
    const oldLabels = new Set((oldFields || []).map(f => f.label))
    for (const f of body.fields as Record<string, unknown>[]) {
      if (!oldLabels.has(f.label as string)) {
        await supabase.from('form_activity_log').insert({
          form_id: id, user_id: user.id,
          action: 'field_added',
          details: { label: f.label, tipo: f.tipo },
        })
      }
    }
  }

  // Log design changes
  if (body.configuracoes && Object.keys(body.configuracoes as Record<string, unknown>).length > 0) {
    await supabase.from('form_activity_log').insert({
      form_id: id, user_id: user.id,
      action: 'design_updated',
      details: { configuracoes: true },
    })
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
