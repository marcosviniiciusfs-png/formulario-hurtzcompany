import { openai, AI_MODEL } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { titulo, descricao, fields } = await request.json()

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em UX de formulários. Melhore o formulário fornecido: melhore labels, ajuste a ordem, adicione placeholders úteis, e corrija tipos de campos se necessário. Retorne o formulário completo melhorado no formato:
{
  "titulo": "...",
  "descricao": "...",
  "fields": [
    { "tipo": "...", "label": "...", "obrigatorio": true, "ordem": 1, "placeholder": "...", "opcoes": [] }
  ]
}
Responda APENAS com JSON.`,
        },
        {
          role: 'user',
          content: JSON.stringify({ titulo, descricao, fields }),
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    return NextResponse.json(JSON.parse(content))
  } catch {
    return NextResponse.json({ error: 'Failed to improve form' }, { status: 500 })
  }
}
