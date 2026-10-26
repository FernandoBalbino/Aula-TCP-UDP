import test from "node:test";
import assert from "node:assert/strict";
import {
  QUESTIONS,
  STORAGE_KEY,
  answerQuestion,
  loadAttempt,
  newAttempt,
  nextQuestion,
  normalizeAttempt,
  parseRoute,
  resultOf,
  saveAttempt,
} from "../src/lesson.mjs";
import {
  DURATION,
  LOSS_TIME,
  RETRY_ARRIVAL,
  RETRY_START,
  nextStep,
  simulationAt,
} from "../src/simulation.mjs";
import { POSITION_COUNT, POSITION_GAP, RIDE_DURATION, ROUTE, rideAt, rideStep, routePoint } from "../src/ride-model.mjs";
import { QUIZ_DURATIONS, quizSceneAt } from "../src/quiz-simulation.mjs";

test("atividade conserva dez situações, seis escritas e quatro simulações com escolhas equilibradas", () => {
  const simulated = QUESTIONS.filter(q => q.simulation);
  assert.equal(simulated.length, 4);
  assert.equal(QUESTIONS.filter(q => !q.simulation).length, 6);
  assert.deepEqual(new Set(simulated.map(q => q.simulation)), new Set(["download", "messages", "players", "ride"]));
  for (const protocol of ["TCP", "UDP"]) assert.equal(simulated.filter(q => q.answer === protocol).length, 2);
  for (const q of simulated) {
    assert.equal(quizSceneAt(q.simulation, 0).done, false);
    const end = quizSceneAt(q.simulation, QUIZ_DURATIONS[q.simulation]);
    assert.equal(end.done, true);
    assert.ok(end.message.length > 20);
  }
});
test("cenas de arquivo e mensagens aguardam perdas e só entregam a sequência completa após recuperar", () => {
  assert.deepEqual(quizSceneAt("download", 6300).delivered, [1, 2]);
  assert.deepEqual(quizSceneAt("download", 10800).delivered, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(quizSceneAt("messages", 5000).delivered, [1]);
  assert.equal(quizSceneAt("messages", 5000).buffered, true);
  assert.equal(quizSceneAt("messages", 6500).retry, true);
  assert.deepEqual(quizSceneAt("messages", 7200).delivered, [1, 2, 3]);
});
test("cenas do personagem e da moto mostram atualização atual sem recuperar posições perdidas", () => {
  for (const kind of ["players", "ride"]) {
    assert.equal(quizSceneAt(kind, 6000).udp.sequence, 2);
    assert.equal(quizSceneAt(kind, 6400).udp.sequence, 5);
    assert.equal(quizSceneAt(kind, 9800).udp.sequence, 7);
    assert.equal(quizSceneAt(kind, 9800).udp.discarded, true);
  }
});

test("corrida UDP mantém posição durante a perda, salta à atual e rejeita atualização antiga", () => {
  const before = rideAt(2800).udp;
  assert.equal(before.sequence, 2);
  assert.deepEqual(rideAt(6300).udp, before);
  assert.equal(rideAt(6400).udp.sequence, 5);
  assert.equal(rideAt(8800).udp.sequence, 7);
  const stale = rideAt(9800).udp;
  assert.equal(stale.sequence, 7, "a posição 6 atrasada não faz o mapa voltar");
  assert.equal(stale.discarded, true);
});
test("corrida TCP recupera perdas sem saltar trechos, com possível atraso da reprodução", () => {
  assert.equal(rideAt(5000).tcp.waiting, true);
  assert.equal(rideAt(5000).tcp.sequence, 2);
  assert.equal(rideAt(6400).udp.sequence, 5);
  assert.equal(rideAt(6400).tcp.sequence, 2);
  let previous = 0;
  for (let time = 0; time <= RIDE_DURATION; time += 10) {
    const current = rideAt(time).tcp.progress;
    assert.ok(current >= previous, "o mapa nunca volta");
    assert.ok(current - previous <= 10 / POSITION_GAP / POSITION_COUNT + 1e-9, "a animação não pula posições");
    previous = current;
  }
  assert.equal(rideAt(14800).udp.arrived, true);
  assert.equal(rideAt(14800).tcp.arrived, false);
  assert.equal(rideAt(RIDE_DURATION).tcp.arrived, true);
  assert.equal(rideAt(RIDE_DURATION).done, true);
});
test("ambos os mapas terminam no mesmo destino e etapas chegam ao final", () => {
  assert.deepEqual([routePoint(0).x, routePoint(0).y], ROUTE[0]);
  for (const protocol of ["tcp", "udp"]) {
    const end = rideAt(RIDE_DURATION)[protocol];
    assert.equal(end.progress, 1);
    assert.equal(end.sequence, POSITION_COUNT);
    const point = routePoint(end.progress);
    assert.deepEqual([point.x, point.y], ROUTE.at(-1));
  }
  let time = 0;
  while (time < RIDE_DURATION) {
    const next = rideStep(time);
    assert.ok(next > time);
    time = next;
  }
  assert.equal(time, RIDE_DURATION);
  assert.deepEqual(rideAt(-100), rideAt(0));
  assert.deepEqual(rideAt(Infinity), rideAt(RIDE_DURATION));
});

test("10 questões com cinco TCP, cinco UDP e IDs únicos", () => {
  assert.equal(QUESTIONS.length, 10);
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, 10);
  for (const protocol of ["TCP", "UDP"])
    assert.equal(QUESTIONS.filter((q) => q.answer === protocol).length, 5);
  for (const q of QUESTIONS)
    assert.ok(q.text.length > 40 && q.explanation.length > 40);
});
for (const target of [0, 5, 10])
  test(`resultado de ${target * 10} pontos e revisão das dez respostas`, () => {
    let attempt = newAttempt("Aluna Teste");
    for (const [i, q] of QUESTIONS.entries()) {
      const answer = i < target ? q.answer : q.answer === "TCP" ? "UDP" : "TCP";
      attempt = answerQuestion(attempt, answer);
      assert.equal(attempt.answers[q.id], answer);
      const locked = answerQuestion(attempt, answer === "TCP" ? "UDP" : "TCP");
      assert.equal(
        locked,
        attempt,
        "uma resposta não pode ser substituída ou pontuada duas vezes",
      );
      attempt = nextQuestion(attempt);
    }
    assert.deepEqual(resultOf(attempt), {
      correct: target,
      wrong: 10 - target,
      answered: 10,
      score: target * 10,
    });
    assert.equal(attempt.index, 10);
    assert.deepEqual(
      normalizeAttempt(JSON.parse(JSON.stringify(attempt))),
      attempt,
    );
    assert.deepEqual(resultOf(newAttempt(attempt.name)), {
      correct: 0,
      wrong: 0,
      answered: 0,
      score: 0,
    });
  });
