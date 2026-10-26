import React, { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, Pause, Play } from "@phosphor-icons/react";
import { RideMap } from "./RideSimulation.jsx";
import { ROUTE, routePoint } from "./ride-model.mjs";
import { QUIZ_DURATIONS, quizSceneAt } from "./quiz-simulation.mjs";
import "./question-simulation.css";

function Packet({ n, x, y, received = false, waiting = false }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M-20 -15 L0 -25 20 -15 0 -5Z" fill={received ? "#b6e4cc" : "#b6a7f2"}/>
    <path d="M-20 -15 L0 -5 V23 L-20 12Z" fill={received ? "#14715a" : "#3012b5"}/>
    <path d="M0 -5 L20 -15 V12 L0 23Z" fill={waiting ? "#ff603d" : received ? "#389b79" : "#7455da"}/>
    <text x="0" y="9" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">{n}</text>
  </g>;
}
function FileScene({ scene }) {
  return <svg viewBox="0 0 800 220" role="img" aria-label={`Arquivo: ${scene.delivered.length} de 6 partes entregues, ${scene.buffered.length} aguardam organização`}>
    <rect x="15" y="20" width="770" height="175" rx="20" fill="#f3f0fc"/>
    <g fontFamily="Inter, sans-serif" fontSize="13" fontWeight="600" fill="#453b66"><text x="43" y="53">COMPUTADOR DE ORIGEM</text><text x="537" y="53">ARQUIVO NO DESTINO</text></g>
    <path d="M50 100 H750" stroke="#cfc6e5" strokeWidth="3" strokeDasharray="6 7"/>
    {scene.flights.map(p => <Packet key={p.n} n={p.n} x={60 + p.position * 470} y={102}/>)}
    {scene.lost && <g><circle cx="330" cy="103" r="25" fill="#ffe5dc"/><text x="330" y="110" textAnchor="middle" fill="#b63719" fontSize="20" fontWeight="700">×3</text></g>}
    {Array.from({length:6},(_,i) => <g key={i}>
      <rect x={515 + i * 40} y="135" width="33" height="37" rx="4" fill={scene.delivered.includes(i+1) ? "#3012b5" : "white"} stroke="#bfb4d7" strokeDasharray={scene.delivered.includes(i+1) ? undefined : "4 3"}/>
      <text x={531+i*40} y="160" textAnchor="middle" fill={scene.delivered.includes(i+1) ? "white" : "#777087"} fontSize="17" fontWeight="700">{i+1}</text>
    </g>)}
    {scene.buffered.map((n,i) => <Packet key={n} n={n} x={560+i*60} y={95} waiting/>)}
    <text x="50" y="164" fontFamily="Inter, sans-serif" fontSize="14" fill="#3012b5">{scene.delivered.length}/6 partes entregues em ordem</text>
    {scene.done && <text x="580" y="203" fontSize="14" fontWeight="700" fill="#14715a">ARQUIVO PRONTO ✓</text>}
  </svg>;
}
const messages = ["Equipe pronta!", "Encontre a equipe", "Na entrada da escola."];
function MessageScene({ scene }) {
  return <svg viewBox="0 0 800 240" role="img" aria-label={`Conversa: mensagens ${scene.delivered.join(", ") || "ainda não entregues"}${scene.buffered ? "; mensagem 3 aguardando" : ""}`}>
    <rect x="30" y="8" width="300" height="222" rx="18" fill="#f0ecfa" stroke="#dcd4ed"/>
    <rect x="470" y="8" width="300" height="222" rx="18" fill="#f7f5fc" stroke="#dcd4ed"/>
    <g fontFamily="Inter, sans-serif" fontSize="13" fontWeight="600" fill="#453b66"><text x="52" y="36">QUEM ENVIA</text><text x="490" y="36">CONVERSA RECEBIDA</text></g>
    {messages.map((text,i) => <g key={text}>
      <rect x="50" y={54+i*51} width="260" height="39" rx="9" fill="#3012b5"/>
      <text x="65" y={78+i*51} fontFamily="Inter, sans-serif" fontSize="14" fill="white">{i+1}. {text}</text>
      {scene.delivered.includes(i+1) && <g><rect x="490" y={54+i*51} width="260" height="39" rx="9" fill="#e7e1f7"/><text x="505" y={78+i*51} fontFamily="Inter, sans-serif" fontSize="14" fill="#30124c">{i+1}. {text}</text></g>}
    </g>)}
    <path d="M350 118 H450 M440 110 L450 118 440 126" fill="none" stroke="#a99acb" strokeWidth="3"/>
    {scene.time >= 3000 && scene.time < 5800 && <text x="400" y="98" textAnchor="middle" fontSize="14" fontWeight="700" fill="#bc381a">× trecho 2</text>}
    {scene.retry && <text x="400" y="98" textAnchor="middle" fontSize="13" fontWeight="700" fill="#3012b5">↻ reenvio</text>}
    {scene.buffered && <text x="490" y="210" fontFamily="Inter, sans-serif" fontSize="12" fill="#bc381a">Mensagem 3 em espera</text>}
  </svg>;
}
function Character({ progress, color }) {
  const point = routePoint(progress);
  return <g transform={`translate(${point.x} ${point.y})`}>
    <ellipse cy="7" rx="18" ry="7" fill="#30204f" opacity=".16"/>
    <path d="M-11 -17 L0 -24 11 -17 11 1 0 8 -11 1Z" fill={color}/>
    <path d="M-11 -17 L0 -10 11 -17 0 -24Z" fill="#b3a1ee"/>
    <path d="M-7 3 V15 M7 3 V15 M-16 -15 V-2 M16 -15 V-2" stroke="#38314b" strokeWidth="7" strokeLinecap="round"/>
    <rect x="-11" y="-40" width="22" height="21" rx="6" fill="#f2c4ab"/>
    <path d="M-11 -31 V-38 Q0 -49 11 -38 V-31" fill="#342c4b"/>
    <path d="M-5 -31 H-3 M4 -31 H6" stroke="#342c4b" strokeWidth="2"/>
  </g>;
}
function GameScene({ scene }) {
  const points = ROUTE.map(p => p.join(",")).join(" ");
  return <svg viewBox="0 0 800 235" role="img" aria-label={`Personagem real em ${Math.round(scene.realProgress*100)}% da rota; na visão do colega em ${Math.round(scene.udp.progress*100)}%`}>
    {[{x:8,title:"NO APARELHO DO JOGADOR",progress:scene.realProgress,color:"#3012b5"},{x:409,title:"NA TELA DO COLEGA",progress:scene.udp.progress,color:"#d74624"}].map(view => <g key={view.title} transform={`translate(${view.x} 0)`}>
      <rect x="0" y="10" width="383" height="215" rx="18" fill="#f3f0fb"/>
      <text x="18" y="35" fontFamily="Inter, sans-serif" fontSize="12" fontWeight="700" fill="#453b66">{view.title}</text>
      <g transform="translate(8 24) scale(.68 .58)">
        <path d="M25 60 L530 60 550 300 20 300Z" fill="#e5def5"/>
        <path d="M20 300 H550 V315 H20Z" fill="#c3b5e0"/>
        <polyline points={points} stroke="white" strokeWidth="15" fill="none" strokeLinejoin="round"/>
        <polyline points={points} stroke="#bba9dc" strokeWidth="2" strokeDasharray="6 7" fill="none"/>
        <path d="M45 110 L70 95 95 110 95 152 70 168 45 152Z M390 230 L415 215 440 230 440 272 415 288 390 272Z" fill="#b7a6d7"/>
        <path d="M470 80 V35 L500 45 470 55" stroke="#d74624" fill="#ff603d" strokeWidth="3"/>
        <Character progress={view.progress} color={view.color}/>
      </g>
    </g>)}
  </svg>;
}
export function QuestionSimulation({ kind, paused }) {
  const [elapsed,setElapsed] = useState(0);
  const [running,setRunning] = useState(false);
  const [steps,setSteps] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const elapsedRef = useRef(0);
  const scene = quizSceneAt(kind,elapsed);
  useEffect(() => { if (paused) setRunning(false); },[paused]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) setRunning(false); };
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => { if (media.matches) { setRunning(false); setSteps(true); } };
    document.addEventListener("visibilitychange",hidden); media.addEventListener("change",reduce);
    return () => { document.removeEventListener("visibilitychange",hidden); media.removeEventListener("change",reduce); };
  },[]);
  useEffect(() => {
    if (!running || paused || steps) return;
    let frame, previous = performance.now();
    const tick = now => {
      elapsedRef.current = Math.min(QUIZ_DURATIONS[kind],elapsedRef.current + now - previous); previous = now;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current >= QUIZ_DURATIONS[kind]) setRunning(false); else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  },[running,kind,steps,paused]);
  const advance = () => { elapsedRef.current = Math.min(QUIZ_DURATIONS[kind],elapsedRef.current + 1200); setElapsed(elapsedRef.current); };
  return <div className="question-simulation" aria-label="Simulação para observar antes de responder" data-time={Math.round(elapsed)} data-running={running}>
    <div className="question-scene-heading"><span>OBSERVE E ESCOLHA O PROTOCOLO</span><span>{scene.done ? "Cena concluída" : "Cena interativa"}</span></div>
    <div className={`question-scene question-scene-${kind}`}>
      {kind === "download" ? <FileScene scene={scene}/> : kind === "messages" ? <MessageScene scene={scene}/> : kind === "players" ? <GameScene scene={scene}/> : <RideMap protocol="GPS" state={scene.udp} realProgress={scene.realProgress}/>}
    </div>
    <div className="question-scene-controls">
      <button className="button primary" disabled={scene.done || paused} onClick={() => steps ? advance() : setRunning(!running)}>{running ? <Pause weight="fill"/> : <Play weight="fill"/>}{steps ? "Avançar cena" : running ? "Pausar cena" : elapsed ? "Continuar cena" : "Iniciar simulação"}</button>
      <button className="button subtle" onClick={() => {setRunning(false);elapsedRef.current=0;setElapsed(0);}} disabled={paused}><ArrowCounterClockwise/>Repetir</button>
      <label><input type="checkbox" checked={steps} disabled={paused} onChange={e => {setRunning(false);setSteps(e.target.checked);}}/>Por etapas</label>
      <span>{(elapsed/1000).toFixed(1)} s</span>
    </div>
    <p className="question-scene-status" role="status">{scene.message}</p>
    <p className="question-scene-note">Cenário didático. Observe os dados recebidos; a animação é uma escolha do aplicativo.</p>
  </div>;
}
