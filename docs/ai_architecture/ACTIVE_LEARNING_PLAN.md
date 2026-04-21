# Plano de Implementação: Backend de Active Learning para Make Sense

O objetivo deste plano é transformar o projeto atual (que roda 100% no navegador e salva os dados no IndexedDB) em uma arquitetura Cliente-Servidor. Isso permitirá rodar um pipeline completo de Inteligência Artificial: predições em tempo real (auto-labeling), ampliação de dados (data augmentation) e retreinamento de modelo (active learning).

## Decisões de Arquitetura

1. **Stack do Backend:** **Python** + **FastAPI** por causa da altíssima performance estrutural e da integração nativa com bibliotecas de Machine Learning (PyTorch/OpenCV).
2. **Modelo de Visão:** **YOLOv8** (Ultralytics) - o padrão da indústria para detecção de objetos em termos de velocidade e facilidade de retreinamento.
3. **Estrutura de Pastas (Monorepo):** Criação de uma pasta `backend/` na raiz do projeto original.

---

## Fases de Implementação

### Fase 1: Fundação do Backend (Python + FastAPI)
Criar a infraestrutura base num diretório separado capaz de receber requisições do frontend.

#### [NEW] `backend/main.py`
Ponto de entrada da API. Configurações de CORS para permitir que o frontend (na porta 3000) faça requisições HTTP para a API (porta 8000).

#### [NEW] `backend/requirements.txt`
Dependências: `fastapi`, `uvicorn`, `python-multipart`, `ultralytics` (YOLO), `opencv-python`, etc.

#### [NEW] `backend/app/`
Módulo principal contando com as subpastas `routes` (endpoints de API), `models` (definições de dados no banco), `services` (lógica pesada de ML), e `workspace/` (base para armazenamento de imagens trafegadas).

---

### Fase 2: Integração Frontend -> Backend (Sincronização)
Sincronizar os dados de anotação da UI (Frontend) diretamente para o Backend.

#### [MODIFY] `src/services/ProjectStore.ts`
Atualmente salva local no `idb`. Criaremos um fluxo que também sincroniza esses dados via API (`POST /api/projects/:id`).
A estrutura do IndexedDB atuará como cache local auxiliado por chamadas `axios` para o backend Python.

#### [NEW] Endpoints de Cloud Workspace (`backend/app/routes/projects.py`)
Métodos REST para salvar e listar as imagens do projeto em disco no servidor, salvando também as coordenadas e metadados no padrão esperado pelos modelos YOLO.

---

### Fase 3: Auto-Labeling (Inferência e Sugestões)
Integração de um modelo YOLO pré-treinado ou zero-shot para prever boxes em tempo real.

#### [NEW] `backend/app/services/inference.py`
Função que recebe a requisição de inferência de uma imagem, computa usando a biblioteca `ultralytics` e retorna um array JSON contento coordenadas `[x, y, w, h]` e `labels`.

#### [MODIFY] FrontEnd Actions (`src/logic/actions/AI...`)
Iremos alterar/re-aproveitar a interface do "SuggestLabelNamesPopup" nativa para consultar nosso próprio endpoint (`/api/predict`) retornando as caixas automaticamente.

---

### Fase 4: Retreinamento e Data Augmentation (Active Learning)
A infraestrutura para realizar aumentos de base e iniciar treinamentos incrementais.

#### [NEW] `backend/app/services/augmentation.py`
Usa `albumentations` e OpenCV para criar distorções e melhorias artificiais na base original anotada mantendo os bounding boxes nas proporções exatas.

#### [NEW] `backend/app/services/trainer.py` & `/api/train`
Endpoint que prepara os dados recebidos (dataset config .yaml) e comanda o script `model.train()` de forma assíncrona. 

#### [MODIFY] `src/views/EditorView/TopNavigationBar`
Adiciona botões para comandar o servidor a iniciar o treinamento diretamente da tela principal.
