import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

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

  const { data: original } = await supabase
    .from('forms')
    .select('*, fields(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!original) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  const newSlug = `${original.slug.split('-').slice(0, -1).join('-')}-${nanoid(6)}`

  const { data: newForm, error: formError } = await supabase
    .from('forms')
    .insert({
      titulo: `${original.titulo} (cópia)`,
      descricao: original.descricao,
      slug: newSlug,
      user_id: user.id,
      publicado: false,
      configuracoes: original.configuracoes,
    })
    .select()
    .single()

  if (formError) {
    return NextResponse.json({ error: formError.message }, { status: 500 })
  }

  if (original.fields && original.fields.length > 0) {
    const fieldsToInsert = original.fields.map((f: Record<string, unknown>, index: number) => ({
      form_id: newForm.id,
      tipo: f.tipo,
      label: f.label,
      placeholder: f.placeholder,
      obrigatorio: f.obrigatorio,
      opcoes: f.opcoes,
      ordem: f.ordem || index + 1,
      canvas_meta: f.canvas_meta,
    }))

    await supabase.from('fields').insert(fieldsToInsert)
  }

  const { data: fullForm } = await supabase
    .from('forms')
    .select('*, fields(*)')
    .eq('id', newForm.id)
    .single()

  return NextResponse.json(fullForm, { status: 201 })
}
