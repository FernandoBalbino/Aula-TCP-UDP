export const GAME_KEY = "aula-tcp-udp:game:v1";
export const LEVELS = [
  {
    kind: "send",
    protocol: "TCP",
    title: "A primeira viagem",
    instruction:
      "Clique nos três pacotes para enviá-los. Observe a confirmação voltar.",
    goal: 3,
    lesson: "O TCP usa confirmações para saber quais dados chegaram.",
  },
  {
    kind: "order",
    protocol: "TCP",
    title: "Cada parte no seu lugar",
    instruction:
      "Arraste as partes para os espaços com o mesmo número. Você também pode clicar na peça e depois no espaço.",
    goal: 3,
    lesson:
      "As partes podem chegar fora de ordem. O TCP organiza a entrega para a aplicação.",
  },
  {
    kind: "retry",
    protocol: "TCP",
    title: "Faltou uma parte",
    instruction:
      "A parte 3 se perdeu. Leve uma nova cópia dela ao espaço vazio.",
    goal: 1,
    lesson: "O TCP pode retransmitir uma parte que não foi confirmada.",
  },
  {
    kind: "ack",
    protocol: "TCP",
    title: "Avise que chegou",
    instruction:
      "Os dados chegaram ao destino. Devolva as três confirmações para a origem.",
    goal: 3,
    lesson:
      "A confirmação informa o recebimento dos dados. Ela não significa que alguém abriu o arquivo.",
  },
  {
    kind: "assemble",
    protocol: "TCP",
    title: "O arquivo completo",
    instruction:
      "Recupere a parte que falta. Depois, entregue o arquivo completo.",
    goal: 2,
    lesson:
      "Receber todas as partes importa em um arquivo. Uma falha de conexão ainda pode interromper a transferência.",
  },
  {
    kind: "stream",
    protocol: "UDP",
    title: "O envio continua",
    instruction:
      "Clique nos seis pacotes para enviá-los. Se um se perder, continue com os próximos.",
    goal: 6,
    lesson:
      "O pacote 3 se perdeu, mas os próximos seguiram. O UDP não exige confirmação ou retransmissão por conta própria.",
  },
  {
    kind: "latest",
    protocol: "UDP",
    title: "A voz é de agora",
    instruction:
      "Em cada rodada, envie o trecho marcado como atual. Os trechos antigos podem ficar para trás.",
    goal: 3,
    lesson:
      "Neste áudio ao vivo, um trecho recente é mais útil que recuperar um antigo. A aplicação define essa escolha.",
  },
  {
    kind: "move",
    protocol: "UDP",
    title: "Siga o jogador",
    instruction:
      "Mova o cubo com as setas ou WASD. Visite A, B e C. Uma atualização se perde, mas a seguinte mostra sua nova posição.",
    goal: 3,
    lesson:
      "Atualizações recentes de posição podem substituir as que faltaram. O UDP não obriga recuperar a posição antiga.",
  },
  {
    kind: "sensor",
    protocol: "UDP",
    title: "A leitura mais recente",
    instruction:
      "Arraste a leitura atual até o painel. Faça isso nas três rodadas; as antigas não precisam ser recuperadas.",
    goal: 3,
    lesson:
      "Para este painel, o valor atual importa. Nem toda aplicação de sensor aceita perdas: a necessidade é que decide.",
  },
  {
    kind: "final",
    protocol: "TCP + UDP",
    title: "Duas necessidades",
    instruction:
      "Monte o arquivo com todas as partes na rota TCP. Na rota UDP, envie somente a posição atual.",
    goal: 4,
    lesson:
      "O TCP ajuda a receber o arquivo completo. Neste cenário, a atualização mais recente é o que importa na rota UDP.",
  },
];
export function initialLevel(index) {
  return {
    index,
    done: [],
    round: 0,
    delivered: false,
    player: { x: -4, z: 2 },
    echo: { x: -4, z: 2 },
    checkpoint: 0,
    moves: 0,
  };
}
const token = (id, label, x, z, extra = {}) => ({
  id,
  label,
  x,
  z,
  type: "packet",
  ...extra,
});
const target = (id, label, x, z, extra = {}) => ({
  id,
  label,
  x,
  z,
  type: "target",
  ...extra,
});
export function levelObjects(index, state) {
  const kind = LEVELS[index]?.kind;
  let tokens = [],
    targets = [];
  if (kind === "send" || kind === "stream") {
    const count = kind === "send" ? 3 : 6;
    tokens = Array.from({ length: count }, (_, i) =>
      token(
        "p" + (i + 1),
        String(i + 1),
        -4.8 + (i % 2) * 1.7,
        -2 + Math.floor(i / 2) * 1.85,
      ),
    );
    targets = [target("destino", "Destino", 4, 0)];
  } else if (kind === "order") {
    tokens = [3, 1, 2].map((n, i) =>
      token("p" + n, String(n), -4, -2 + i * 2, { number: n }),
    );
    targets = [1, 2, 3].map((n, i) =>
      target("t" + n, String(n), 3.8, -2 + i * 2, { number: n }),
    );
  } else if (kind === "retry" || kind === "assemble") {
    tokens = [1, 3, 4].map((n, i) =>
      token("p" + n, String(n), -4, -2 + i * 2, { number: n }),
    );
    targets = [1, 2, 3, 4].map((n, i) =>
      target(
        "t" + n,
        String(n),
        2.7 + (i % 2) * 1.7,
        -1.2 + Math.floor(i / 2) * 2.1,
        { number: n, filled: n !== 3 },
      ),
    );
  } else if (kind === "ack") {
    tokens = [1, 2, 3].map((n, i) =>
      token("a" + n, "Recebi " + n, 4, -2 + i * 2, { type: "ack" }),
    );
    targets = [target("origem", "Origem", -4, 0)];
  } else if (kind === "latest" || kind === "sensor") {
    const labels =
      kind === "latest"
        ? ["Voz antiga", "Voz antiga", "Voz atual"]
        : ["18° antiga", "21° antiga", `${22 + state.round}° atual`];
    tokens = labels.map((label, i) =>
      token("r" + state.round + "-" + i, label, -4, -2 + i * 2, {
        fresh: i === 2,
        type: kind === "sensor" ? "sensor" : "packet",
      }),
    );
    targets = [
      target("atual", kind === "sensor" ? "Painel" : "Voz ao vivo", 4, 0),
    ];
  } else if (kind === "move") {
    const marks = [
      { x: -2, z: -1 },
      { x: 2, z: -1 },
      { x: 2, z: 2 },
    ];
    tokens = [
      token("player", "Você", state.player.x, state.player.z, {
        type: "player",
      }),
    ];
    const mark = marks[Math.min(state.checkpoint, 2)];
    targets = [
      target(
        "checkpoint",
        ["A", "B", "C"][Math.min(state.checkpoint, 2)],
        mark.x,
        mark.z,
      ),
    ];
  } else if (kind === "final") {
    tokens = [
      token("f1", "Arquivo 1", -5, -2, { number: 1, file: true }),
      token("f2", "Arquivo 2", -3.2, -2, { number: 2, file: true }),
      token("f3", "Arquivo 3", -5, 0, { number: 3, file: true }),
      token("old", "Posição antiga", -3.2, 0, { fresh: false }),
      token("now", "Posição atual", -4, 2, { fresh: true }),
    ];
    targets = [1, 2, 3].map((n, i) =>
      target("file" + n, "TCP " + n, 2.5 + i * 1.5, -1.5, {
        number: n,
        file: true,
      }),
    );
    targets.push(target("live", "UDP · agora", 4, 1.7, { live: true }));
  }
  return { tokens, targets };
}
export function actOnLevel(index, state, action) {
  const level = LEVELS[index];
  if (!level || state.index !== index || state.done.length >= level.goal)
    return {
      state,
      ok: false,
      complete: !!level && state.done.length >= level.goal,
    };
  const objects = levelObjects(index, state);
  const item = objects.tokens.find((t) => t.id === action.id);
  const dest = objects.targets.find((t) => t.id === action.target);
  const fail = (message) => ({ state, ok: false, message });
  let key = action.id,
    next = { ...state },
    visual = { id: action.id, target: action.target };
  if (level.kind === "move") {
    if (
      action.type !== "move" ||
      !Number.isFinite(action.dx) ||
      !Number.isFinite(action.dz) ||
      Math.abs(action.dx) + Math.abs(action.dz) !== 1
    )
      return fail("Use as setas para chegar ao marcador.");
    const player = {
      x: Math.max(-5, Math.min(5, state.player.x + action.dx)),
      z: Math.max(-2, Math.min(2, state.player.z + action.dz)),
    };
    next = { ...state, player, moves: state.moves + 1 };
    if (next.moves !== 3) next.echo = { ...player };
    const marker = objects.targets[0];
    const reached = Math.hypot(player.x - marker.x, player.z - marker.z) < 0.55;
    if (reached)
      next = {
        ...next,
        checkpoint: state.checkpoint + 1,
        done: [...state.done, "checkpoint" + state.checkpoint],
      };
    return {
      state: next,
      ok: true,
      complete: next.done.length >= level.goal,
      message:
        next.moves === 3
          ? "Uma atualização se perdeu. Continue: a próxima será mais recente."
          : reached
            ? "Posição alcançada! Siga para o próximo marcador."
            : "Uma nova posição foi enviada.",
      visual: { move: true, player, loss: next.moves === 3 },
    };
  }
  if (action.type === "deliver") {
    if (level.kind !== "assemble" || !state.done.includes("p3"))
      return fail(
        "Ainda falta uma parte. Recupere a parte 3 antes de entregar.",
      );
    key = "arquivo";
    next.delivered = true;
    visual = { deliver: true };
  } else {
    if (!item || state.done.includes(item.id))
      return fail("Escolha uma peça disponível.");
    if (level.kind === "send" || level.kind === "stream") {
      if (action.type !== "send") return fail("Clique no pacote para enviar.");
      visual.target = "destino";
      visual.loss = level.kind === "stream" && item.id === "p3";
      visual.confirm = level.kind === "send";
    } else if (level.kind === "order") {
      if (!dest || dest.number !== item.number)
        return fail(
          `A parte ${item.number} deve ficar no espaço ${item.number}.`,
        );
    } else if (level.kind === "retry" || level.kind === "assemble") {
      if (item.number !== 3 || dest?.number !== 3)
        return fail(
          "A parte que falta é a 3. Leve uma nova cópia dela ao espaço 3.",
        );
      visual.confirm = true;
    } else if (level.kind === "ack") {
      if (dest?.id !== "origem")
        return fail("A confirmação deve voltar à origem.");
    } else if (level.kind === "latest" || level.kind === "sensor") {
      if (!item.fresh)
        return fail(
          "Esse dado é antigo. Procure o que está marcado como atual.",
        );
      if (dest?.id !== "atual" && level.kind === "sensor")
        return fail("Leve a leitura atual para o painel.");
      visual.target = "atual";
      next.round = state.round + 1;
    } else if (level.kind === "final") {
      if (item.file && (!dest?.file || dest.number !== item.number))
        return fail(
          "Monte todas as partes do arquivo na rota TCP, nos espaços correspondentes.",
        );
      if (!item.file && (!item.fresh || !dest?.live))
        return fail("Na rota UDP, leve a posição atual ao espaço “agora”.");
      visual.confirm = !!item.file;
    }
  }
  if (state.done.includes(key)) return fail("Essa ação já foi concluída.");
  next = { ...next, done: [...state.done, key] };
  return {
    state: next,
    ok: true,
    complete: next.done.length >= level.goal,
    message: visual.loss
      ? "A parte 3 se perdeu. Continue enviando os próximos."
      : visual.confirm
        ? "O dado chegou e a confirmação voltou."
        : "Boa! Continue com o próximo.",
    visual,
  };
}
export function readGame(storage, name) {
  try {
    const v = JSON.parse(storage.getItem(GAME_KEY));
    return v?.version === 1 &&
      v.name === name &&
      Number.isInteger(v.level) &&
      v.level >= 0 &&
      v.level <= 10
      ? { version: 1, name, level: v.level }
      : { version: 1, name, level: 0 };
  } catch {
    return { version: 1, name, level: 0 };
  }
}
export function writeGame(storage, value) {
  try {
    storage.setItem(GAME_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
