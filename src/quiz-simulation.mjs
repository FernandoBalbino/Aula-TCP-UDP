import { DURATION, simulationAt } from "./simulation.mjs";
import { RIDE_DURATION, rideAt } from "./ride-model.mjs";

export const QUIZ_DURATIONS = { download: DURATION.TCP, messages: 8200, players: RIDE_DURATION, ride: RIDE_DURATION };
export function quizSceneAt(kind, elapsed) {
  const duration = QUIZ_DURATIONS[kind];
  const time = Math.max(0, Math.min(duration, elapsed));
  let scene;
  if (kind === "download") {
    const data = simulationAt("TCP", time);
    scene = { ...data, message: time === 0 ? "Observe o envio das seis partes do arquivo." : data.lost ? "A parte 3 faltou. As seguintes aguardam a recuperação." : time >= 9300 ? "Parte recuperada. Arquivo completo e em ordem." : "O destino recebe e confirma as partes do arquivo." };
  } else if (kind === "messages") {
    const delivered = time >= 7200 ? [1, 2, 3] : time >= 1600 ? [1] : [];
    scene = { delivered, buffered: time >= 4200 && time < 7200, retry: time >= 5800 && time < 7200,
      message: time === 0 ? "Observe a sequência da conversa." : time >= 7200 ? "Trecho recuperado: mensagens completas, na ordem 1 → 2 → 3." : time >= 5800 ? "O trecho perdido da mensagem 2 está sendo reenviado." : time >= 4200 ? "A mensagem 3 aguarda a recuperação do trecho da mensagem 2." : time >= 3000 ? "Um trecho da mensagem 2 se perdeu no caminho." : "A primeira mensagem segue até o destino." };
  } else {
    const data = rideAt(time);
    scene = { ...data, message: time === 0 ? "Observe o movimento real e as posições recebidas." : data.udp.arrived ? "O destino recebeu a posição final. As posições perdidas não foram recuperadas." : data.udp.discarded ? "Uma posição antiga chegou depois: o app mantém a mais recente." : time >= 6400 ? "Chegou uma posição mais recente. O ícone salta para ela." : time >= 4000 ? "Faltaram atualizações: o ícone para, mas o movimento real continua." : "As posições chegam como atualizações separadas." };
  }
  return { ...scene, time, duration, done: time >= duration };
}
