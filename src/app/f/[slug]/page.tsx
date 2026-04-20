import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PublicFormClient } from './PublicFormClient'

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: form } = await supabase
    .from('forms')
    .select('*, fields(*)')
    .eq('slug', slug)
    .eq('publicado', true)
    .single()

  if (!form) notFound()

  return <PublicFormClient form={form} />
}
