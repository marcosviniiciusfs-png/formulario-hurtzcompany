'use client'

import { useEffect, useRef } from 'react'
import { useFormEditorStore } from '@/stores/useFormEditorStore'
import { FormEditor } from '@/components/editor/FormEditor'
import { FormWithFields, CollabRole } from '@/types'

interface FormEditorClientProps {
  formId: string
  initialData: FormWithFields | null
  collabRole: CollabRole | null
}

export function FormEditorClient({ formId, initialData, collabRole }: FormEditorClientProps) {
  const { loadForm, resetStore } = useFormEditorStore()
  const loadedId = useRef<string | null>(null)

  useEffect(() => {
    if (initialData) {
      if (loadedId.current !== initialData.id) {
        loadForm(initialData, initialData.fields || [])
        loadedId.current = initialData.id
      }
    } else if (formId === 'new') {
      resetStore()
      loadedId.current = null
    }
  }, [initialData, formId, loadForm, resetStore])

  return <FormEditor formId={formId} collabRole={collabRole} />
}
