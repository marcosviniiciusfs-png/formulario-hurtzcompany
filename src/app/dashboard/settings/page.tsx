import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')!
  const email = headersList.get('x-user-email') || ''

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return <SettingsClient profile={profile} email={email} />
}
