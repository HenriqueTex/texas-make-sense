# Image Similarity Sequencing Plan

## Goal
Adicionar uma funcionalidade local no navegador que gere embeddings visuais para cada `ImageData`, agrupe imagens parecidas por similaridade cosseno e permita ao usuário disparar isso por um botão `Agrupar Similares`.

## Chosen Direction
- Biblioteca: `Transformers.js` da HuggingFace
- Modelo inicial: `Xenova/clip-vit-base-patch32`
- Execução: 100% no navegador
- Estado: novo slice Redux `similarityReducer`
- Momento de geração: embedding calculado assim que a imagem for carregada
- Ação do usuário: botão `Agrupar Similares`
- Critério inicial: similaridade cosseno `>= 0.85`

## Scope
- V1 não precisa reordenar automaticamente todas as imagens.
- V1 precisa gerar embeddings, armazenar no state, calcular similaridade e criar grupos.
- A ordenação sequencial pode vir como consequência posterior, depois que o agrupamento estiver estável.

## Architecture
- Novo slice `similarity` no Redux com:
  - status global da pipeline
  - embeddings por `imageId`
  - fila/progresso de processamento
  - grupos gerados
  - threshold configurável
  - metadados do modelo carregado
- Novo serviço para:
  - inicializar pipeline do `Transformers.js`
  - converter `File`/imagem carregada em input do modelo
  - gerar embedding normalizado
  - calcular similaridade cosseno
  - montar grupos de similares
- Integração com fluxo existente:
  - quando a imagem for efetivamente carregada no app, disparar extração do embedding se ainda não existir
  - persistência do projeto continua separada da feature até validar custo/tamanho dos embeddings

## Recommended State Shape
```ts
similarity: {
  modelStatus: 'idle' | 'loading' | 'ready' | 'error';
  embeddingStatusByImageId: Record<string, 'idle' | 'queued' | 'processing' | 'ready' | 'error'>;
  embeddingsByImageId: Record<string, number[]>;
  similarityGroups: Array<{
    anchorImageId: string;
    members: Array<{ imageId: string; score: number }>;
  }>;
  threshold: number;
  lastGroupingAt: number | null;
}
```

## Tasks
- [ ] Adicionar dependência `@xenova/transformers` e validar carregamento do modelo em ambiente Vite. → Verify: app sobe e o pipeline `Xenova/clip-vit-base-patch32` inicializa sem quebrar bundle.
- [ ] Criar novo slice Redux `similarityReducer` com actions, tipos e estado inicial. → Verify: store expõe `state.similarity` com shape estável e sem acoplamento indevido ao slice `labels`.
- [ ] Criar serviço de inferência para inicializar o CLIP e gerar embeddings normalizados no navegador. → Verify: uma imagem de teste produz um vetor consistente e repetível.
- [ ] Integrar geração automática do embedding ao fluxo de carregamento de `ImageData`. → Verify: ao carregar imagens no editor, cada `imageId` recebe status e embedding correspondente.
- [ ] Implementar cache em memória no state para evitar recomputar embeddings já gerados. → Verify: reabrir a mesma imagem durante a sessão não dispara inferência duplicada.
- [ ] Implementar função de similaridade cosseno entre embeddings. → Verify: duas imagens idênticas ou quase idênticas retornam score alto e imagens bem diferentes retornam score menor.
- [ ] Implementar ação `Agrupar Similares` para percorrer embeddings prontos e formar grupos com threshold inicial `0.85`. → Verify: ao clicar no botão, o state passa a conter grupos com scores associados.
- [ ] Definir regra de agrupamento para evitar duplicidade excessiva. → Verify: uma imagem não aparece como âncora redundante em múltiplos grupos equivalentes.
- [ ] Adicionar botão `Agrupar Similares` na UI e exibir progresso/estado da análise. → Verify: usuário consegue disparar o agrupamento e ver quando ele terminou ou falhou.
- [ ] Exibir resultado dos grupos na interface de forma auditável. → Verify: usuário consegue ver quais imagens foram agrupadas e os scores correspondentes.
- [ ] Definir estratégia de invalidação quando imagens forem adicionadas/removidas do projeto. → Verify: embeddings antigos não ficam associados a imagens inexistentes.
- [ ] Validar desempenho e uso de memória em lotes pequenos, médios e grandes. → Verify: checklist preenchido com tempo de inferência e responsividade da UI.

## Grouping Rules
- Normalizar embedding antes da comparação.
- Usar similaridade cosseno como métrica padrão.
- Threshold inicial fixo em `0.85`.
- Tratar threshold como configuração de state para ajuste futuro via UI.
- Gerar grupos a partir de uma imagem âncora e incluir membros acima do threshold.
- Impedir que o mesmo `imageId` seja agrupado repetidamente de forma confusa na mesma execução.

## UI Plan
- Botão novo: `Agrupar Similares`
- Local sugerido: barra superior central, próximo das tools operacionais
- Estados visuais mínimos:
  - modelo carregando
  - embeddings em processamento
  - agrupamento em execução
  - agrupamento concluído
  - erro
- Resultado inicial:
  - painel/lista com grupos
  - cada item mostra miniatura, score e imagem âncora

## Performance Notes
- `clip-vit-base-patch32` não é o menor modelo possível, então a UX precisa de:
  - processamento assíncrono
  - fila incremental
  - feedback de progresso
  - opção de não recalcular embeddings prontos
- Se o custo ficar alto demais:
  - manter a arquitetura pronta para trocar o modelo depois
  - preservar a API interna do serviço de embeddings

## Risks
- Tempo de inicialização do modelo no navegador.
- Uso de memória ao guardar muitos embeddings no state.
- Travamento perceptível se a geração rodar sem chunking.
- Threshold `0.85` funcionar bem para alguns datasets e mal para outros.
- Bundle crescer demais se a integração com `Transformers.js` não for isolada corretamente.

## Out of Scope For V1
- Reordenação automática completa do dataset.
- Persistir embeddings no IndexedDB.
- Ajuste fino de threshold via slider avançado.
- Busca textual multimodal com o encoder CLIP.

## Verification Checklist
- [ ] O modelo `Xenova/clip-vit-base-patch32` roda localmente no navegador.
- [ ] Cada `ImageData` carregada recebe embedding uma única vez por sessão.
- [ ] O estado `similarity` reflete progresso, embeddings e grupos.
- [ ] O botão `Agrupar Similares` gera grupos consistentes.
- [ ] A UI continua responsiva durante inferência e agrupamento.
- [ ] Adicionar/remover imagens não deixa lixo de embeddings no state.
- [ ] O agrupamento funciona com threshold inicial `0.85`.

## Done When
- [ ] O usuário consegue carregar imagens, deixar o app gerar embeddings em background e clicar em `Agrupar Similares` para obter grupos de imagens visualmente parecidas usando `Transformers.js` + CLIP no navegador.
