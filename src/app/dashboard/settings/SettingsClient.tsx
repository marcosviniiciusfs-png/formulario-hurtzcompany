'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Loader2, Save, Upload, KeyRound } from 'lucide-react'

interface SettingsClientProps {
  profile: Profile | null
  email: string
}

export function SettingsClient({ profile, email }: SettingsClientProps) {
  const [nome, setNome] = useState(profile?.nome || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [savingSenha, setSavingSenha] = useState(false)
  const [senhaMsg, setSenhaMsg] = useState('')

  const [logoUrl, setLogoUrl] = useState(profile?.logo_url || '')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ nome, logo_url: logoUrl || null })
      .eq('id', profile?.id || '')

    if (error) {
      setMessage('Erro ao salvar')
    } else {
      setMessage('Salvo com sucesso!')
    }
    setSaving(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) return

    setUploadingLogo(true)
    const reader = new FileReader()
    reader.onload = () => {
      setLogoUrl(reader.result as string)
      setUploadingLogo(false)
    }
    reader.readAsDataURL(file)
  }

  const handlePasswordChange = async () => {
    if (!novaSenha || novaSenha.length < 6) {
      setSenhaMsg('A nova senha deve ter no mínimo 6 caracteres')
      return
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaMsg('As senhas não coincidem')
      return
    }

    setSavingSenha(true)
    setSenhaMsg('')
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({ password: novaSenha })

    if (error) {
      setSenhaMsg(error.message || 'Erro ao redefinir senha')
    } else {
      setSenhaMsg('Senha alterada com sucesso!')
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmarSenha('')
    }
    setSavingSenha(false)
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configurações</h1>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-900">Perfil</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo da empresa</label>
          {logoUrl ? (
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
              <button onClick={() => setLogoUrl('')} className="text-xs text-red-500 hover:text-red-700">Remover</button>
            </div>
          ) : (
            <button onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50">
              {uploadingLogo ? 'Enviando...' : 'Clique para enviar sua logo (PNG, JPG, máx. 2MB)'}
            </button>
          )}
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          {logoUrl && (
            <button onClick={() => logoInputRef.current?.click()} className="mt-2 text-xs text-gray-500 hover:text-gray-700">Trocar imagem</button>
          )}
        </div>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </button>
        {message && <p className={`text-sm ${message.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <KeyRound size={16} /> Segurança
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
          <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
          <input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <button onClick={handlePasswordChange} disabled={savingSenha || !novaSenha}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
          {savingSenha ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          Redefinir senha
        </button>
        {senhaMsg && <p className={`text-sm ${senhaMsg.includes('sucesso') ? 'text-green-600' : 'text-red-600'}`}>{senhaMsg}</p>}
      </div>
    </div>
  )
}
