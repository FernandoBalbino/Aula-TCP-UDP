import test from "node:test";
import assert from "node:assert/strict";
import {
  LEVELS,
  GAME_KEY,
  initialLevel,
  actOnLevel,
  levelObjects,
  readGame,
  writeGame,
} from "../src/game-model.mjs";
const action = (state, input) => actOnLevel(state.index, state, input);
function solve(index) {
  let state = initialLevel(index);
  const act = (input) => {
    const result = action(state, input);
    assert.equal(result.ok, true, JSON.stringify(input));
    state = result.state;
    return result;
  };
  if (index === 0)
    for (let n = 1; n <= 3; n++) act({ type: "send", id: "p" + n });
  if (index === 1)
    for (const n of [3, 1, 2])
      act({ type: "place", id: "p" + n, target: "t" + n });
  if (index === 2) act({ type: "place", id: "p3", target: "t3" });
  if (index === 3)
    for (let n = 1; n <= 3; n++)
      act({ type: "place", id: "a" + n, target: "origem" });
  if (index === 4) {
    act({ type: "place", id: "p3", target: "t3" });
    act({ type: "deliver" });
  }
  if (index === 5)
    for (let n = 1; n <= 6; n++) act({ type: "send", id: "p" + n });
  if (index === 6 || index === 8)
    for (let n = 0; n < 3; n++)
      act({
        type: index === 6 ? "send" : "place",
        id: "r" + n + "-2",
        target: "atual",
      });
  if (index === 7) {
    for (let n = 0; n < 3; n++) act({ type: "move", dx: 0, dz: -1 });
    for (let n = 0; n < 2; n++) act({ type: "move", dx: 1, dz: 0 });
    for (let n = 0; n < 4; n++) act({ type: "move", dx: 1, dz: 0 });
    for (let n = 0; n < 3; n++) act({ type: "move", dx: 0, dz: 1 });
  }
  if (index === 9) {
    for (let n = 1; n <= 3; n++)
      act({ type: "place", id: "f" + n, target: "file" + n });
    act({ type: "place", id: "now", target: "live" });
  }
  assert.equal(state.done.length, LEVELS[index].goal);
  return state;
}
test("dez fases com objetivos práticos distintos e todos os objetos identificáveis", () => {
  assert.equal(LEVELS.length, 10);
  assert.ok(new Set(LEVELS.map((l) => l.kind)).size >= 9);
  for (let i = 0; i < 10; i++) {
    const o = levelObjects(i, initialLevel(i));
    const ids = [...o.tokens, ...o.targets].map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(o.tokens.length && o.targets.length);
  }
});
for (let i = 0; i < 10; i++)
  test(`fase ${i + 1}: ${LEVELS[i].title} é solucionável e não conclui duas vezes`, () => {
    const solved = solve(i);
    const after = action(solved, { type: "send", id: "p1" });
    assert.equal(after.ok, false);
    assert.equal(after.complete, true);
    assert.equal(after.state, solved);
  });
test("erros de espaço, parte ausente e entrega incompleta conservam a fase", () => {
  const order = initialLevel(1);
  assert.equal(
    action(order, { type: "place", id: "p3", target: "t1" }).state,
    order,
  );
  const retry = initialLevel(2);
  assert.equal(
    action(retry, { type: "place", id: "p1", target: "t3" }).ok,
    false,
  );
  const file = initialLevel(4);
  assert.equal(action(file, { type: "deliver" }).ok, false);
  assert.equal(
    action(file, { type: "place", id: "missing", target: "t3" }).ok,
    false,
  );
});
test("UDP permite continuar depois da perda sem fabricar confirmação", () => {
  let state = initialLevel(5);
  for (let n = 1; n <= 6; n++) {
    const r = action(state, { type: "send", id: "p" + n });
    assert.equal(!!r.visual.loss, n === 3);
    assert.equal(r.visual.confirm, false);
    state = r.state;
  }
  assert.equal(state.done.length, 6);
});
test("voz e sensor recusam dado antigo e aceitam o mais recente em três rodadas", () => {
  for (const i of [6, 8]) {
    const s = initialLevel(i);
    assert.equal(
      action(s, { type: "place", id: "r0-0", target: "atual" }).ok,
      false,
    );
    assert.equal(s.round, 0);
    solve(i);
  }
});
test("posição perdida permanece antiga até uma atualização seguinte; movimento tem limites", () => {
  let s = initialLevel(7);
  for (let n = 0; n < 2; n++)
    s = action(s, { type: "move", dx: 1, dz: 0 }).state;
  const previous = { ...s.echo };
  let r = action(s, { type: "move", dx: 1, dz: 0 });
  s = r.state;
  assert.equal(r.visual.loss, true);
  assert.deepEqual(s.echo, previous);
  assert.notDeepEqual(s.echo, s.player);
  s = action(s, { type: "move", dx: 1, dz: 0 }).state;
  assert.deepEqual(s.echo, s.player);
  for (let n = 0; n < 20; n++)
    s = action(s, { type: "move", dx: 1, dz: 0 }).state;
  assert.equal(s.player.x, 5);
  assert.equal(action(s, { type: "move", dx: 100, dz: 0 }).ok, false);
});
test("fase final exige arquivo completo na rota TCP e posição atual na UDP", () => {
  const s = initialLevel(9);
  assert.equal(
    action(s, { type: "place", id: "f1", target: "live" }).ok,
    false,
  );
  assert.equal(
    action(s, { type: "place", id: "old", target: "live" }).ok,
    false,
  );
  assert.equal(
    action(s, { type: "place", id: "now", target: "file1" }).ok,
    false,
  );
  solve(9);
});
test("progresso do jogo é local, separado da nota e vinculado ao nome", () => {
  let saved;
  const storage = {
    getItem: (key) => (key === GAME_KEY ? saved : null),
    setItem: (key, value) => {
      assert.equal(key, GAME_KEY);
      saved = value;
    },
  };
  const value = { version: 1, name: "Ana", level: 6 };
  assert.equal(writeGame(storage, value), true);
  assert.deepEqual(readGame(storage, "Ana"), value);
  assert.equal(readGame(storage, "João").level, 0);
  saved = JSON.stringify({ ...value, level: 99 });
  assert.equal(readGame(storage, "Ana").level, 0);
  const blocked = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  };
  assert.equal(writeGame(blocked, value), false);
  assert.equal(readGame(blocked, "Ana").level, 0);
});
