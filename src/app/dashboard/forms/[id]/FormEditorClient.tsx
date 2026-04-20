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
  const { loadForm, resetStore } = useFormEditorStore()

  useEffect(() => {
    if (initialData) {
      loadForm(initialData, initialData.fields || [])
    } else {
      resetStore()
    }
  }, [initialData, loadForm, resetStore])

  return <FormEditor formId={formId} collabRole={collabRole} />
}
