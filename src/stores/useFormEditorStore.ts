import { create } from 'zustand'
import { Field, Form, FieldType } from '@/types'
import { nanoid } from 'nanoid'
import { parseOpcoes, parseCanvasMeta } from '@/lib/utils'

interface FormEditorState {
  form: {
    id: string
    titulo: string
    descricao: string
    slug: string
    configuracoes: Record<string, unknown>
    publicado: boolean
  }
  fields: Field[]
  selectedFieldId: string | null
  editMode: 'list' | 'inline' | 'canvas'
  isDirty: boolean
  isSaving: boolean

  addField: (tipo: FieldType) => void
  updateField: (id: string, dados: Partial<Field>) => void
  removeField: (id: string) => void
  reorderFields: (fromIndex: number, toIndex: number) => void
  duplicateField: (id: string) => void
  selectField: (id: string | null) => void
  setEditMode: (mode: 'list' | 'inline' | 'canvas') => void
  updateForm: (dados: Partial<FormEditorState['form']>) => void
  loadForm: (form: Form, fields: Field[]) => void
  resetStore: () => void
}

const initialState = {
  form: {
    id: '',
    titulo: '',
    descricao: '',
    slug: '',
    configuracoes: {},
    publicado: false,
  },
  fields: [],
  selectedFieldId: null,
  editMode: 'list' as const,
  isDirty: false,
  isSaving: false,
}

export const useFormEditorStore = create<FormEditorState>((set, get) => ({
  ...initialState,

  addField: (tipo: FieldType) => {
    const fields = get().fields
    const newField: Field = {
      id: nanoid(),
      form_id: '',
      tipo,
      label: getFieldTypeLabel(tipo),
      placeholder: null,
      obrigatorio: false,
      opcoes: needsOptions(tipo) ? ['Opção 1', 'Opção 2'] : null,
      ordem: fields.length + 1,
      logica: null,
      canvas_meta: null,
      created_at: new Date().toISOString(),
    }
    set({ fields: [...fields, newField], selectedFieldId: newField.id, isDirty: true })
  },

  updateField: (id: string, dados: Partial<Field>) => {
    set({
      fields: get().fields.map(f => (f.id === id ? { ...f, ...dados } : f)),
      isDirty: true,
    })
  },

  removeField: (id: string) => {
    const fields = get().fields.filter(f => f.id !== id)
    const reordered = fields.map((f, i) => ({ ...f, ordem: i + 1 }))
    set({
      fields: reordered,
      selectedFieldId: get().selectedFieldId === id ? null : get().selectedFieldId,
      isDirty: true,
    })
  },

  reorderFields: (fromIndex: number, toIndex: number) => {
    const fields = [...get().fields]
    const [moved] = fields.splice(fromIndex, 1)
    fields.splice(toIndex, 0, moved)
    const reordered = fields.map((f, i) => ({ ...f, ordem: i + 1 }))
    set({ fields: reordered, isDirty: true })
  },

  duplicateField: (id: string) => {
    const fields = get().fields
    const field = fields.find(f => f.id === id)
    if (!field) return
    const index = fields.indexOf(field)
    const newField: Field = {
      ...field,
      id: nanoid(),
      label: `${field.label} (cópia)`,
      ordem: index + 2,
    }
    const newFields = [...fields]
    newFields.splice(index + 1, 0, newField)
    const reordered = newFields.map((f, i) => ({ ...f, ordem: i + 1 }))
    set({ fields: reordered, selectedFieldId: newField.id, isDirty: true })
  },

  selectField: (id: string | null) => set({ selectedFieldId: id }),

  setEditMode: (mode: 'list' | 'inline' | 'canvas') => set({ editMode: mode }),

  updateForm: (dados) => set({ form: { ...get().form, ...dados }, isDirty: true }),

  loadForm: (form: Form, fields: Field[]) => {
    const safeFields = fields.sort((a, b) => a.ordem - b.ordem).map(f => ({
      ...f,
      opcoes: parseOpcoes(f.opcoes),
      canvas_meta: parseCanvasMeta(f.canvas_meta),
    }))
    set({
      form: {
        id: form.id,
        titulo: form.titulo,
        descricao: form.descricao || '',
        slug: form.slug,
        configuracoes: form.configuracoes || {},
        publicado: form.publicado,
      },
      fields: safeFields,
      selectedFieldId: null,
      isDirty: false,
    })
  },

  resetStore: () => set(initialState),
}))

function getFieldTypeLabel(tipo: FieldType): string {
  const labels: Record<FieldType, string> = {
    text: 'Texto curto',
    email: 'Email',
    phone: 'Telefone',
    select: 'Seleção',
    checkbox: 'Múltipla escolha (checkbox)',
    radio: 'Escolha única (radio)',
    date: 'Data',
    file: 'Upload de arquivo',
    textarea: 'Texto longo',
    number: 'Número',
  }
  return labels[tipo]
}

function needsOptions(tipo: FieldType): boolean {
  return tipo === 'select' || tipo === 'checkbox' || tipo === 'radio'
}
