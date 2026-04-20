import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FormEditorClient } from './FormEditorClient'
import { CollabRole } from '@/types'

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id === 'new') {
    return <FormEditorClient formId="new" initialData={null} collabRole={null} />
  }

  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const collabRole = headersList.get('x-collab-role') as CollabRole | null
  const collabFormId = headersList.get('x-collab-form-id')

  const supabase = await createClient()

  // Owner access
  if (userId) {
    const { data: form } = await supabase
      .from('forms')
      .select('*, fields(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (form) {
      return <FormEditorClient formId={id} initialData={form} collabRole={null} />
    }
  }

  // Collaborator access
  if (collabRole && collabFormId === id) {
    const { data: form } = await supabase
      .from('forms')
      .select('*, fields(*)')
      .eq('id', id)
      .single()

    if (form) {
      return <FormEditorClient formId={id} initialData={form} collabRole={collabRole} />
    }
  }

  redirect('/dashboard/forms')
}
