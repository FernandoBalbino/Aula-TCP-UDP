import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsOut,
  ArrowsIn,
  BookOpen,
  CheckCircle,
  Desktop,
  DownloadSimple,
  FileText,
  GameController,
  Headset,
  Image,
  MapPin,
  Microphone,
  Package,
  Pause,
  Play,
  Radio,
  ArrowCounterClockwise,
  SealCheck,
  ShieldCheck,
  Trophy,
  WarningCircle,
  WifiHigh,
  X,
} from "@phosphor-icons/react";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import {
  QUESTIONS,
  answerQuestion,
  loadAttempt,
  newAttempt,
  nextQuestion,
  parseRoute,
  resultOf,
  saveAttempt,
} from "./lesson.mjs";
import { DURATION, nextStep, simulationAt } from "./simulation.mjs";
import { Game } from "./Game.jsx";
import { RideSimulation } from "./RideSimulation.jsx";
import { QuestionSimulation } from "./QuestionSimulation.jsx";

const asset = (name) => import.meta.env.BASE_URL + "assets/" + name;
const ICONS = {
  download: DownloadSimple,
  voice: Microphone,
  file: FileText,
  game: GameController,
  image: Image,
  position: MapPin,
  sensor: Radio,
};
const TITLES = [
  "TCP vs. UDP",
  "Como os dados viajam?",
  "O que é TCP?",
  "O que é UDP?",
  "TCP e UDP lado a lado",
  "Exemplos do cotidiano",
  "Veja os pacotes viajando",
  "Uma corrida, dois protocolos",
  "O que ficou da viagem?",
];
const goSlide = (n) => {
  location.hash = "/slides/" + (n + 1);
};
const goQuiz = () => {
  location.hash = "/atividade";
};
function Label({ children }) {
  return <p className="eyebrow">{children}</p>;
}
function Point({ icon: Icon, title, children }) {
  return (
    <div className="point">
      <span className="point-icon">
        <Icon size={26} weight="bold" />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}
function PacketRow({ count = 6 }) {
  return (
    <div className="packet-row" aria-label={`${count} partes numeradas`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>
          <Package weight="duotone" />
          <b>{i + 1}</b>
        </span>
      ))}
    </div>
  );
}

