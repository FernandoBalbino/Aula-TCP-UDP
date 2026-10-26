import React, { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, ArrowRight, CheckCircle, MapPin, Pause, Play } from "@phosphor-icons/react";
import { RIDE_DURATION, ROUTE, rideAt, rideStep, routePoint } from "./ride-model.mjs";
import "./ride.css";

const blocks = [
  [52, 55, 76, 58, 16], [150, 55, 70, 58, 28], [243, 58, 62, 55, 20],
  [385, 20, 65, 30, 14], [390, 118, 62, 60, 25], [478, 130, 40, 55, 18],
  [49, 150, 80, 60, 22], [235, 207, 66, 65, 30], [382, 222, 68, 55, 24],
];
const routeLine = ROUTE.map(p => p.join(",")).join(" ");
function Building({ block }) {
  const [x, y, w, d, h] = block;
  return <g>
    <path d={`M${x},${y} l${w},0 0,${d} -${w},0Z`} fill="#c8c1e1" />
    <path d={`M${x + w},${y} l12,-${h} 0,${d} -12,${h}Z`} fill="#b6accf" />
    <path d={`M${x},${y} l12,-${h} ${w},0 -12,${h}Z`} fill="#fff" />
    <path d={`M${x + 13},${y + 13} h${w - 26} M${x + 13},${y + 24} h${w - 26}`} stroke="#eeeaf7" strokeWidth="3" />
  </g>;
}
export function RideMap({ protocol, state, realProgress }) {
  const p = routePoint(state.progress);
  const real = routePoint(realProgress);
  const id = `ride-${protocol}`;
  const color = protocol === "TCP" ? "#3012b5" : protocol === "UDP" ? "#d74624" : "#202035";
  return <svg className="ride-map" viewBox="0 0 560 330" role="img" aria-label={`Mapa fictício ${protocol}: moto em ${Math.round(state.progress * 100)}% do trajeto`}>
    <defs>
      <linearGradient id={`${id}-ground`} x2="0.6" y2="1"><stop stopColor="#f8f7fd"/><stop offset="1" stopColor="#e5e0f2"/></linearGradient>
      <filter id={`${id}-shadow`} x="-60%" y="-60%" width="220%" height="240%"><feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#30204f" floodOpacity=".25"/></filter>
    </defs>
    <path d="M15 27 Q15 15 30 15 H525 Q545 15 545 35 V298 L530 316 H30 L15 300Z" fill="#d6cde8"/>
    <rect x="15" y="15" width="530" height="285" rx="20" fill={`url(#${id}-ground)`}/>
    <path d="M30 128 H530 M30 235 H530 M153 30 V290 M365 30 V290" stroke="white" strokeWidth="23"/>
    <rect x="44" y="272" width="78" height="17" rx="8" fill="#c2ddce"/>
    <rect x="405" y="190" width="92" height="17" rx="8" fill="#c2ddce"/>
    {blocks.map((b, i) => <Building key={i} block={b}/>)}
    <polyline points={routeLine} fill="none" stroke="white" strokeWidth="29" strokeLinejoin="round" strokeLinecap="round"/>
    <polyline points={routeLine} fill="none" stroke={color} strokeOpacity=".17" strokeWidth="16" strokeLinejoin="round" strokeLinecap="round"/>
    <polyline points={routeLine} fill="none" stroke={color} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
    <g fill="white" stroke={color} strokeWidth="3"><circle cx="90" cy="260" r="8"/><rect x="473" y="73" width="14" height="14" rx="2"/></g>
    <g fontFamily="Inter, sans-serif" fontSize="12" fontWeight="600" fill="#40384f">
      <text x="57" y="294">Embarque</text><text x="458" y="48">Destino</text>
      <text x="234" y="190" fontSize="10" fill="#776d8b">Av. dos Estudos</text>
    </g>
    <circle cx={real.x} cy={real.y} r="15" fill="none" stroke="#14715a" strokeWidth="2" strokeDasharray="4 3" opacity=".8"/>
    <g transform={`translate(${p.x} ${p.y})`} data-vehicle={protocol} data-progress={state.progress.toFixed(4)}>
      <ellipse cy="9" rx="25" ry="8" fill="#2d1b4b" opacity=".18"/>
      <circle r="25" fill="white" opacity=".94"/>
      <image href={`${import.meta.env.BASE_URL}assets/uber-moto.webp`} x="-36" y="-38" width="72" height="62" filter={`url(#${id}-shadow)`}/>
      <rect x="-21" y="23" width="42" height="18" rx="9" fill={color}/>
      <text y="36" textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="10" fill="white">{protocol}</text>
    </g>
  </svg>;
}
function RideCard({ protocol, state, realProgress, started }) {
  const tcp = protocol === "TCP";
  const message = state.arrived ? "Moto no destino" : !started ? "Aguardando início da corrida" : tcp
    ? state.waiting ? "Aguardando a posição perdida…" : "Reproduzindo as posições em sequência"
    : state.discarded ? "Posição antiga descartada pelo app" : "O mapa usa a última posição recebida";
  return <article className={`ride-card ${tcp ? "ride-tcp" : "ride-udp"}`}>
    <div className="ride-card-top"><span className="ride-app-name">Uber <b>Moto</b></span><span className="ride-protocol">{protocol}</span></div>
    <div className="ride-card-title"><h3>{tcp ? "Cada posição, em ordem" : "A posição mais atual"}</h3><span>{Math.round(state.progress * 100)}%</span></div>
    <RideMap protocol={protocol} state={state} realProgress={realProgress}/>
    <div className="ride-card-bottom">
      <div><MapPin size={21} weight="duotone"/><p>Escola Modelo <ArrowRight size={15}/> Praça do Saber<span>Trajeto fictício · Maceió</span></p><strong>#{String(state.sequence).padStart(2, "0")}</strong></div>
      <p className="ride-live-message">{state.arrived && <CheckCircle weight="fill"/>}{message}</p>
    </div>
    <div className="ride-explanation"><b>{tcp ? "TCP + animação contínua" : "UDP + atualização direta"}</b><p>{tcp ? "Recupera perdas. O app anima as posições em ordem e pode ficar atrasado." : "Se faltam posições, a moto para no mapa e salta quando chega uma nova."}</p></div>
  </article>;
}
export function RideSimulation({ active }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [stepMode, setStepMode] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const elapsedRef = useRef(0);
  const data = rideAt(elapsed);
  useEffect(() => { if (!active) setRunning(false); }, [active]);
  useEffect(() => {
    const pauseHidden = () => { if (document.hidden) setRunning(false); };
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => { if (media.matches) { setStepMode(true); setRunning(false); } };
    document.addEventListener("visibilitychange", pauseHidden);
    media.addEventListener("change", reduce);
    return () => { document.removeEventListener("visibilitychange", pauseHidden); media.removeEventListener("change", reduce); };
  }, []);
  useEffect(() => {
    if (!running || !active || stepMode) return;
    let frame, previous = performance.now();
    const tick = now => {
      elapsedRef.current = Math.min(RIDE_DURATION, elapsedRef.current + now - previous);
      previous = now;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= RIDE_DURATION) setRunning(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, active, stepMode]);
  const reset = () => { setRunning(false); elapsedRef.current = 0; setElapsed(0); };
  const advance = () => { elapsedRef.current = rideStep(elapsedRef.current); setElapsed(elapsedRef.current); };
  return <section className="slide ride-slide" aria-label="Uma corrida, dois protocolos" data-running={running} data-time={Math.round(elapsed)}>
    <div className="ride-heading"><div><p className="eyebrow">08 / A MESMA CORRIDA, DOIS MAPAS</p><h2>Onde está a <em>moto agora?</em></h2></div><span className="ride-demo-tag">SIMULAÇÃO DE APLICATIVO</span></div>
    <p className="ride-intro">A moto faz o mesmo trajeto. Veja como cada mapa mostra as posições recebidas.</p>
    <div className="ride-comparison">{["TCP", "UDP"].map(protocol => <RideCard key={protocol} protocol={protocol} state={data[protocol.toLowerCase()]} realProgress={data.realProgress} started={elapsed > 0}/>)}</div>
    <div className="ride-controls">
      <button className="button primary" disabled={data.done} onClick={() => stepMode ? advance() : setRunning(!running)}>{running ? <Pause weight="fill"/> : <Play weight="fill"/>}{stepMode ? "Próxima posição" : running ? "Pausar corrida" : elapsed > 0 ? "Continuar corrida" : "Iniciar corrida"}</button>
      <button className="button subtle" onClick={reset}><ArrowCounterClockwise/>Reiniciar</button>
      <label className="ride-step-toggle"><input type="checkbox" checked={stepMode} onChange={e => { setRunning(false); setStepMode(e.target.checked); }}/>Por etapas</label>
      <span className="ride-real-legend"><i/>Posição real da moto</span>
      <span className="ride-timer">{(elapsed / 1000).toFixed(1)} s / {Math.ceil(RIDE_DURATION / 1000)} s</span>
    </div>
    <p className="ride-summary" role="status">{data.done ? "Mesmo destino! TCP recuperou as posições; UDP seguiu com as mais recentes." : "Observe: a moto continua na rua, mesmo quando o ícone fica parado no aplicativo."}</p>
    <p className="ride-caveat">Exemplo didático, sem conexão com a Uber. Suavizar o movimento e descartar posições antigas são escolhas do app; TCP/UDP não definem a animação. Não representa os protocolos usados pela Uber.</p>
  </section>;
}
