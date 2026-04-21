import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Apenas imagens são permitidas' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Imagem deve ter no máximo 5MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'png'
  const path = `${user.id}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('form-banners')
    .upload(path, file, { contentType: file.type, upsert: true })

  if (error) {
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('form-banners')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