function SlideContent({ slide, hasAttempt }) {
  if (slide === 0)
    return (
      <section className="cover slide" aria-label={TITLES[0]}>
        <div className="cover-copy">
          <Label>REDES DE COMPUTADORES · AULA INTERATIVA</Label>
          <h1>
            TCP <span className="versus">vs.</span>
            <br />
            <em>UDP</em>
          </h1>
          <p className="cover-subtitle">
            Como as informações
            <br />
            viajam pela internet?
          </p>
          <button className="button orange" onClick={() => goSlide(1)}>
            Começar a viagem <ArrowRight weight="bold" />
          </button>
        </div>
        <div className="cover-art">
          <span className="chapter-tag">01 / 09</span>
          <img
            src={asset("computadores.png")}
            alt="Dois computadores trocando pequenos pacotes roxos e laranja"
          />
          <div className="cover-caption">
            <Package size={24} />
            <p>
              Uma mensagem. Muitos pacotes.
              <br />
              <strong>Dois jeitos de transportar.</strong>
            </p>
          </div>
        </div>
      </section>
    );
  if (slide === 1)
    return (
      <section className="slide split" aria-label={TITLES[1]}>
        <div className="slide-copy">
          <Label>02 / O CAMINHO DA INFORMAÇÃO</Label>
          <h2>
            Como os dados
            <br />
            <em>viajam?</em>
          </h2>
          <p className="lead">
            Uma informação pode ser dividida em partes menores: os{" "}
            <strong>pacotes de dados.</strong>
          </p>
          <p>
            Imagine uma encomenda separada em várias caixas. Cada caixa carrega
            uma parte do conteúdo.
          </p>
          <div className="inline-note">
            <Package size={30} />
            <span>No destino, as partes formam a informação.</span>
          </div>
        </div>
        <div className="parcel-art">
          <img
            src={asset("encomendas.png")}
            alt="Uma encomenda dividida em cinco caixas com detalhes roxos e laranja"
          />
          <div className="mini-route">
            <Desktop />
            <ArrowRight />
            <PacketRow count={5} />
            <ArrowRight />
            <Desktop />
          </div>
          <p className="caption">
            Origem <span>pacotes em viagem</span> Destino
          </p>
        </div>
      </section>
    );
  if (slide === 2)
    return (
      <section className="slide split protocol-slide" aria-label={TITLES[2]}>
        <div className="slide-copy">
          <Label>03 / ENTREGA CONFIÁVEL</Label>
          <h2>
            O que é <em>TCP?</em>
          </h2>
          <p className="lead">
            Confere o recebimento e entrega os dados <strong>em ordem.</strong>
          </p>
          <div className="points">
            <Point icon={CheckCircle} title="Confirma">
              O destino avisa quais dados recebeu.
            </Point>
            <Point icon={ArrowCounterClockwise} title="Retransmite">
              Uma parte perdida pode ser enviada de novo.
            </Point>
            <Point icon={SealCheck} title="Organiza">
              As partes são entregues na ordem correta.
            </Point>
          </div>
        </div>
        <aside className="feature-panel purple">
          <DownloadSimple size={88} weight="duotone" />
          <Label>EXEMPLO DO DIA A DIA</Label>
          <h3>
            Baixar um
            <br />
            arquivo completo
          </h3>
          <PacketRow />
          <p>Precisamos de todas as partes para usar o arquivo.</p>
          <div className="feature-foot">
            <WarningCircle />
            Uma falha de conexão ainda pode interromper a transferência.
          </div>
        </aside>
      </section>
    );
  if (slide === 3)
    return (
      <section className="slide split protocol-slide" aria-label={TITLES[3]}>
        <div className="slide-copy">
          <Label>04 / O ENVIO CONTINUA</Label>
          <h2>
            O que é <em>UDP?</em>
          </h2>
          <p className="lead">
            Envia dados sem exigir confirmação ou retransmissão{" "}
            <strong>pelo próprio protocolo.</strong>
          </p>
          <div className="points">
            <Point icon={ArrowRight} title="Envia os próximos">
              O envio não depende de uma confirmação obrigatória.
            </Point>
            <Point icon={Package} title="Pode faltar uma parte">
              O UDP não recupera a perda por conta própria.
            </Point>
          </div>
          <p className="small-fact">
            A aplicação pode acrescentar seus próprios recursos.
          </p>
        </div>
        <aside className="feature-panel orange-panel">
          <Headset size={88} weight="duotone" />
          <Label>EXEMPLO DO DIA A DIA</Label>
          <h3>
            Uma conversa
            <br />
            de voz ao vivo
          </h3>
          <p>
            Um pequeno corte pode incomodar menos que esperar por um trecho de
            áudio antigo.
          </p>
          <div className="feature-foot">
            <Microphone />
            Nesse cenário, o áudio atual é o que importa.
          </div>
        </aside>
      </section>
    );
  if (slide === 4)
    return (
      <section className="slide compare-slide" aria-label={TITLES[4]}>
        <Label>05 / RECURSOS DIFERENTES</Label>
        <h2>
          TCP e UDP <em>lado a lado</em>
        </h2>
        <table className="comparison">
          <thead>
            <tr>
              <th scope="col">O que comparar?</th>
              <th scope="col">TCP</th>
              <th scope="col">UDP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Confirmação</th>
              <td>Confirma dados recebidos.</td>
              <td>Não exige confirmação.</td>
            </tr>
            <tr>
              <th scope="row">Parte perdida</th>
              <td>Pode retransmitir.</td>
              <td>Não retransmite por conta própria.</td>
            </tr>
            <tr>
              <th scope="row">Ordem dos dados</th>
              <td>Entrega em ordem.</td>
              <td>Não garante a ordem de chegada.</td>
            </tr>
            <tr>
              <th scope="row">Exemplos de uso</th>
              <td>Transferir arquivos completos.</td>
              <td>Áudio e atualizações em tempo real.</td>
            </tr>
          </tbody>
        </table>
        <p className="comparison-note">
          <WarningCircle size={25} />
          UDP não é sempre mais rápido. O resultado depende da rede e da
          aplicação.
        </p>
      </section>
    );
  if (slide === 5)
    return (
      <section className="slide examples-slide" aria-label={TITLES[5]}>
        <Label>06 / DA IDEIA À PRÁTICA</Label>
        <h2>
          Exemplos do <em>cotidiano</em>
        </h2>
        <div className="example-list">
          <div>
            <DownloadSimple />
            <h3>Download</h3>
            <p>Todas as partes do arquivo importam.</p>
            <strong>Recursos do TCP</strong>
          </div>
          <div>
            <FileText />
            <h3>Documentos</h3>
            <p>É preciso receber o conteúdo completo.</p>
            <strong>Recursos do TCP</strong>
          </div>
          <div>
            <Headset />
            <h3>Voz ao vivo</h3>
            <p>Um trecho recente pode ser mais útil que recuperar o antigo.</p>
            <strong>UDP pode ser adequado</strong>
          </div>
          <div>
            <GameController />
            <h3>Posições no jogo</h3>
            <p>Uma atualização nova pode substituir a que faltou.</p>
            <strong>UDP pode ser adequado</strong>
          </div>
        </div>
        <div className="wide-callout">
          <WifiHigh size={36} />
          <p>
            A escolha depende da aplicação. Um mesmo serviço pode combinar TCP,
            UDP e tecnologias construídas sobre eles.
          </p>
        </div>
      </section>
    );
  return (
    <section className="slide review-slide" aria-label={TITLES[8]}>
      <div className="review-copy">
        <Label>09 / PARA LEVAR COM VOCÊ</Label>
        <h2>
          O que ficou
          <br />
          da <em>viagem?</em>
        </h2>
        <p className="lead">
          Os protocolos oferecem recursos diferentes para transportar dados.
        </p>
        <button className="button orange" onClick={goQuiz}>
          {hasAttempt
            ? "Continuar atividade prática"
            : "Iniciar atividade prática"}
          <ArrowRight weight="bold" />
        </button>
        <span className="activity-detail">
          10 situações · até 100 pontos · no seu ritmo
        </span>
      </div>
      <div className="review-facts">
        <div className="review-fact">
          <span>TCP</span>
          <p>Confirma, retransmite e entrega os dados em ordem.</p>
          <ShieldCheck />
        </div>
        <div className="review-fact">
          <span>UDP</span>
          <p>
            Envia sem confirmação ou retransmissão obrigatórias pelo protocolo.
          </p>
          <ArrowRight />
        </div>
        <p className="review-reminder">
          Pense na necessidade: receber tudo ou acompanhar o que está
          acontecendo agora?
        </p>
      </div>
    </section>
  );
}

