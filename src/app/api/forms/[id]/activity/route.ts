import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: activities } = await supabase
    .from('form_activity_log')
    .select('id, action, details, created_at, user_id, collaborator_id')
    .eq('form_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  const enriched = (activities || []).map(a => ({
    ...a,
    user_nome: null as string | null,
    user_avatar: null as string | null,
  }))

  const userIds = [...new Set(activities?.map(a => a.user_id).filter(Boolean) as string[])]
  const collabIds = [...new Set(activities?.map(a => a.collaborator_id).filter(Boolean) as string[])]

  const userMap: Record<string, { nome: string; avatar_url: string | null }> = {}
  const collabMap: Record<string, { nome: string; avatar_url: string | null }> = {}

  if (userIds.length > 0) {
    const { data: users } = await supabase.from('profiles').select('id, nome, avatar_url').in('id', userIds)
    users?.forEach(u => { userMap[u.id] = { nome: u.nome, avatar_url: u.avatar_url } })
  }

  if (collabIds.length > 0) {
    const { data: collabs } = await supabase.from('form_collaborators').select('id, nome, avatar_url').in('id', collabIds)
    collabs?.forEach(c => { collabMap[c.id] = { nome: c.nome, avatar_url: c.avatar_url } })
  }

  const result = enriched.map(a => {
    if (a.user_id && userMap[a.user_id]) {
      a.user_nome = userMap[a.user_id].nome
      a.user_avatar = userMap[a.user_id].avatar_url
    }
    if (a.collaborator_id && collabMap[a.collaborator_id]) {
      a.user_nome = collabMap[a.collaborator_id].nome
      a.user_avatar = collabMap[a.collaborator_id].avatar_url
    }
    return a
  })

  return NextResponse.json(result)
}
