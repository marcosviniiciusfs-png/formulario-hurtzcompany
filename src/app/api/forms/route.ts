import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('forms')
    .select('*, fields(*)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get response counts
  const formIds = data.map(f => f.id)
  const { data: responseCounts } = await supabase
    .from('responses')
    .select('form_id')
    .in('form_id', formIds)

  const { data: viewCounts } = await supabase
    .from('form_views')
    .select('form_id')
    .in('form_id', formIds)

  const responseMap = new Map<string, number>()
  responseCounts?.forEach(r => {
    responseMap.set(r.form_id, (responseMap.get(r.form_id) || 0) + 1)
  })

  const viewMap = new Map<string, number>()
  viewCounts?.forEach(v => {
    viewMap.set(v.form_id, (viewMap.get(v.form_id) || 0) + 1)
  })

  const formsWithStats = data.map(form => ({
    ...form,
    response_count: responseMap.get(form.id) || 0,
    view_count: viewMap.get(form.id) || 0,
  }))

  return NextResponse.json(formsWithStats)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { titulo, descricao, fields, publicado } = body

  const slug = body.slug || `${titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${nanoid(6)}`

  const { data: form, error: formError } = await supabase
    .from('forms')
    .insert({
      titulo,
      descricao: descricao || null,
      slug,
      user_id: user.id,
      publicado: publicado || false,
      configuracoes: body.configuracoes || {},
    })
    .select()
    .single()

  if (formError) {
    return NextResponse.json({ error: formError.message }, { status: 500 })
  }

  if (fields && fields.length > 0) {
    const fieldsToInsert = fields.map((f: Record<string, unknown>, index: number) => ({
      form_id: form.id,
      tipo: f.tipo,
      label: f.label,
      placeholder: f.placeholder || null,
      obrigatorio: f.obrigatorio || false,
      opcoes: f.opcoes || null,
      ordem: f.ordem || index + 1,
    }))

    const { error: fieldsError } = await supabase
      .from('fields')
      .insert(fieldsToInsert)

    if (fieldsError) {
      return NextResponse.json({ error: fieldsError.message }, { status: 500 })
    }
  }

  // Activity log
  await supabase.from('form_activity_log').insert({
    form_id: form.id,
    user_id: user.id,
    action: 'form_created',
    details: { titulo },
  })
  for (const f of (fields || [])) {
    await supabase.from('form_activity_log').insert({
      form_id: form.id,
      user_id: user.id,
      action: 'field_added',
      details: { label: f.label, tipo: f.tipo },
    })
  }

  const { data: fullForm } = await supabase
    .from('forms')
    .select('*, fields(*)')
    .eq('id', form.id)
    .single()

  return NextResponse.json(fullForm, { status: 201 })
}
