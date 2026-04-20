import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formId = request.nextUrl.searchParams.get('form_id')

  if (!formId) {
    return NextResponse.json({ error: 'form_id is required' }, { status: 400 })
  }

  // Verify ownership
  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('id', formId)
    .eq('user_id', user.id)
    .single()

  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json()
  const { form_id, respostas } = body

  if (!form_id || !respostas) {
    return NextResponse.json({ error: 'form_id and respostas are required' }, { status: 400 })
  }

  // Verify form is published
  const { data: form } = await supabase
    .from('forms')
    .select('id, publicado')
    .eq('id', form_id)
    .single()

  if (!form || !form.publicado) {
    return NextResponse.json({ error: 'Form not found or not published' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('responses')
    .insert({
      form_id,
      respostas,
      metadata: {
        user_agent: request.headers.get('user-agent'),
        submitted_at: new Date().toISOString(),
      },
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
