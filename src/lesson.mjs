export const VERSION = 1;
export const STORAGE_KEY = "aula-tcp-udp:v1";
export const QUESTIONS = [
  {
    id: "instalador",
    icon: "download",
    title: "O instalador precisa chegar inteiro",
    text: "Você vai baixar um programa. Todas as partes precisam chegar corretamente para a instalação funcionar. Qual protocolo oferece confirmação e recuperação de partes perdidas?",
    answer: "TCP",
    explanation:
      "O TCP confirma o recebimento e retransmite partes perdidas. Isso ajuda a receber o arquivo completo.",
  },
  {
    id: "voz",
    icon: "voice",
    title: "Uma conversa acontecendo agora",
    text: "Em uma chamada de voz, perder um pequeno trecho é aceitável. Esperar para recuperar um trecho antigo atrapalharia a conversa. Qual protocolo combina com esse envio sem retransmissão obrigatória?",
    answer: "UDP",
    explanation:
      "Nesse caso, manter o áudio atual importa mais que recuperar um trecho antigo. O UDP não exige confirmação nem retransmissão pelo próprio protocolo.",
  },
  {
    id: "documento",
    icon: "file",
    title: "Um documento sem partes faltando",
    text: "Um documento deve chegar completo e na ordem correta. O envio precisa recuperar informações que se perderem no caminho. Qual protocolo oferece esses recursos?",
    answer: "TCP",
    explanation:
      "O TCP recupera perdas e entrega os dados em ordem. Isso é útil para transferir um documento completo.",
  },
  {
    id: "jogadores",
    icon: "game",
    title: "Onde o jogador está agora?",
    text: "Um jogo envia posições dos jogadores muitas vezes por segundo. Uma posição nova substitui a anterior, e algumas atualizações podem ser perdidas. Qual protocolo permite seguir sem aguardar a recuperação da posição antiga?",
    answer: "UDP",
    explanation:
      "Uma atualização recente pode substituir a perdida. O UDP permite enviar as próximas sem exigir confirmação ou recuperação da anterior.",
  },
  {
    id: "microfone",
    icon: "voice",
    title: "O microfone durante a partida",
    text: "Você conversa com sua equipe durante um jogo. Um pequeno corte é tolerável, mas recuperar áudio antigo criaria atraso. Qual protocolo combina com essa necessidade?",
    answer: "UDP",
    explanation:
      "Para esse áudio ao vivo, interessa ouvir o presente. O UDP não obriga o envio a esperar a recuperação de trechos antigos.",
  },
  {
    id: "backup",
    icon: "file",
    title: "Uma cópia de segurança completa",
    text: "Você transfere um backup para outro computador. Nenhuma parte pode faltar, mesmo que seja preciso aguardar uma retransmissão. Qual protocolo oferece esse comportamento?",
    answer: "TCP",
    explanation:
      "O TCP pode retransmitir o que se perdeu e organizar os dados recebidos. Uma falha de conexão ainda pode impedir a conclusão do envio.",
  },
  {
    id: "imagem",
    icon: "image",
    title: "Todas as partes da imagem",
    text: "Uma imagem será transferida como arquivo. É necessário receber todas as partes corretamente antes de usar o arquivo. Qual protocolo oferece recuperação de perdas e entrega em ordem?",
    answer: "TCP",
    explanation:
      "O TCP trata perdas por retransmissão e entrega os dados em ordem. O arquivo completo importa mais que dispensar a espera.",
  },
  {
    id: "objeto",
    icon: "position",
    title: "A posição atual do objeto",
    text: "Um painel acompanha um objeto em movimento. Chegam novas posições continuamente. Pode faltar uma atualização, pois a seguinte será mais útil que a antiga. Qual protocolo permite esse envio sem recuperação obrigatória?",
    answer: "UDP",
    explanation:
      "A posição mais recente é a informação útil nesse cenário. O UDP não recupera obrigatoriamente a atualização que faltou.",
  },
  {
    id: "sensor",
    icon: "sensor",
    title: "A próxima leitura já está chegando",
    text: "Um sensor envia a leitura atual várias vezes por segundo. Para este painel, perder uma leitura isolada é aceitável: interessa o valor mais recente. Qual protocolo combina com não retransmitir a leitura antiga?",
    answer: "UDP",
    explanation:
      "Neste cenário, a leitura seguinte substitui a anterior. O UDP permite seguir enviando sem exigir a recuperação daquela leitura.",
  },
  {
    id: "projeto",
    icon: "file",
    title: "O projeto precisa chegar completo",
    text: "Você envia os arquivos de um projeto para outro computador. O destino precisa receber tudo em ordem, recuperando partes perdidas. Qual protocolo oferece esses recursos?",
    answer: "TCP",
    explanation:
      "O TCP usa confirmações e retransmissões para oferecer entrega confiável e em ordem. Se a conexão falhar, a transferência pode não terminar.",
  },
];

export function newAttempt(name = "") {
  return { version: VERSION, name, answers: {}, index: 0 };
}
export function normalizeAttempt(value) {
  if (!value || value.version !== VERSION || typeof value.name !== "string")
    return newAttempt();
  const answers = {};
  // Only a consecutive sequence of known answers is recoverable.
  for (const question of QUESTIONS) {
    const answer = value.answers?.[question.id];
    if (!["TCP", "UDP"].includes(answer)) break;
    answers[question.id] = answer;
  }
  const count = Object.keys(answers).length;
  const index = Number.isInteger(value.index)
    ? Math.max(0, Math.min(value.index, count, 10))
    : count;
  return {
    version: VERSION,
    name: value.name.trim().slice(0, 60),
    answers,
    index,
  };
}
export function answerQuestion(attempt, answer) {
  const question = QUESTIONS[attempt.index];
  if (
    !question ||
    !["TCP", "UDP"].includes(answer) ||
    attempt.answers[question.id]
  )
    return attempt;
  return { ...attempt, answers: { ...attempt.answers, [question.id]: answer } };
}
export function nextQuestion(attempt) {
  if (
    !QUESTIONS[attempt.index] ||
    !attempt.answers[QUESTIONS[attempt.index].id]
  )
    return attempt;
  return { ...attempt, index: Math.min(10, attempt.index + 1) };
}
export function resultOf(attempt) {
  const correct = QUESTIONS.filter(
    (q) => attempt.answers[q.id] === q.answer,
  ).length;
  const answered = QUESTIONS.filter((q) =>
    ["TCP", "UDP"].includes(attempt.answers[q.id]),
  ).length;
  return { correct, wrong: answered - correct, answered, score: correct * 10 };
}
export function loadAttempt(storage) {
  try {
    return {
      attempt: normalizeAttempt(JSON.parse(storage.getItem(STORAGE_KEY))),
      available: true,
    };
  } catch {
    return { attempt: newAttempt(), available: false };
  }
}
export function saveAttempt(storage, attempt) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    return true;
  } catch {
    return false;
  }
}
export function parseRoute(hash) {
  if (hash === "#/jogo") return { mode: "game", slide: 7 };
  const slide = /^#\/slides\/([1-8])$/.exec(hash);
  if (slide) return { mode: "slides", slide: Number(slide[1]) - 1 };
  return hash === "#/atividade"
    ? { mode: "quiz", slide: 7 }
    : { mode: "slides", slide: 0 };
}
