# Revisão visual e de interação — TCP vs. UDP

final result: blocked

Atualização em andamento: o professor solicitou um jogo 3D de dez fases após a atividade. A revisão dos slides abaixo continua válida; a nova experiência deve passar por testes e capturas antes da entrega final.

## Alvo e evidências

A referência enviada pelo professor é uma imagem de contato de um template de apresentação branca, roxa e laranja, com 1061 × 497 pixels. Ela orienta a identidade visual, não o conteúdo comercial do template. O plano aprovado definiu Barlow Condensed, Inter, os tokens de cor e as novas ilustrações didáticas.

Evidências locais, mantidas em `design/` e excluídas da distribuição pública:

- `reference.png`: imagem original fornecida.
- `comparison-before.png`: referência e primeira capa colocadas juntas.
- `comparison-final.png`: comparação final, 2560 × 756 pixels. O slide de capa do contato (recorte 237 × 133) foi ampliado para 1280 × 720; a captura de implementação foi normalizada para o mesmo tamanho. Faixa de identificação de 36 pixels acima.
- `comparison-focused.png`: detalhes de títulos e destaques comparados na mesma imagem. A resolução baixa da referência impede identificar com precisão antialiasing e a fonte original; avalia-se a identidade aprovada e a hierarquia.
- `slide-1-1366.jpg` a `slide-8-1366.jpg`: oito slides, viewport CSS 1366 × 768, densidade 1.
- `slide-1-1920.jpg` a `slide-8-1920.jpg`: oito slides, viewport CSS 1920 × 1080, densidade 1.
- `simulation-tcp-retry.jpg`, `simulation-udp-final.jpg`: comportamentos distintos diante da perda.
- `layout-final.json`: medidas dos 16 estados finais. Documento sem rolagem horizontal ou vertical e rodapé em 768/1080, respectivamente.
- `mobile-390.jpg`: conferência adicional da tabela em largura de 390 pixels, sem extrapolar horizontalmente.

As primeiras capturas foram feitas com escala temporária de emulação. Ela foi removida antes dos testes de interação, que usaram a capacidade nativa de viewport. As capturas finais usam os tamanhos reais descritos acima. Animações de entrada foram desativadas temporariamente com a preferência de movimento reduzido para capturar o estado estável. A animação normal foi testada separadamente.

## Comparações e correções

1. **P1, contraste da capa:** TCP herdava a cor escura sobre o bloco roxo. A comparação inicial revelou perda clara de legibilidade. Correção: título branco, mantendo UDP laranja. A captura final e o recorte ampliado confirmam leitura imediata.
2. **P2, proporção da ilustração:** computadores pequenos na região branca. A altura passou de 40vh para 50vh, preservando proporções e margem. A comparação final mostra o recurso como foco visual do lado direito.
3. **P2, controles fora da tela do Chromebook:** a tabela e os exemplos ultrapassavam a altura disponível. Foram reduzidos os espaços verticais de tabela e blocos para telas com até 850 pixels de altura. A verificação final dos oito slides em 1366 × 768 não apresentou overflow nem rodapé oculto.
4. **P2, espaço da atividade:** ajuste de margens, área do ícone e preenchimento da questão para manter feedback e ação de continuar confortáveis no Chromebook, conservando texto principal de 20 pixels nesse viewport.

Depois dos ajustes, a referência e a implementação foram abertas juntas novamente, com ampliação de títulos e inspeção individual da tabela, do TCP, do simulador e do exercício. Nenhum P0/P1/P2 pendente identificado no escopo solicitado.

## Cinco superfícies de fidelidade

| Superfície | Verificação |
|---|---|
| Fontes e tipografia | Barlow Condensed 600/700 e Inter 400/500/600/700 locais. Títulos de conteúdo entre 76 e 82 px na TV, capa com escala maior. Corpo principal entre 28 e 36 px na TV; notas e controles secundários menores. Quebras naturais, títulos contrastantes e conteúdo curto. |
| Espaçamento e composição | Fundo branco, blocos roxos/laranja, assimetria e grandes margens seguem a direção aprovada. Blocos com canto superior arredondado nos destaques; sem dashboard ou molduras em cada parágrafo. Cabeçalho/rodapé de navegação são adaptações funcionais à aplicação. |
| Cores e tokens | #3012B5, #FF603D, #202035 e #F3F2FA. Branco sobre roxo, texto escuro sobre laranja e feedback verde com texto/ícone. Laranja é destaque de títulos grandes, sem depender dele para transmitir acerto/erro. |
| Imagens e ícones | Ilustrações próprias nítidas, sem marcas ou quadriculados. Imagens preservam proporção com object-fit: contain. Phosphor é a única família de ícones. O diagrama animado é uma interface funcional com símbolos da biblioteca e partes numeradas, não uma imagem estática. |
| Texto e conteúdo | Oito slides básicos, dez cenários contextualizados e explicações curtas. Não se afirma que UDP é sempre mais rápido ou que TCP nunca perde dados. Textos comerciais, logotipo e marcas d'água da referência não integram a aula. |

## Interações verificadas no navegador

- Entrada pelos botões, oito slides, setas do teclado e tela cheia com retorno.
- Fontes oficiais em diálogo, com foco no fechamento e retorno à apresentação.
- TCP por etapas: perda da parte 3, retenção de 4/5/6, reenvio e entrega completa em ordem. UDP termina com 1/2/4/5/6 e nenhuma confirmação.
- Movimento normal: iniciar, pausar em 334 ms, manter exatamente 334 ms durante outras interações, continuar e pausar automaticamente ao sair do slide.
- Preferência de movimento reduzido ativa o modo por etapas, que alcança ambos os finais.
- Dez respostas certas na interface produzem 100 pontos, dez itens de revisão, dez acertos e zero erros. Refazer limpa os pontos e retorna à primeira questão.
- Atualização da página e ida/volta aos slides mantêm resposta, feedback e bloqueio de nova resposta.
- Nome com marcação de teste é apresentado literalmente como texto, sem criar elementos HTML.
- Console inspecionado: os erros registrados pertencem a extensão `chrome-extension://`; nenhum erro da aplicação observado no percurso local.

## Limites e polimento

- A mudança real de visibilidade da janela não foi reproduzida pelo navegador embutido: suas abas permaneceram com document.hidden=false. O listener de visibilitychange foi inspecionado; pausa por saída de slide e pelo botão foi confirmada em execução. Não se apresenta essa sondagem como teste completo de aba oculta do sistema.
- A referência é um contato de baixa resolução, com conteúdo e proporções diferentes. As comparações confirmam a direção visual aprovada, sem alegar reprodução literal pixel a pixel do arquivo comercial.
- P3 opcional: permitir ao professor variar quantidade de perdas. A demonstração atual mantém uma perda determinística para facilitar a explicação básica.

## Checklist final

- [x] Comparação conjunta e ampliada com o material fornecido.
- [x] Correção e recaptura dos problemas de contraste, imagem e altura.
- [x] Oito slides conferidos em Chromebook e TV.
- [x] Simulação, atividade, persistência, navegação e tela cheia conferidas.
- [x] Resultado visual aprovado no escopo descrito.
