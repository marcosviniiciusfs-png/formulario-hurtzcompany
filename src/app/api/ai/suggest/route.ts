import { openai, AI_MODEL } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { form_title, form_description, existing_fields } = await request.json()

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `Você é um assistente de formulários. Dado um formulário existente, sugira 3-5 campos adicionais que poderiam melhorá-lo. Retorne um JSON com a estrutura:
{
  "suggestions": [
    { "tipo": "text", "label": "...", "obrigatorio": true, "ordem": 1, "placeholder": "..." }
  ]
}
Responda APENAS com JSON.`,
        },
        {
          role: 'user',
          content: `Formulário: "${form_title}"\nDescrição: "${form_description}"\nCampos existentes: ${JSON.stringify(existing_fields)}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    return NextResponse.json(JSON.parse(content))
  } catch {
    return NextResponse.json({ error: 'Failed to get suggestions' }, { status: 500 })
  }
}
