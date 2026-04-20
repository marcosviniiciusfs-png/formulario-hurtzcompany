import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResponsesClient } from './ResponsesClient'

export default async function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const headersList = await headers()
  const userId = headersList.get('x-user-id')!

  const supabase = await createClient()

  const { data: form } = await supabase
    .from('forms')
    .select('*, fields(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (!form) redirect('/dashboard/forms')

  const { data: responses } = await supabase
    .from('responses')
    .select('*')
    .eq('form_id', id)
    .order('created_at', { ascending: false })

  return <ResponsesClient form={form} responses={responses || []} />
}