test("não avança sem resposta; mantém feedback e progresso após salvar", () => {
  let attempt = newAttempt("<img src=x onerror=alert(1)>");
  assert.equal(nextQuestion(attempt), attempt);
  attempt = answerQuestion(attempt, "TCP");
  let stored;
  const storage = {
    getItem: (k) => (k === STORAGE_KEY ? stored : null),
    setItem: (k, v) => {
      assert.equal(k, STORAGE_KEY);
      stored = v;
    },
  };
  assert.equal(saveAttempt(storage, attempt), true);
  assert.deepEqual(loadAttempt(storage), { available: true, attempt });
  assert.equal(
    loadAttempt(storage).attempt.index,
    0,
    "feedback da primeira resposta continua visível",
  );
  assert.equal(nextQuestion(loadAttempt(storage).attempt).index, 1);
});
test("armazenamento bloqueado ou corrompido tem recuperação segura", () => {
  const broken = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  };
  assert.equal(loadAttempt(broken).available, false);
  assert.equal(saveAttempt(broken, newAttempt()), false);
  assert.equal(loadAttempt({ getItem: () => "{broken" }).available, false);
  assert.deepEqual(
    normalizeAttempt({ version: 99, name: "Teste" }),
    newAttempt(),
  );
  const gap = normalizeAttempt({
    version: 1,
    name: "  Aluno  ",
    index: 999,
    answers: { instalador: "TCP", documento: "TCP" },
  });
  assert.equal(gap.name, "Aluno");
  assert.equal(gap.index, 1);
  assert.equal(Object.keys(gap.answers).length, 1);
});
test("rotas por hash funcionam nos nove slides e na atividade", () => {
  for (let n = 1; n <= 9; n++)
    assert.deepEqual(parseRoute(`#/slides/${n}`), {
      mode: "slides",
      slide: n - 1,
    });
  assert.equal(parseRoute("#/atividade").mode, "quiz");
  assert.deepEqual(parseRoute("#/slides/999"), { mode: "slides", slide: 0 });
});
test("mesma velocidade de envio nos dois protocolos e perda no pacote 3", () => {
  for (const t of [500, 1600, 2200])
    assert.deepEqual(
      simulationAt("TCP", t).flights,
      simulationAt("UDP", t).flights,
    );
  for (const p of ["TCP", "UDP"]) assert.ok(simulationAt(p, LOSS_TIME).lost);
});
test("TCP guarda partes posteriores até a retransmissão e depois entrega em ordem", () => {
  const missing = simulationAt("TCP", 6300);
  assert.deepEqual(missing.delivered, [1, 2]);
  assert.deepEqual(missing.buffered, [4, 5, 6]);
  assert.ok(missing.lost);
  assert.ok(missing.acks.length > 0);
  const retry = simulationAt("TCP", RETRY_START + 400);
  assert.ok(retry.flights.some((p) => p.n === 3 && p.retry));
  const recovered = simulationAt("TCP", RETRY_ARRIVAL);
  assert.deepEqual(recovered.delivered, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(recovered.buffered, []);
  assert.equal(recovered.lost, false);
  assert.ok(recovered.acks.some((a) => a.through === 6));
});
test("UDP termina com cinco pacotes sem confirmações ou recuperação automática", () => {
  const end = simulationAt("UDP", DURATION.UDP);
  assert.deepEqual(end.delivered, [1, 2, 4, 5, 6]);
  assert.deepEqual(end.acks, []);
  assert.deepEqual(end.buffered, []);
  assert.equal(end.done, true);
  assert.ok(end.lost);
  assert.deepEqual(simulationAt("UDP", 100000), end);
});
test("modo por etapas alcança os finais sem saltar a perda ou retransmissão", () => {
  for (const protocol of ["TCP", "UDP"]) {
    let t = 0;
    const seen = [];
    while (t < DURATION[protocol]) {
      const next = nextStep(protocol, t);
      assert.ok(next > t);
      t = next;
      seen.push(t);
    }
    assert.ok(seen.includes(LOSS_TIME));
    assert.equal(t, DURATION[protocol]);
    if (protocol === "TCP") {
      assert.ok(seen.includes(RETRY_START));
      assert.ok(seen.includes(RETRY_ARRIVAL));
    }
  }
});
