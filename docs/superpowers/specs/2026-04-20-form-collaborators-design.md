# Formulário Compartilhado — Design Spec

**Data:** 2026-04-20
**Status:** Aprovado

---

## Objetivo

Permitir que o dono de um formulário compartilhe acesso com outras pessoas sem que elas precisem criar conta no Hurtz Forms. O dono define nome, email e senha para cada convidado, escolhe o nível de permissão e pode revogar ou expirar o acesso a qualquer momento.

---

## Decisões Tomadas

- **Acesso sem conta:** convidados não precisam se cadastrar. Acessam com email + senha definidos pelo dono.
- **3 níveis de permissão:** edição completa (`editor`), ver respostas (`viewer`), somente leitura (`readonly`).
- **Fluxo de convite:** dono copia link manualmente e envia. Convidado abre e faz login.
- **Localização:** nova aba "Compartilhar" no FormEditor, ao lado de Editor e Respostas.
- **Mesmo editor:** convidados usam o mesmo FormEditor, com ações escondidas conforme a role.
- **Revogação e expiração:** dono pode remover acesso a qualquer momento e definir data de expiração opcional.

---

## Banco de Dados

### Nova tabela: `form_collaborators`

```sql
CREATE TABLE form_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  email text NOT NULL,
  senha_hash text NOT NULL,
  nome text NOT NULL,
  role text NOT NULL CHECK (role IN ('editor', 'viewer', 'readonly')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(form_id, email)
);
```

### RLS

```sql
ALTER TABLE form_collaborators ENABLE ROW LEVEL SECURITY;

-- Dono do formulário pode gerenciar colaboradores
CREATE POLICY "Owners can manage collaborators"
  ON form_collaborators
  FOR ALL
  USING (
    form_id IN (SELECT id FROM forms WHERE user_id = auth.uid())
  );
```

### Índices

```sql
CREATE INDEX idx_collaborators_form ON form_collaborators(form_id);
CREATE INDEX idx_collaborators_email ON form_collaborators(form_id, email);
```

---

## API

### Endpoints

| Endpoint | Método | Auth | Descrição |
|----------|--------|------|-----------|
| `/api/forms/[id]/collaborators` | GET | Dono | Lista colaboradores do formulário |
| `/api/forms/[id]/collaborators` | POST | Dono | Adiciona colaborador (hash da senha com bcrypt) |
| `/api/forms/[id]/collaborators/[cid]` | DELETE | Dono | Remove colaborador |
| `/api/collab/login` | POST | Público | Login do colaborador (valida email + senha) |
| `/api/collab/session` | GET | Cookie collab | Verifica sessão ativa |

### Fluxo de login do colaborador

1. Dono copia link `/f/[slug]/collab` e envia manualmente (WhatsApp, email, etc.)
2. Convidado abre o link — tela de login com email e senha
3. `POST /api/collab/login` com `{ email, senha, slug }`
4. Servidor busca slug em `forms`, depois busca em `form_collaborators` pelo form_id + email
5. Verifica senha com bcrypt, verifica se `expires_at` é nulo ou no futuro
6. Se válido: cria cookie `collab_session` com payload `{ collab_id, form_id, role }` assinado com HMAC (chave `COLLAB_SECRET` em env)
7. Redireciona para `/dashboard/forms/[form_id]`

### Sessão do colaborador

- Cookie `collab_session`: HMAC-signed JSON payload, httpOnly, secure, sameSite=lax, expires em 24h
- O payload contém: `{ sub: collab_id, form_id, role, iat, exp }`
- Middleware valida a assinatura e injeta headers `x-collab-role`, `x-collab-form-id`, `x-collab-id`

---

## Middleware

Atualizar `src/middleware.ts` para:

1. Verificar cookie `collab_session` nas rotas `/dashboard/forms/[id]`
2. Se presente: validar assinatura HMAC, verificar expiração, injetar headers
3. Headers injetados:
   - `x-collab-role` → `editor`, `viewer` ou `readonly`
   - `x-collab-form-id` → ID do formulário
   - `x-collab-id` → ID do colaborador
4. Se o cookie é inválido ou expirado: limpar cookie e redirecionar para login

---

## Permissões por Role

| Ação | editor | viewer | readonly |
|------|--------|--------|----------|
| Editar campos (título, label, opções) | sim | não | não |
| Salvar alterações | sim | não | não |
| Ver aba Respostas | sim | sim | não |
| Copiar link público | sim | não | não |
| Publicar / despublicar | não | não | não |
| Abrir aba Compartilhar | não | não | não |
| Usar IA para gerar campos | não | não | não |
| Exportar CSV de respostas | sim | sim | não |

Publicar, compartilhar e IA são exclusivos do dono.

---

## Interface

### Aba "Compartilhar" no FormEditor

Nova aba ao lado de Editor e Respostas. Conteúdo:

1. **Link de compartilhamento:** caixa com URL `/f/[slug]/collab` + botão copiar
2. **Formulário "Adicionar pessoa":** inputs para nome, email, senha, select de role (`editor`, `viewer`, `readonly`), input de data para expiração (opcional), botão "Adicionar"
3. **Lista de colaboradores:** tabela com colunas nome, email, role (badge colorido), expiração, botão revogar

### Tela de login do colaborador (`/f/[slug]/collab`)

Rota client-side. Layout:

- Card centralizado sobre fundo cinza
- Título do formulário no topo (buscado via slug)
- Input email + input senha + botão "Entrar"
- Mensagem de erro inline para credenciais inválias ou acesso expirado
- Se formulário não tem colaboradores: redireciona para página pública `/f/[slug]`

### Editor com permissões

Quando acessado via sessão de colaborador (cookie `collab_session`):

- Header `x-collab-role` é lido pelo `FormEditorClient`
- Role é passada como prop para `FormEditor`
- Botões "Publicar", "IA", "Copiar link" são escondidos para não-donos
- Aba "Compartilhar" aparece só para o dono
- Campos do formulário ficam readonly para roles `viewer` e `readonly`
- Aba "Respostas" aparece para `editor` e `viewer`
- Toast ao tentar ação não permitida

---

## Arquivos Afetados

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/002_collaborators.sql` | Criar | Migration com tabela, RLS e índices |
| `src/types/index.ts` | Modificar | Adicionar tipos Collaborator e CollabRole |
| `src/middleware.ts` | Modificar | Validar cookie collab_session, injetar headers |
| `src/app/api/forms/[id]/collaborators/route.ts` | Criar | GET e POST de colaboradores |
| `src/app/api/forms/[id]/collaborators/[cid]/route.ts` | Criar | DELETE colaborador |
| `src/app/api/collab/login/route.ts` | Criar | Login do colaborador |
| `src/app/api/collab/session/route.ts` | Criar | Verificar sessão |
| `src/app/f/[slug]/collab/page.tsx` | Criar | Tela de login do colaborador |
| `src/components/editor/FormEditor.tsx` | Modificar | Adicionar aba Compartilhar |
| `src/components/editor/EditorSharing.tsx` | Criar | Conteúdo da aba Compartilhar |
| `src/app/dashboard/forms/[id]/FormEditorClient.tsx` | Modificar | Ler headers de role e passar para FormEditor |
| `src/app/dashboard/forms/[id]/page.tsx` | Modificar | Passar role do colaborador |
| `.env.local` | Modificar | Adicionar COLLAB_SECRET |
| `src/lib/collab-session.ts` | Criar | Funções sign/verify do cookie HMAC |
