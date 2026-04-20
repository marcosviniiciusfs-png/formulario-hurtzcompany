# Formulário HurtzCompany - Design Spec

## Visão Geral

Aplicação SaaS de criação de formulários com inteligência artificial, semelhante ao Google Forms, Tally e Typeform. O usuário descreve o que deseja e a IA gera o formulário automaticamente. Inclui 3 modos de edição (lista, inline, canvas), formulário público compartilhável e dashboard com analytics.

**Repo:** `https://github.com/marcosviniiciusfs-png/formulario-hurtzcompany.git`

## Decisões do Projeto

| Decisão | Escolha |
|---------|---------|
| Escopo MVP | Core + IA (auth, editor, IA, form público, dashboard) |
| Provedor IA | OpenAI (GPT-4o-mini) |
| Modos do Editor | Lista + Inline + Canvas (todos no MVP) |
| Arquitetura Editor | Modular (Zustand store compartilhado) |
| Monetização | Gratuito total |
| Deploy | Vercel |
| Frontend | Next.js App Router, React, Tailwind CSS |
| Backend | API Routes Next.js |
| Banco | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Estado Editor | Zustand |

## Arquitetura

```
Vercel (Next.js App Router)
├── Landing Page (/)
├── Dashboard (/dashboard/*)
│   ├── Visão geral
│   ├── Lista de formulários
│   ├── Editor (/dashboard/forms/[id])
│   ├── Respostas (/dashboard/forms/[id]/responses)
│   ├── Templates
│   └── Settings
├── Formulário Público (/f/[slug])
│
├── API Routes
│   ├── /api/forms          (CRUD formulários)
│   ├── /api/fields         (CRUD campos)
│   ├── /api/responses      (CRUD respostas)
│   └── /api/ai/*           (generate, suggest, improve)
│
└── Supabase
    ├── Auth (email/senha + OAuth)
    └── PostgreSQL (RLS habilitado)
```

### Padrões

- **Server Components** por padrão (SEO, performance)
- **Client Components** apenas onde há interatividade (editor, formulário público)
- `createServerComponentClient` para dados no servidor
- `createBrowserClient` para interatividade no client
- OpenAI API chamada apenas via API Routes (proteger chave)
- RLS em todas as tabelas (usuário só acessa seus dados)

## Schema do Banco de Dados

### profiles
| Coluna | Tipo | Restrições |
|--------|------|------------|
| id | UUID | PK, refs auth.users.id |
| nome | TEXT | NOT NULL |
| email | TEXT | NOT NULL |
| avatar_url | TEXT | nullable |
| created_at | TIMESTAMPTZ | default now() |

### forms
| Coluna | Tipo | Restrições |
|--------|------|------------|
| id | UUID | PK, default gen_random_uuid() |
| titulo | TEXT | NOT NULL |
| descricao | TEXT | nullable |
| slug | TEXT | UNIQUE, NOT NULL |
| user_id | UUID | FK → profiles, NOT NULL |
| publicado | BOOLEAN | default false |
| configuracoes | JSONB | default '{}' |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | default now() |

### fields
| Coluna | Tipo | Restrições |
|--------|------|------------|
| id | UUID | PK, default gen_random_uuid() |
| form_id | UUID | FK → forms ON DELETE CASCADE, NOT NULL |
| tipo | TEXT | NOT NULL (text, email, phone, select, checkbox, radio, date, file, textarea, number) |
| label | TEXT | NOT NULL |
| placeholder | TEXT | nullable |
| obrigatorio | BOOLEAN | default false |
| opcoes | JSONB | nullable (para select/checkbox/radio) |
| ordem | INTEGER | NOT NULL |
| logica | JSONB | nullable (preparado para lógica condicional futura) |
| canvas_meta | JSONB | nullable ({ x, y, w, h } para modo canvas) |
| created_at | TIMESTAMPTZ | default now() |

### responses
| Coluna | Tipo | Restrições |
|--------|------|------------|
| id | UUID | PK, default gen_random_uuid() |
| form_id | UUID | FK → forms ON DELETE CASCADE, NOT NULL |
| respostas | JSONB | NOT NULL |
| metadata | JSONB | nullable (IP, user-agent, tempo) |
| created_at | TIMESTAMPTZ | default now() |

### form_views
| Coluna | Tipo | Restrições |
|--------|------|------------|
| id | UUID | PK |
| form_id | UUID | FK → forms ON DELETE CASCADE |
| created_at | TIMESTAMPTZ | default now() |

Tabela para tracking de views e cálculo de taxa de conversão (views vs responses).

## Editor de Formulários

### Zustand Store

```typescript
interface FormEditorState {
  form: {
    titulo: string
    descricao: string
    slug: string
    configuracoes: Record<string, unknown>
  }
  fields: Field[]
  selectedFieldId: string | null
  editMode: 'list' | 'inline' | 'canvas'
  isDirty: boolean

  addField(tipo: FieldType): void
  updateField(id: string, dados: Partial<Field>): void
  removeField(id: string): void
  reorderFields(fromIndex: number, toIndex: number): void
  selectField(id: string | null): void
  setEditMode(mode: 'list' | 'inline' | 'canvas'): void
  loadForm(form: Form, fields: Field[]): void
  saveForm(): Promise<void>
}
```

### Modo 1: Lista Editável

