'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Loader2, Save } from 'lucide-react'

interface SettingsClientProps {
  profile: Profile | null
  email: string
}

export function SettingsClient({ profile, email }: SettingsClientProps) {
  const [nome, setNome] = useState(profile?.nome || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ nome })
      .eq('id', profile?.id || '')

    if (error) {
      setMessage('Erro ao salvar')
    } else {
      setMessage('Salvo com sucesso!')
    }
    setSaving(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configurações</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </button>

        {message && <p className={`text-sm ${message.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
      </div>
    </div>
  )
}