function Simulation({ active }) {
  const [protocol, setProtocol] = useState("TCP");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [stepMode, setStepMode] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const timeRef = useRef(0);
  const data = simulationAt(protocol, elapsed);
  useEffect(() => {
    if (!active) setRunning(false);
  }, [active]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      if (query.matches) {
        setStepMode(true);
        setRunning(false);
      }
    };
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!running || !active || stepMode) return;
    let frame;
    let previous = performance.now();
    const tick = (now) => {
      timeRef.current = Math.min(
        DURATION[protocol],
        timeRef.current + now - previous,
      );
      previous = now;
      setElapsed(timeRef.current);
      if (timeRef.current >= DURATION[protocol]) setRunning(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, active, protocol, stepMode]);
  const reset = () => {
    setRunning(false);
    setElapsed(0);
    timeRef.current = 0;
  };
  const advance = () => {
    const t = nextStep(protocol, timeRef.current);
    timeRef.current = t;
    setElapsed(t);
  };
  return (
    <section
      className="slide simulation-slide"
      aria-label={TITLES[6]}
      data-protocol={protocol}
      data-running={running}
      data-time={Math.round(elapsed)}
    >
      <div className="simulation-heading">
        <div>
          <Label>07 / OBSERVE O QUE MUDA</Label>
          <h2>
            Veja os pacotes <em>viajando</em>
          </h2>
        </div>
        <div
          className="protocol-picker"
          role="group"
          aria-label="Protocolo da simulação"
        >
          {["TCP", "UDP"].map((p) => (
            <button
              key={p}
              aria-pressed={protocol === p}
              onClick={() => {
                reset();
                setProtocol(p);
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div
        className="network-stage"
        aria-label={`Simulação ${protocol}: o pacote 3 se perde no primeiro envio`}
      >
        <div className="computer origin">
          <Desktop weight="duotone" />
          <strong>Origem</strong>
          <small>Envia as partes</small>
        </div>
        <div className="network-lanes">
          <div className="lane-label">
            <span>ENVIO DE DADOS</span>
            <ArrowRight />
          </div>
          <div className="data-lane">
            {data.flights.map((p) => (
              <div
                className={"moving-packet " + (p.retry ? "retry" : "")}
                key={p.n}
                style={{ left: `${p.position * 88}%` }}
              >
                <Package weight="duotone" />
                <b>{p.n}</b>
                {p.retry && <small>reenvio</small>}
              </div>
            ))}
            {data.lost && (
              <span className="loss-marker">
                <X weight="bold" />3 perdido
              </span>
            )}
          </div>
          <div className="ack-lane">
            {data.acks.map((a) => (
              <div
                className="ack"
                key={a.n}
                style={{ left: `${(1 - a.position) * 80}%` }}
              >
                <CheckCircle weight="fill" />
                <span>Recebido até {a.through}</span>
                <ArrowLeft />
              </div>
            ))}
            {protocol === "UDP" && (
              <span className="no-ack">Sem confirmação obrigatória</span>
            )}
          </div>
        </div>
        <div className="computer destination">
          <Desktop weight="duotone" />
          <strong>Destino</strong>
          <small>Recebe as partes</small>
        </div>
      </div>
      <div className="receive-row">
        <span>{protocol === "TCP" ? "Entregues em ordem" : "Recebidos"}:</span>
        <div className="received-packets">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <span
              key={n}
              className={
                data.delivered.includes(n)
                  ? "received"
                  : data.buffered.includes(n)
                    ? "buffered"
                    : data.lost && n === 3
                      ? "missing"
                      : ""
              }
            >
              {n}
              {data.delivered.includes(n) && <CheckCircle weight="fill" />}
            </span>
          ))}
        </div>
        <p>
          {data.buffered.length
            ? `${data.buffered.join(", ")} aguardam a parte 3`
            : data.done
              ? protocol === "TCP"
                ? "Todas as partes chegaram."
                : "A parte 3 continua faltando."
              : "Acompanhe a chegada das partes."}
        </p>
      </div>
      <p className="simulation-message" role="status">
        {data.message}
      </p>
      <div className="simulation-controls">
        <button
          className="button primary"
          disabled={data.done}
          onClick={() => {
            if (stepMode) advance();
            else setRunning((r) => !r);
          }}
        >
          {stepMode ? (
            <ArrowRight />
          ) : running ? (
            <Pause weight="fill" />
          ) : (
            <Play weight="fill" />
          )}
          {stepMode
            ? elapsed
              ? "Próxima etapa"
              : "Iniciar por etapas"
            : running
              ? "Pausar"
              : elapsed
                ? "Continuar"
                : "Iniciar"}
        </button>
        <button className="button subtle" onClick={reset}>
          <ArrowCounterClockwise />
          Reiniciar
        </button>
        <label className="step-toggle">
          <input
            type="checkbox"
            checked={stepMode}
            onChange={(e) => {
              setRunning(false);
              setStepMode(e.target.checked);
            }}
          />
          Avançar por etapas
        </label>
        <span className="timing-note">
          Representação didática. Tempos ilustrativos.
        </span>
      </div>
    </section>
  );
}

function Quiz({ attempt, setAttempt, storageAvailable, onStartGame }) {
  const [name, setName] = useState(attempt.name);
  const [editing, setEditing] = useState(!attempt.name);
  const question = QUESTIONS[attempt.index],
    result = resultOf(attempt),
    answer = question && attempt.answers[question.id];
  const Icon = ICONS[question?.icon] || Package;
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, [attempt.index, editing]);
  return (
    <main className="quiz-page">
      <header className="quiz-header">
        <button className="text-button" onClick={() => goSlide(8)}>
          <ArrowLeft />
          Voltar aos slides
        </button>
        <span>MISSÃO DOS PACOTES</span>
        <span className="quiz-score">
          <Trophy weight="fill" />
          {result.score} pontos
        </span>
      </header>
      {!storageAvailable && (
        <p className="storage-warning" role="status">
          <WarningCircle />O navegador não está salvando o progresso. A
          atividade funciona enquanto esta aba estiver aberta.
        </p>
      )}
      {editing ? (
        <section className="quiz-welcome">
          <div>
            <Label>AGORA É COM VOCÊ</Label>
            <h1>
              Missão dos
              <br />
              <em>Pacotes</em>
            </h1>
            <p className="lead">
              TCP ou UDP?
              <br />
              Escolha o protocolo em 10 situações do cotidiano.
            </p>
            <p>
              Cada acerto vale 10 pontos. Você recebe uma explicação a cada
              resposta. São seis questões escritas e quatro com simulações.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                setAttempt(newAttempt(name.trim().slice(0, 60)));
                setEditing(false);
              }
            }}
          >
            <Package weight="duotone" size={64} />
            <h2 ref={heading} tabIndex={-1}>
              Como você se chama?
            </h2>
            <label htmlFor="student-name">Seu nome</label>
            <input
              id="student-name"
              autoComplete="given-name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              required
            />
            <button className="button primary" disabled={!name.trim()}>
              Iniciar missão
              <ArrowRight />
            </button>
            <p>Sem cadastro. Seu progresso fica neste navegador.</p>
          </form>
        </section>
      ) : attempt.index < 10 ? (
        <section className={"question-screen" + (question.simulation ? " has-simulation" : "")}>
          <div className="question-topline">
            <span>Olá, {attempt.name}</span>
            <span>Questão {attempt.index + 1} de 10</span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Progresso da atividade"
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={result.answered}
          >
            <span style={{ width: `${result.answered * 10}%` }} />
          </div>
          <div className="question-content">
            <span className="question-icon">
              <Icon size={46} weight="duotone" />
            </span>
            <h1 ref={heading} tabIndex={-1}>
              {question.title}
            </h1>
            <p>{question.text}</p>
            {question.simulation && <QuestionSimulation key={question.id} kind={question.simulation} paused={!!answer}/>}
            <div
              className="answer-options"
              role="group"
              aria-label="Escolha o protocolo"
            >
              {["TCP", "UDP"].map((p) => (
                <button
                  key={p}
                  disabled={!!answer}
                  className={
                    (answer === p ? "selected " : "") +
                    (answer && p === question.answer ? "correct" : "")
                  }
                  onClick={() => setAttempt((a) => answerQuestion(a, p))}
                >
                  <span>{p}</span>
                  <ArrowRight />
                </button>
              ))}
            </div>
            <div className="feedback-slot">
              {answer && (
                <div
                  className={
                    "feedback " +
                    (answer === question.answer ? "success" : "explain")
                  }
                  role="status"
                >
                  <div>
                    {answer === question.answer ? (
                      <CheckCircle size={28} weight="fill" />
                    ) : (
                      <BookOpen size={28} />
                    )}
                    <strong>
                      {answer === question.answer
                        ? "Acertou! +10 pontos"
                        : `Vamos entender: ${question.answer}`}
                    </strong>
                  </div>
                  <p>{question.explanation}</p>
                  <button
                    className="button primary"
                    onClick={() => setAttempt(nextQuestion)}
                  >
                    {attempt.index === 9
                      ? "Ver meu resultado"
                      : "Próxima situação"}
                    <ArrowRight />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="result-screen">
          <div className="result-summary">
            <Label>ATIVIDADE CONCLUÍDA · AGORA VEM O JOGO</Label>
            <Trophy size={80} weight="duotone" />
            <h1 ref={heading} tabIndex={-1}>
              Boa viagem,
              <br />
              <em>{attempt.name}!</em>
            </h1>
            <div className="final-score">
              {result.score}
              <span>/ 100 pontos</span>
            </div>
            <p>
              {result.correct} acertos <span>·</span> {result.wrong} erros
            </p>
            <button
              className="button primary start-game-button"
              onClick={onStartGame}
            >
              Iniciar jogo
              <Play weight="fill" />
            </button>
            <p className="game-invitation">
              Dez fases para colocar TCP e UDP em prática.
            </p>
            <button
              className="button subtle"
              onClick={() => setAttempt(newAttempt(attempt.name))}
            >
              Refazer atividade
              <ArrowCounterClockwise />
            </button>
            <button className="text-button" onClick={() => goSlide(8)}>
              <ArrowLeft />
              Voltar aos slides
            </button>
          </div>
          <div className="answer-review">
            <h2>Confira sua viagem</h2>
            <p>
              Releia as explicações e perceba o que cada situação precisava.
            </p>
            {QUESTIONS.map((q, i) => (
              <article key={q.id}>
                <div className="review-answer-top">
                  <span>
                    {i + 1}. {q.title}
                  </span>
                  {attempt.answers[q.id] === q.answer ? (
                    <CheckCircle weight="fill" />
                  ) : (
                    <BookOpen />
                  )}
                </div>
                <p>
                  Sua escolha: <strong>{attempt.answers[q.id]}</strong> ·
                  Resposta: <strong>{q.answer}</strong>
                </p>
                <p>{q.explanation}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export function App() {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  const [initial] = useState(() => {
    try {
      return loadAttempt(window.localStorage);
    } catch {
      return { attempt: newAttempt(), available: false };
    }
  });
  const [attempt, setAttempt] = useState(initial.attempt);
  const [storageAvailable, setStorageAvailable] = useState(initial.available);
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const sources = useRef(null),
    title = useRef(null);
  useEffect(() => {
    const change = () => setRoute(parseRoute(location.hash));
    const full = () => setFullscreen(!!document.fullscreenElement);
    window.addEventListener("hashchange", change);
    document.addEventListener("fullscreenchange", full);
    return () => {
      window.removeEventListener("hashchange", change);
      document.removeEventListener("fullscreenchange", full);
    };
  }, []);
  useEffect(() => {
    const handler = (e) => {
      if (
        route.mode !== "slides" ||
        sources.current?.open ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.target.closest('input,textarea,select,[contenteditable="true"]')
      )
        return;
      if (["ArrowRight", "PageDown"].includes(e.key)) {
        e.preventDefault();
        goSlide(Math.min(TITLES.length - 1, route.slide + 1));
      }
      if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        goSlide(Math.max(0, route.slide - 1));
      }
      if (e.key === "Home") {
        e.preventDefault();
        goSlide(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        goSlide(8);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [route]);
  useEffect(() => {
    try {
      if (!saveAttempt(window.localStorage, attempt))
        setStorageAvailable(false);
    } catch {
      setStorageAvailable(false);
    }
  }, [attempt]);
  useEffect(() => {
    document.title =
      route.mode === "game"
        ? "Missão dos Pacotes — Jogo 3D"
        : route.mode === "quiz"
          ? "Missão dos Pacotes — TCP ou UDP?"
          : TITLES[route.slide] + " — Aula interativa";
    title.current?.focus();
  }, [route]);
  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreen(false);
    }
  };
  return (
    <>
      <div className="lesson" hidden={route.mode !== "slides"}>
        <header className="lesson-header">
          <button
            className="lesson-brand"
            onClick={() => goSlide(0)}
            aria-label="Voltar à capa"
          >
            <Package weight="duotone" size={27} />
            <span>COMO OS DADOS VIAJAM</span>
          </button>
          <div className="header-tools">
            <button className="text-button" onClick={goQuiz}>
              Atividade prática
              <ArrowRight />
            </button>
            <button
              className="icon-button"
              onClick={toggleFull}
              aria-label={
                fullscreen ? "Sair da tela cheia" : "Apresentar em tela cheia"
              }
              title={
                fullscreen ? "Sair da tela cheia" : "Apresentar em tela cheia"
              }
            >
              {fullscreen ? <ArrowsIn /> : <ArrowsOut />}
            </button>
          </div>
        </header>
        <main className="deck-content">
          <span className="sr-only" role="status" ref={title} tabIndex={-1}>
            Slide {route.slide + 1} de {TITLES.length}: {TITLES[route.slide]}
          </span>
          {route.slide !== 6 && route.slide !== 7 && (
            <div className="slide-transition" key={route.slide}>
              <SlideContent slide={route.slide} hasAttempt={!!attempt.name} />
            </div>
          )}
          <div hidden={route.slide !== 6}>
            <Simulation active={route.mode === "slides" && route.slide === 6} />
          </div>
          <div hidden={route.slide !== 7}>
            <RideSimulation active={route.mode === "slides" && route.slide === 7} />
          </div>
        </main>
        <footer className="lesson-footer">
          <button
            className="text-button source-button"
            onClick={() => sources.current.showModal()}
          >
            <BookOpen />
            Fontes e aula
          </button>
          <nav aria-label="Slides" className="slide-dots">
            {TITLES.map((text, i) => (
              <button
                key={text}
                className={route.slide === i ? "active" : ""}
                aria-label={`Slide ${i + 1}: ${text}`}
                aria-current={route.slide === i ? "step" : undefined}
                onClick={() => goSlide(i)}
              >
                <span />
              </button>
            ))}
          </nav>
          <div className="slide-navigation">
            <button
              className="icon-button"
              onClick={() => goSlide(route.slide - 1)}
              disabled={route.slide === 0}
              aria-label="Slide anterior"
            >
              <ArrowLeft />
            </button>
            <span>
              <b>{String(route.slide + 1).padStart(2, "0")}</b> / {String(TITLES.length).padStart(2, "0")}
            </span>
            <button
              className="icon-button next"
              onClick={() => goSlide(route.slide + 1)}
              disabled={route.slide === TITLES.length - 1}
              aria-label="Próximo slide"
            >
              <ArrowRight />
            </button>
          </div>
        </footer>
      </div>
      {route.mode === "quiz" && (
        <Quiz
          attempt={attempt}
          setAttempt={setAttempt}
          storageAvailable={storageAvailable}
          onStartGame={() => {
            location.hash = "/jogo";
          }}
        />
      )}
      {route.mode === "game" && (
        <Game
          name={attempt.name}
          quizScore={resultOf(attempt).score}
          unlocked={attempt.index >= 10}
          onReturn={goQuiz}
        />
      )}
      <dialog ref={sources} className="sources-dialog">
        <button
          className="icon-button close-dialog"
          aria-label="Fechar fontes"
          onClick={() => sources.current.close()}
        >
          <X />
        </button>
        <Label>APRENDER COM CLAREZA</Label>
        <h2>Sobre esta aula</h2>
        <p>
          Conteúdo básico para o Ensino Médio Técnico. Os desenhos são
          representações didáticas, com tempos ilustrativos.
        </p>
        <h3>Fontes oficiais</h3>
        <a
          href="https://www.rfc-editor.org/rfc/rfc9293.html"
          target="_blank"
          rel="noreferrer"
        >
          RFC 9293 — Transmission Control Protocol (TCP)
          <ArrowRight />
        </a>
        <a
          href="https://www.rfc-editor.org/rfc/rfc768.html"
          target="_blank"
          rel="noreferrer"
        >
          RFC 768 — User Datagram Protocol (UDP)
          <ArrowRight />
        </a>
        <h3>Uma aula de aproximadamente 60 minutos</h3>
        <p>
          30 min de conceitos e exemplos, 10 min de simulação, 5 min de revisão
          e 15 min de atividade.
        </p>
        <p className="muted">
          A pontuação é individual e fica neste navegador. Diferentes aplicações
          podem acrescentar recursos sobre TCP e UDP.
        </p>
      </dialog>
    </>
  );
}