- Lista vertical de campos como cards expansíveis
- Botão "+" com dropdown de tipos de campo
- Drag handles para reordenar
- Click no card expande para edição completa (label, placeholder, opções, obrigatório)
- Toolbar lateral com propriedades do campo selecionado

### Modo 2: Inline Notion-like

- Preview em tempo real do formulário
- Click direto no label para editar (contentEditable)
- Slash commands (/) para adicionar novos campos
- Hover revela controles (mover, deletar, duplicar)
- O formulário aparece exatamente como o respondente verá

### Modo 3: Canvas Livre

- Grid background com snap-to-grid
- Campos como blocos posicionáveis (x, y, width, height)
- Redimensionar via drag nos cantos
- Zoom in/out
- Minimapa no canto
- Dados de posição armazenados em `canvas_meta` (JSONB)

### Troca entre Modos

- Seletor no header com 3 ícones
- Troca instantânea via Zustand
- Dados de posição do canvas são preservados ao trocar e restaurados ao voltar

## Integração com IA (OpenAI)

### Endpoints

| Endpoint | Função |
|----------|--------|
| `POST /api/ai/generate` | Gera formulário completo a partir de descrição |
| `POST /api/ai/suggest` | Sugere campos adicionais para formulário existente |
| `POST /api/ai/improve` | Melhora labels, ordem e validações |
| `POST /api/ai/templates` | Gera templates por categoria |

### Fluxo de Geração

1. Usuário digita descrição (ex: "Criar formulário para captar leads imobiliários")
2. `POST /api/ai/generate` com `{ prompt: string }`
3. Prompt estruturado para OpenAI retorna JSON:
   ```json
   {
     "titulo": "Captura de Leads Imobiliários",
     "descricao": "...",
     "fields": [
       { "tipo": "text", "label": "Nome", "obrigatorio": true, "ordem": 1 },
       { "tipo": "phone", "label": "Telefone", "obrigatorio": true, "ordem": 2 }
     ]
   }
   ```
4. JSON carregado no Zustand store → formulário aparece no editor
5. Usuário edita livremente e salva

### Configuração

- Modelo: GPT-4o-mini (custo-benefício)
- Structured outputs: `response_format: { type: "json_object" }`
- Chave em variável de ambiente: `OPENAI_API_KEY`

## Formulário Público

### Rota: `/f/[slug]`

- Server Component busca dados do formulário no servidor
- Renderiza campos dinamicamente por tipo
- Validação client-side antes do submit
- `POST /api/responses` salva resposta
- Tela de agradecimento configurável
- Suporte a tema/cor via `configuracoes`
- Responsivo (mobile-first)
- Tracking de view ao carregar a página

## Dashboard

### Páginas

| Rota | Função |
|------|--------|
| `/dashboard` | Visão geral com métricas (total forms, respostas, taxa conversão) |
| `/dashboard/forms` | Lista de formulários com ações (editar, duplicar, deletar, copiar link) |
| `/dashboard/forms/[id]` | Editor do formulário (3 modos) |
| `/dashboard/forms/[id]/responses` | Tabela de respostas + exportar CSV |
| `/dashboard/templates` | Templates prontos por categoria |
| `/dashboard/settings` | Configurações do perfil |

### Funcionalidades

- Cards de métricas na visão geral
- Lista de formulários com contagem de respostas
- Exportar respostas em CSV
- Copiar link público com um clique
- Duplicar formulário
- Deletar com confirmação (soft delete ou hard delete)

## Estrutura de Pastas

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   ├── dashboard/
│   │   ├── layout.tsx              # Sidebar + auth guard
│   │   ├── page.tsx                # Visão geral
│   │   ├── forms/
│   │   │   ├── page.tsx            # Lista de formulários
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Editor
│   │   │       └── responses/
│   │   │           └── page.tsx    # Respostas
│   │   ├── templates/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── f/
│   │   └── [slug]/
│   │       └── page.tsx            # Formulário público
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── api/
│       ├── forms/
│       │   └── route.ts
│       ├── fields/
│       │   └── route.ts
│       ├── responses/
│       │   └── route.ts
│       └── ai/
│           ├── generate/route.ts
│           ├── suggest/route.ts
│           ├── improve/route.ts
│           └── templates/route.ts
├── components/
│   ├── ui/                         # Componentes base (Button, Input, Card, etc.)
│   ├── editor/
│   │   ├── FormEditor.tsx          # Container principal
│   │   ├── ListMode.tsx
│   │   ├── InlineMode.tsx
│   │   ├── CanvasMode.tsx
│   │   ├── FieldCard.tsx
│   │   ├── FieldTypeSelector.tsx
│   │   └── FieldProperties.tsx
│   ├── form/
│   │   ├── PublicForm.tsx
│   │   ├── FormField.tsx           # Renderiza campo por tipo
│   │   └── ThankYou.tsx
│   └── dashboard/
│       ├── Sidebar.tsx
│       ├── MetricCard.tsx
│       ├── FormList.tsx
│       └── ResponseTable.tsx
├── stores/
│   └── useFormEditorStore.ts
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   └── client.ts
│   ├── openai.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql
```

## Funcionalidades Futuras (Fase 2+)

- Drag-and-drop nativo no modo lista
- Lógica condicional completa
- Formulários multi-etapas
- Integração Google Sheets
- Webhooks
- Integração WhatsApp
- Upload de arquivos
- Planos pagos (freemium)
- Notificações por email
