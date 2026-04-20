import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CollabLoginClient } from './CollabLoginClient'

export default async function CollabLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: form } = await supabase
    .from('forms')
    .select('id, titulo')
    .eq('slug', slug)
    .single()

  if (!form) notFound()

  const { count } = await supabase
    .from('form_collaborators')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', form.id)

  if (!count || count === 0) {
    redirect(`/f/${slug}`)
  }

  return <CollabLoginClient slug={slug} titulo={form.titulo} />
}