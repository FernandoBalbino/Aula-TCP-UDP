import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowCounterClockwise,
  CheckCircle,
  Package,
  Pause,
  Play,
  Trophy,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  LEVELS,
  actOnLevel,
  initialLevel,
  levelObjects,
  readGame,
  writeGame,
} from "./game-model.mjs";
import "./game.css";

export function Game({ name, quizScore, unlocked, onReturn }) {
  const [saved] = useState(() => {
    try {
      return readGame(localStorage, name);
    } catch {
      return { version: 1, name, level: 0 };
    }
  });
  const [phase, setPhase] = useState(saved.level),
    [levelState, setLevelState] = useState(() =>
      initialLevel(Math.min(saved.level, 9)),
    );
  const stateRef = useRef(levelState),
    phaseRef = useRef(phase),
    alive = useRef(true),
    labels = useRef(new Map()),
    host = useRef(null),
    stage = useRef(null),
    drag = useRef(null);
  const [ready, setReady] = useState(false),
    [progress, setProgress] = useState(0),
    [loadText, setLoadText] = useState("Carregando o motor 3D"),
    [failure, setFailure] = useState("");
  const [lite, setLite] = useState(false),
    [cycle, setCycle] = useState(0),
    [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(false),
    busyRef = useRef(false);
  const [complete, setComplete] = useState(false),
    [paused, setPaused] = useState(false),
    [message, setMessage] = useState(""),
    [canSave, setCanSave] = useState(true);
  const finished = phase >= 10,
    level = LEVELS[Math.min(phase, 9)],
    objects = levelObjects(Math.min(phase, 9), levelState);
  stateRef.current = levelState;
  phaseRef.current = phase;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!unlocked || finished || lite) return;
    let cancelled = false,
      created;
    setReady(false);
    setFailure("");
    setProgress(0.04);
    (async () => {
      try {
        const module = await import("./game-renderer.js");
        if (cancelled) return;
        setProgress(0.26);
        setLoadText("Preparando fontes e elementos do jogo");
        await document.fonts.ready;
        if (cancelled) return;
        created = await module.createGameStage(host.current, {
          labelFor: (id) => labels.current.get(id),
          onProgress: (value, text) => {
            if (!cancelled) {
              setProgress(value);
              setLoadText(text);
            }
          },
          onContextLost: () => {
            if (!cancelled) {
              setPaused(true);
              setFailure(
                "O ambiente 3D foi interrompido. Você pode continuar no modo leve.",
              );
            }
          },
          reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
        });
        if (cancelled) {
          created.dispose();
          return;
        }
        stage.current = created;
        created.configure(phaseRef.current, stateRef.current);
        setProgress(1);
        setReady(true);
      } catch (error) {
        if (!cancelled) {
          setFailure(
            "Não foi possível iniciar o ambiente 3D neste navegador. Você pode tentar novamente ou continuar no modo leve.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      created?.dispose();
      if (stage.current === created) stage.current = null;
    };
  }, [unlocked, finished, lite, cycle]);
  useEffect(() => {
    stage.current?.pause(paused || !!failure);
  }, [paused, failure]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);
  function save(nextLevel) {
    try {
      if (!writeGame(localStorage, { version: 1, name, level: nextLevel }))
        setCanSave(false);
    } catch {
      setCanSave(false);
    }
  }
  async function perform(action) {
    if (busyRef.current || !ready || paused || complete) return;
    const result = actOnLevel(phaseRef.current, stateRef.current, action);
    setSelected(null);
    stage.current?.select(null);
    if (!result.ok) {
      if (action.id) stage.current?.snap(action.id);
      setMessage(result.message || "Essa ação já foi concluída.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setMessage(result.message);
    try {
      if (stage.current) await stage.current.animate(result.visual);
    } finally {
      if (!alive.current) return;
      stateRef.current = result.state;
      setLevelState(result.state);
      stage.current?.configure(phaseRef.current, result.state);
      busyRef.current = false;
      setBusy(false);
      if (result.complete) {
        setComplete(true);
        save(phaseRef.current + 1);
      }
    }
  }
  const performRef = useRef(perform);
  performRef.current = perform;
  useEffect(() => {
    const keys = {
      ArrowLeft: [-1, 0],
      a: [-1, 0],
      A: [-1, 0],
      ArrowRight: [1, 0],
      d: [1, 0],
      D: [1, 0],
      ArrowUp: [0, -1],
      w: [0, -1],
      W: [0, -1],
      ArrowDown: [0, 1],
      s: [0, 1],
      S: [0, 1],
    };
    const key = (e) => {
      if (
        level.kind !== "move" ||
        !keys[e.key] ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.target.closest("input,textarea")
      )
        return;
      e.preventDefault();
      const [dx, dz] = keys[e.key];
      performRef.current({ type: "move", dx, dz });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [level.kind]);
  function pressToken(item) {
    if (busy || paused || complete || !ready) return;
    if (["send", "stream", "latest"].includes(level.kind))
      perform({ type: "send", id: item.id });
    else {
      setSelected(item.id);
      stage.current?.select(item.id);
      setMessage("Agora clique no destino indicado ou arraste a peça até ele.");
    }
  }
  function down(e, item) {
    if (busy || paused || complete || !ready || item.type === "player") return;
    drag.current = { id: item.id, x: e.clientX, y: e.clientY, moved: false };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }
  function moving(e) {
    const d = drag.current;
    if (!d || ["send", "stream", "latest"].includes(level.kind) || lite) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 7) d.moved = true;
    if (d.moved) stage.current?.drag(d.id, e.clientX, e.clientY);
  }
  function up(e, item) {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (d.moved) {
      const dest = stage.current?.drop(item.id);
      if (dest) perform({ type: "place", id: item.id, target: dest });
      else {
        stage.current?.snap(item.id);
        setMessage("Solte a peça sobre o espaço de destino.");
      }
    } else pressToken(item);
  }
  function nextPhase() {
    const next = phase + 1;
    const fresh = initialLevel(Math.min(next, 9));
    phaseRef.current = next;
    stateRef.current = fresh;
    setPhase(next);
    setLevelState(fresh);
    setSelected(null);
    setMessage("");
    setComplete(false);
    setPaused(false);
    if (next < 10) stage.current?.configure(next, fresh);
  }
  function restartPhase() {
    const fresh = initialLevel(phase);
    stateRef.current = fresh;
    setLevelState(fresh);
    setSelected(null);
    setMessage("");
    setComplete(false);
    setPaused(false);
    stage.current?.configure(phase, fresh);
  }
  function newGame() {
    save(0);
    setPhase(0);
    setLevelState(initialLevel(0));
    stateRef.current = initialLevel(0);
    phaseRef.current = 0;
    setComplete(false);
    setMessage("");
    setPaused(false);
    setReady(lite);
  }
  const labelRef = (id) => (el) => {
    if (el) labels.current.set(id, el);
    else labels.current.delete(id);
  };
  if (!unlocked)
    return (
      <main className="game-lock">
        <Package size={70} />
        <h1>Uma etapa de cada vez</h1>
        <p>Conclua as dez questões para abrir as dez fases do jogo.</p>
        <button className="button primary" onClick={onReturn}>
          Voltar à atividade
          <ArrowLeft />
        </button>
      </main>
    );
  if (finished)
    return (
      <main className="game-finish">
        <p className="eyebrow">DEZ FASES CONCLUÍDAS</p>
        <Trophy size={90} weight="duotone" />
        <h1>
          Você levou
          <br />a ideia <em>mais longe.</em>
        </h1>
        <p>
          {name}, você organizou partes, recuperou perdas e acompanhou dados em
          tempo real.
        </p>
        <div className="finish-facts">
          <span>
            <strong>TCP</strong>Confirma, recupera e entrega em ordem.
          </span>
          <span>
            <strong>UDP</strong>Sem confirmação ou recuperação obrigatórias.
          </span>
        </div>
        <p className="game-quiz-score">
          Sua atividade: {quizScore} / 100 pontos · Jogo: 10 / 10 fases
        </p>
        <div>
          <button className="button primary" onClick={newGame}>
            Jogar novamente
            <ArrowCounterClockwise />
          </button>
          <button className="text-button" onClick={onReturn}>
            <ArrowLeft />
            Voltar ao resultado
          </button>
        </div>
      </main>
    );
  return (
    <main
      className={"game-shell " + (lite ? "game-lite" : "")}
      data-level={phase + 1}
      data-kind={level.kind}
      data-ready={ready}
      data-busy={busy}
    >
      <header className="game-header">
        <button className="text-button" onClick={onReturn}>
          <ArrowLeft />
          Resultado
        </button>
        <span>
          MISSÃO DOS PACOTES <b>EM JOGO</b>
        </span>
        <div>
          <button
            className="icon-button"
            aria-label="Reiniciar fase"
            onClick={restartPhase}
            disabled={!ready || busy}
          >
            <ArrowCounterClockwise />
          </button>
          <button
            className="icon-button"
            aria-label={paused ? "Continuar jogo" : "Pausar jogo"}
            onClick={() => setPaused((v) => !v)}
            disabled={!ready || busy}
          >
            {paused ? <Play /> : <Pause />}
          </button>
        </div>
      </header>
      <section className="game-titlebar">
        <div>
          <p className="eyebrow">
            FASE {String(phase + 1).padStart(2, "0")} <span>/ 10</span>{" "}
            <b>{level.protocol}</b>
          </p>
          <h1>{level.title}</h1>
        </div>
        <p>{level.instruction}</p>
      </section>
      <div className={"game-world " + (lite ? "lite-world" : "")} ref={host}>
        <div
          className="game-object-labels"
          aria-label="Peças e destinos da fase"
        >
          {objects.tokens.map((item) =>
            item.type === "player" ? (
              <span
                className="game-object player-label"
                ref={labelRef(item.id)}
                key={item.id}
              >
                Você
                {lite && ` (${levelState.player.x}, ${levelState.player.z})`}
              </span>
            ) : (
              <button
                key={item.id}
                ref={labelRef(item.id)}
                className={
                  "game-object packet-label " +
                  (selected === item.id ? "chosen " : "") +
                  (item.fresh ? "fresh" : "")
                }
                aria-label={`Pacote ${item.label}`}
                disabled={
                  !ready ||
                  busy ||
                  paused ||
                  complete ||
                  levelState.done.includes(item.id)
                }
                onPointerDown={(e) => down(e, item)}
                onPointerMove={moving}
                onPointerUp={(e) => up(e, item)}
                onPointerCancel={() => {
                  stage.current?.snap(item.id);
                  drag.current = null;
                }}
                onClick={(e) => {
                  if (e.detail === 0) pressToken(item);
                }}
              >
                {lite && <Package weight="duotone" />}
                {item.label}
                {selected === item.id && (
                  <span className="sr-only"> selecionado</span>
                )}
              </button>
            ),
          )}
          {objects.targets.map((item) => (
            <button
              key={item.id}
              ref={labelRef(item.id)}
              className={
                "game-object target-label " + (item.filled ? "filled" : "")
              }
              aria-label={`Destino ${item.label}`}
              disabled={
                !ready ||
                busy ||
                paused ||
                complete ||
                item.filled ||
                level.kind === "move"
              }
              onClick={() => {
                if (selected)
                  perform({ type: "place", id: selected, target: item.id });
                else setMessage("Escolha primeiro uma peça para mover.");
              }}
            >
              {item.filled && <CheckCircle weight="fill" />}
              {item.label}
            </button>
          ))}
        </div>
        {level.kind === "move" && ready && !complete && (
          <div className="move-controls" aria-label="Controles do jogador">
            {[
              { dx: 0, dz: -1, label: "Mover para cima", Icon: ArrowUp },
              {
                dx: -1,
                dz: 0,
                label: "Mover para a esquerda",
                Icon: ArrowLeft,
              },
              { dx: 0, dz: 1, label: "Mover para baixo", Icon: ArrowDown },
              { dx: 1, dz: 0, label: "Mover para a direita", Icon: ArrowRight },
            ].map(({ dx, dz, label, Icon }) => (
              <button
                key={label}
                aria-label={label}
                disabled={busy || paused}
                onClick={() => perform({ type: "move", dx, dz })}
              >
                <Icon />
              </button>
            ))}
          </div>
        )}
        {(!ready || failure) && (
          <div className="game-load" role="status">
            {failure ? (
              <>
                <WarningCircle size={48} />
                <h2>Vamos por outro caminho</h2>
                <p>{failure}</p>
                <div>
                  <button
                    className="button primary"
                    onClick={() => {
                      stage.current?.dispose();
                      stage.current = null;
                      setFailure("");
                      setPaused(false);
                      setLite(true);
                      setReady(true);
                    }}
                  >
                    Continuar no modo leve
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      setFailure("");
                      setCycle((v) => v + 1);
                    }}
                  >
                    Tentar 3D novamente
                  </button>
                </div>
              </>
            ) : (
              <>
                <Package size={52} weight="duotone" />
                <p className="eyebrow">PREPARANDO A VIAGEM</p>
                <h2>Quase na sua mão.</h2>
                <div
                  className="game-load-track"
                  role="progressbar"
                  aria-label="Carregamento do jogo"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                >
                  <span style={{ width: `${progress * 100}%` }} />
                </div>
                <p>
                  {loadText} <b>{Math.round(progress * 100)}%</b>
                </p>
              </>
            )}
            <button className="text-button" onClick={onReturn}>
              <ArrowLeft />
              Voltar ao resultado
            </button>
          </div>
        )}
        {paused && ready && !failure && !complete && (
          <div className="game-pause">
            <Pause size={44} />
            <h2>Uma pausa na viagem</h2>
            <p>Retome quando estiver pronto.</p>
            <button className="button primary" onClick={() => setPaused(false)}>
              Continuar jogo
              <Play />
            </button>
          </div>
        )}
        {complete && (
          <section className="level-complete" role="status">
            <CheckCircle size={38} weight="fill" />
            <div>
              <p className="eyebrow">FASE CONCLUÍDA</p>
              <h2>Boa entrega.</h2>
              <p>{level.lesson}</p>
              <button className="button orange" onClick={nextPhase}>
                {phase === 9 ? "Concluir a viagem" : "Próxima fase"}
                <ArrowRight />
              </button>
            </div>
          </section>
        )}
      </div>
      <footer className="game-footer">
        <div
          className="game-phase-dots"
          aria-label={`${phase} fases anteriores concluídas`}
        >
          {LEVELS.map((_, i) => (
            <span
              key={i}
              className={i < phase ? "done" : i === phase ? "current" : ""}
            />
          ))}
        </div>
        <p role="status">
          {!canSave
            ? "Seu progresso fica nesta aba: o navegador não permitiu salvar."
            : message ||
              "Clique para escolher. Arraste ou clique no destino para mover."}
        </p>
        {level.kind === "assemble" ? (
          <button
            className="button primary deliver-file"
            disabled={
              !levelState.done.includes("p3") || busy || complete || paused
            }
            onClick={() => perform({ type: "deliver" })}
          >
            Entregar arquivo
            <ArrowRight />
          </button>
        ) : (
          <span className="game-goal">
            {levelState.done.length}
            <span> / {level.goal}</span>
          </span>
        )}
      </footer>
    </main>
  );
}
