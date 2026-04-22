'use client'

import { useEffect } from 'react'
import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { FormEditor } from '@/components/editor/FormEditor'
import { FormWithFields, CollabRole } from '@/types'

interface FormEditorClientProps {
  formId: string
  initialData: FormWithFields | null
  collabRole: CollabRole | null
}

export function FormEditorClient({ formId, initialData, collabRole }: FormEditorClientProps) {
  const { loadForm, resetStore, form } = useFormEditorStore()

  useEffect(() => {
    if (initialData) {
      if (!form || form.id !== initialData.id) {
        loadForm(initialData, initialData.fields || [])
      }
    } else if (formId === 'new') {
      resetStore()
    }
  }, [initialData, formId, loadForm, resetStore, form])

  return <FormEditor formId={formId} collabRole={collabRole} />
}
