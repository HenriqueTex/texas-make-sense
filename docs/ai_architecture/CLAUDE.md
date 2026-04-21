# Make Sense — CLAUDE.md

Ferramenta web de anotação de imagens para visão computacional. Fork pessoal para uso local, desvinculado do projeto original (git recriado do zero).

## Comandos

```bash
npm run dev      # dev server em localhost:3000
npm run build    # build de produção
npm test         # testes Jest
```

## Stack

- React 18 + TypeScript + Redux (connect API)
- Vite + SCSS
- TensorFlow.js (YOLOv5, SSD, PoseNet) para anotação assistida por IA
- IndexedDB via `idb` para persistência local

## Arquitetura do Estado (Redux)

```
AppState
├── general     — projectData (name, type), UI state (popup, cursor, zoom)
├── labels      — imagesData[], labels[], activeImageIndex, activeLabelType
├── ai          — status dos detectores
├── notifications
└── projects    — projectList[], activeProjectId, saveStatus  ← adicionado
```

O store é instanciado em `src/index.tsx` e exportado como `export const store`. Código não-React acessa o store via `import {store} from '../..'` (padrão existente no codebase).

## Funcionalidade: Persistência de Projetos

### Arquivos adicionados

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/services/ProjectStore.ts` | CRUD IndexedDB. Dois stores: `projects` (dados completos c/ imagens) e `projects-meta` (metadados apenas, para listagem rápida). DB versão 2 com migração automática de v1. |
| `src/store/projects/types.ts` | Tipos: `ProjectMeta`, `ProjectsState`, `SaveStatus` (`'idle' \| 'saved' \| 'saving' \| 'unsaved' \| 'error'`) |
| `src/store/projects/reducer.ts` | Estado inicial `saveStatus: 'idle'`. Ao setar `activeProjectId: null`, reseta `saveStatus` para `'idle'` automaticamente. |
| `src/store/projects/actionCreators.ts` | `updateProjectList`, `updateActiveProjectId`, `updateSaveStatus` |
| `src/hooks/useSaveProject.ts` | Hook central de save. Usa `useRef` para snapshot do estado (evita stale closure). Retorna `save()` com referência estável via `useCallback([dispatch])`. |
| `src/hooks/useAutoSave.ts` | Debounce de **2000ms**. Usa `useSaveProject()`. Dispara em mudanças de `imagesData`, `labels`, `projectData`. |
| `src/logic/project/ProjectLoader.ts` | `openProject(id)` — carrega projeto do IDB e reseta todo o estado de UI antes de aplicar. `saveProjectNow()` — save imediato sem debounce (usado no Exit). |
| `src/views/MainView/ProjectList/` | Componente de lista de projetos com confirmação de exclusão inline. |

### Fluxo de criação de projeto
1. Usuário clica "New Project" → `projectInProgress = true` → mostra `ImagesDropZone`
2. Drop de imagens + seleção de tipo → `ImagesDropZone` gera `crypto.randomUUID()` e dispara `updateActiveProjectId`
3. `useAutoSave` detecta `activeProjectId` != null e começa a monitorar mudanças

### Fluxo de abertura de projeto
1. Usuário clica em projeto na lista → `openProject(id)`
2. Reset de estado de UI (activeLabelType, activeLabelId, highlightedLabelId, etc.)
3. Carrega dados do IDB → dispatcha para Redux → App roteia para EditorView

### Save manual
Botão "Save" na `TopNavigationBar`. Chama `useSaveProject()` diretamente (mesmo hook do auto-save — sem duplicação de lógica).

### Exit do projeto
`ExitProjectPopup` chama `saveProjectNow()` antes de limpar o estado. Botões ficam desabilitados durante o save. Mensagem muda para "Saving your project…" durante o processo.

## Navegação por Teclado (imagens)

Modificado em `src/logic/context/EditorContext.ts`:

| Tecla | Ação |
|-------|------|
| `←` | Imagem anterior |
| `→` | Próxima imagem |
| `↑` / `↓` | Pan vertical do viewport (mantido) |
| `Ctrl+←` / `Ctrl+→` | Navegar imagens (mantido, redundante mas compatível) |
| `Ctrl++` / `Ctrl+-` | Zoom in/out |

Pan horizontal foi removido das bare arrows. Mouse drag cobre esse caso.

## Padrões do Projeto

- **Componentes React**: funcionais com `connect()` da API legada do react-redux. Não migrar para hooks do Redux (`useSelector`/`useDispatch`) nos componentes existentes sem necessidade.
- **Lógica não-React**: classes estáticas em `src/logic/actions/` e `src/logic/context/`. Acesso ao store via `store.dispatch()` / `store.getState()`.
- **SCSS**: arquivos `.scss` co-localizados com o componente. Variáveis globais em `src/settings/_Settings.scss`.
- **Tipos**: definir interfaces de Redux action em `store/<slice>/types.ts`, nunca inline.
- **`any` é proibido** nas props de componentes — sempre tipar com os tipos corretos do domínio.

## Decisões de Arquitetura

- **IndexedDB separado em dois stores** (`projects` + `projects-meta`): evita carregar blobs de imagens só para listar projetos. Migração automática de v1 via cursor no `upgrade` callback.
- **`dbPromise.catch(() => { dbPromise = null; })`**: permite retry em caso de falha ao abrir o banco.
- **`useSaveProject` com `useRef` snapshot**: garante que `save()` tenha referência estável mas sempre leia o estado mais recente — evita stale closure sem adicionar dependências desnecessárias ao `useCallback`.
- **`saveStatus: 'idle'`** como estado inicial: semanticamente correto (nenhum projeto aberto = sem status de save). O indicador só aparece quando `activeProjectId !== null`.
