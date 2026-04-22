# Dashboard Enhancements Design

## Features
1. **Métricas com filtros** — seletor de formulário + date picker + tooltips nos cards
2. **Logo no sidebar** — upload em configurações (base64), aparece ao lado do nome
3. **Redefinir senha** — nas configurações, campos senha atual/nova/confirmar
4. **Foto de perfil de convidados** — upload ao aceitar convite, aparece no histórico e lista
5. **Aba Histórico** — log de atividades completo com foto, nome, ação, data/hora
6. **Fix cache** — formulários não devem recarregar ao navegar entre eles

## Database
- Nova tabela `form_activity_log` (id, form_id, user_id, collaborator_id, action, details JSONB, created_at)
- Coluna `logo_url` adicionada em `profiles`
- Coluna `avatar_url` adicionada em `form_collaborators`

## Files
- Create: `src/components/editor/EditorHistory.tsx`, migration 004
- Modify: `dashboard/page.tsx`, `Sidebar.tsx`, `SettingsClient.tsx`, `FormEditor.tsx`, `MetricCard.tsx`, `FormEditorClient.tsx`
