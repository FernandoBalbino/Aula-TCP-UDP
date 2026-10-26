# Prototype Instructions

## Preferências aprovadas para esta aula

- Aplicação independente do TechManager, publicada em FernandoBalbino/Aula-TCP-UDP pelo GitHub Pages.
- Nove slides básicos para Ensino Médio Técnico e atividade individual com dez situações, cinco TCP e cinco UDP.
- Referência visual: template branco/roxo/laranja fornecido pelo professor. Paleta #3012B5, #FF603D, #202035 e #F3F2FA. Barlow Condensed nos títulos e Inter nos textos, hospedadas localmente.
- Leitura em TV 1920×1080 e Chromebook 1366×768; manter controles de navegação visíveis. Imagens próprias substituem os espaços quadriculados do template.
- Sem backend, contas externas, coleta de nomes ou envio de pontuação. Persistência exclusiva no navegador.
- Após as dez questões, liberar o jogo com dez fases práticas. Three.js e GSAP com carregamento explícito, mantendo as cores da aula e a limpeza/movimento da referência Lusion. Preservar arraste e alternativa clicar-peça/clicar-destino, controles de jogador, modo leve e progresso local separado da nota.
- Após a viagem dos pacotes (slide 7), manter a comparação de corrida fictícia em dois mapas (slide 8), com moto oficial da página pública da Uber, prédios SVG com profundidade e cores da aula. TCP reproduz posições em sequência com interpolação e possível atraso; UDP mantém a última posição e salta para as novas, descartando antigas no app. Não atribuir esses protocolos à implementação real da Uber. Preservar a atividade e o jogo.
- A atividade tem seis questões escritas e quatro simulações para o aluno observar e escolher TCP/UDP: arquivo, mensagens em ordem, posições de personagem e corrida. Manter dez questões, cinco respostas de cada protocolo, 10 pontos por acerto, feedback após responder e liberação do jogo. As cenas não exibem o nome do protocolo antes da resposta e têm pausa, repetição e avanço por etapas.
- Demonstração didática com seis partes e perda da terceira no primeiro envio. Mesma velocidade de trânsito para TCP/UDP. Não ensinar que UDP é sempre mais rápido ou que TCP nunca sofre perdas/falhas.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
