export type FieldType = 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'radio' | 'date' | 'file' | 'textarea' | 'number'

export interface Field {
  id: string
  form_id: string
  tipo: FieldType
  label: string
  placeholder: string | null
  obrigatorio: boolean
  opcoes: string[] | null
  ordem: number
  logica: Record<string, unknown> | null
  canvas_meta: { x: number; y: number; w: number; h: number } | null
  created_at: string
}

export interface Form {
  id: string
  titulo: string
  descricao: string | null
  slug: string
  user_id: string
  publicado: boolean
  configuracoes: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Response {
  id: string
  form_id: string
  respostas: Record<string, string | string[]>
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface FormView {
  id: string
  form_id: string
  created_at: string
}

export interface Profile {
  id: string
  nome: string
  email: string
  avatar_url: string | null
  logo_url: string | null
  created_at: string
}

export interface FormWithFields extends Form {
  fields: Field[]
}

export interface FormWithStats extends Form {
  response_count: number
  view_count: number
}

export interface AIGenerateRequest {
  prompt: string
}

export interface AIGenerateResponse {
  titulo: string
  descricao: string
  fields: Array<{
    tipo: FieldType
    label: string
    obrigatorio: boolean
    ordem: number
    opcoes?: string[]
    placeholder?: string
  }>
}

export type CollabRole = 'editor' | 'viewer' | 'readonly'

export interface Collaborator {
  id: string
  form_id: string
  email: string
  nome: string
  role: CollabRole
  expires_at: string | null
  created_at: string
}
