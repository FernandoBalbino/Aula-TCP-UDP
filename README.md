# TCP vs. UDP — aula interativa

[Abrir a aula](https://fernandobalbino.github.io/Aula-TCP-UDP/) · [Ir direto à atividade](https://fernandobalbino.github.io/Aula-TCP-UDP/#/atividade)

Nove slides para uma aula introdutória de redes no Ensino Médio Técnico, com simulação animada, dez questões e um jogo 3D de dez fases.

## Usar com a turma

- Na TV, navegue pelas setas do teclado ou pelos botões. Home volta à capa e End abre a revisão. Use o botão de tela cheia para apresentar.
- No slide 7, escolha TCP ou UDP e inicie o envio. É possível pausar, continuar, reiniciar ou avançar por etapas. A preferência de movimento reduzido ativa o modo por etapas.
- No slide 8, use **Iniciar corrida** para comparar dois mapas do mesmo trajeto fictício. TCP recupera as posições e o app as anima em sequência; UDP mostra diretamente a posição mais recente recebida, com pausas e saltos. É possível pausar, reiniciar e avançar por etapas. O círculo verde indica a posição real da moto.
- Nos Chromebooks, os alunos abrem o mesmo link e selecionam **Atividade prática**. Cada resposta é registrada uma única vez, com explicação imediata. São dez questões e até 100 pontos.
- A atividade combina seis situações escritas e quatro cenas interativas (questões 1, 3, 4 e 8): recuperar um arquivo, ordenar mensagens, acompanhar um personagem na tela do colega e localizar a moto no app. Use **Iniciar simulação**, pause, repita ou avance por etapas; depois escolha TCP ou UDP. As cenas não revelam o protocolo antes da resposta. Os IDs e as respostas corretas dessas quatro situações foram preservados para manter tentativas já salvas.
- A pontuação e o nome ficam neste navegador. Atualizar a página ou voltar aos slides preserva o progresso. **Refazer atividade** inicia outra tentativa com o mesmo nome.
- Não existe ranking compartilhado ou envio de respostas ao professor. Para conferir o resultado, o aluno pode mostrar a tela final, que inclui as dez explicações.
- Depois das dez questões, use **Iniciar jogo**. O carregamento prepara o código 3D, as geometrias, os materiais, as fontes e os shaders antes de liberar os controles.
- No jogo, clique nos pacotes, arraste peças ou clique na peça e depois no destino. Na fase do jogador, use setas/WASD ou os controles na tela. O jogo guarda a próxima fase liberada; ao voltar, a fase atual recomeça. A nota do questionário permanece separada.
- Se o navegador não iniciar o 3D, é possível continuar no **modo leve**, com as mesmas regras e objetivos. Os recursos são estáticos, servidos pelo GitHub Pages.

## As dez fases do jogo

1. Enviar três pacotes TCP e observar as confirmações.
2. Organizar partes recebidas fora de ordem.
3. Retransmitir a parte perdida.
4. Devolver confirmações para a origem.
5. Recuperar uma parte e entregar o arquivo completo.
6. Continuar enviando UDP depois de uma perda.
7. Enviar o trecho atual de voz em três rodadas.
8. Controlar um cubo e acompanhar atualizações de posição.
9. Levar a leitura atual de um sensor ao painel.
10. Montar o arquivo na rota TCP e enviar a posição atual na rota UDP.

Não há punição por velocidade ou pontos extras por perder dados. Cada fase explica o comportamento praticado. A tela final mostra fases concluídas e a nota da atividade separadamente.

### Tecnologia e inspiração

O jogo usa **Three.js 0.186.1 e GSAP 3.15.0**. O motor 3D é importado somente ao entrar no jogo; os materiais e shaders são aquecidos antes da primeira fase. A cena limita densidade de pixels, reutiliza geometrias e reduz qualidade se a renderização estiver lenta. Cenas e animações são liberadas ao voltar para a aula.

Inspiração visual: [Lusion](https://lusion.co/), pelo uso de espaço, formas 3D, movimento e interface discreta. Na inspeção de 22/10/2026, seu canvas declarava `three.js r158` e os arquivos eram servidos em `/_astro/`, indicativo de Astro. Não foi confirmada a biblioteca de animação da Lusion; GSAP é uma escolha desta aplicação. Nenhum código ou modelo da Lusion foi incorporado.

Sugestão de 60 minutos: 30 minutos nos conceitos e exemplos, 10 na simulação, 5 na revisão e 15 na atividade.

## Conceitos e limites

O TCP confirma dados recebidos, retransmite perdas e oferece entrega em ordem. Uma falha de conexão ainda pode impedir uma transferência. O UDP não exige confirmação, retransmissão ou organização pelo próprio protocolo. Aplicações podem acrescentar recursos sobre eles.

Os pacotes, os números e os tempos são uma simplificação didática. O exemplo de TCP mantém partes posteriores em espera até recuperar a parte 3; o de UDP recebe cinco partes sem recuperar a terceira. A velocidade básica de trânsito é a mesma nos dois modos. A simulação não mede desempenho real da internet.

A corrida usa os mesmos envios e incidentes de rede nos dois modos. O app UDP descarta atualizações antigas por número de sequência; isso é uma regra da aplicação. No exemplo TCP, a reprodução contínua é uma escolha da interface e pode acumular atraso enquanto recupera perdas. A simulação não representa a implementação real da Uber.

Fontes oficiais, também disponíveis em **Fontes e aula**:

- [RFC 9293 — TCP](https://www.rfc-editor.org/rfc/rfc9293.html)
- [RFC 768 — UDP](https://www.rfc-editor.org/rfc/rfc768.html)

## Desenvolvimento e publicação

Requisitos: Node.js 22 ou 24 e npm.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:sites
```

O desenvolvimento usa Vite e a base `/Aula-TCP-UDP/`. O build estático fica em `dist/client`. A publicação usa `.github/workflows/pages.yml` e GitHub Pages configurado para GitHub Actions, com HTTPS.

O runtime original do template Product Design (`.openai`, `worker` e empacotamento Sites) foi preservado. A aplicação publicada usa somente GitHub Pages, sem serviços no Render.

## Dados locais

`localStorage` usa as chaves exclusivas `aula-tcp-udp:v1` (nome, respostas e questão) e `aula-tcp-udp:game:v1` (nome e próxima fase liberada). A pontuação é recalculada a partir das respostas. Se o armazenamento estiver bloqueado, a aula informa que não recuperará o progresso e mantém a tentativa em memória durante a aba aberta.

Abrir no mesmo perfil de navegador recupera a tentativa anterior; outro perfil ou dispositivo possui seu próprio progresso. Limpar os dados do site remove a tentativa. Não há telemetria ou bibliotecas externas de análise.

## Identidade e créditos

Referência: template branco, roxo e laranja fornecido pelo professor. O arquivo de referência e as capturas de QA permanecem na pasta local `design/`, sem serem distribuídos como recursos da aplicação.

As duas ilustrações de computadores e encomendas foram geradas com imagegen integrado e estão em `public/assets/`. O conjunto de prompts está em `ASSETS.md`. Fontes Barlow Condensed e Inter distribuídas pelo Fontsource; ícones Phosphor e React. Avisos em `THIRD_PARTY_NOTICES.md`.
