export const TRAVEL_MS = 1800;
export const GAP_MS = 900;
export const LOSS_TIME = 2 * GAP_MS + TRAVEL_MS * 0.55;
export const RETRY_START = 7500;
export const RETRY_ARRIVAL = RETRY_START + TRAVEL_MS;
export const DURATION = { TCP: 10800, UDP: 6800 };
export function nextStep(protocol, elapsed) {
  const steps =
    protocol === "TCP"
      ? [0, 1800, 2700, LOSS_TIME, 4500, 6300, 7500, 9300, 10800]
      : [0, 1800, 2700, LOSS_TIME, 4500, 6300, 6800];
  return steps.find((t) => t > elapsed + 1) ?? DURATION[protocol];
}
export function simulationAt(protocol, elapsed) {
  const tcp = protocol === "TCP";
  const t = Math.max(0, Math.min(elapsed, DURATION[protocol]));
  const arrived = [1, 2, 4, 5, 6].filter(
    (n) => t >= (n - 1) * GAP_MS + TRAVEL_MS,
  );
  if (tcp && t >= RETRY_ARRIVAL) arrived.push(3);
  arrived.sort((a, b) => a - b);
  const delivered =
    tcp && t < RETRY_ARRIVAL ? arrived.filter((n) => n < 3) : arrived;
  const buffered = tcp ? arrived.filter((n) => !delivered.includes(n)) : [];
  const flights = [];
  for (let n = 1; n <= 6; n++) {
    const position = (t - (n - 1) * GAP_MS) / TRAVEL_MS;
    if (position >= 0 && position < 1 && (n !== 3 || position < 0.55))
      flights.push({ n, position, retry: false });
  }
  if (tcp && t >= RETRY_START && t < RETRY_ARRIVAL)
    flights.push({
      n: 3,
      position: (t - RETRY_START) / TRAVEL_MS,
      retry: true,
    });
  const acks = [];
  if (tcp)
    for (let n = 1; n <= 6; n++) {
      const start = n === 3 ? RETRY_ARRIVAL : (n - 1) * GAP_MS + TRAVEL_MS;
      const position = (t - start) / 1300;
      if (position >= 0 && position < 1)
        acks.push({ n, through: n === 3 ? 6 : n > 3 ? 2 : n, position });
    }
  let message = "Escolha um protocolo e inicie o envio.";
  if (t > 0)
    message = "Os pacotes seguem do computador de origem para o destino.";
  if (t >= LOSS_TIME)
    message = tcp
      ? "O pacote 3 se perdeu. O destino confirma até o 2 e guarda as partes seguintes."
      : "O pacote 3 se perdeu. O UDP continua enviando os próximos, sem exigir confirmação.";
  if (tcp && t >= RETRY_START)
    message = "O TCP retransmite o pacote 3 que não foi confirmado.";
  if (tcp && t >= RETRY_ARRIVAL)
    message =
      "Com a parte que faltava, os seis pacotes podem ser entregues em ordem.";
  if (!tcp && t >= 6300)
    message =
      "Chegaram cinco pacotes. O UDP não recuperou o pacote 3 por conta própria.";
  return {
    t,
    flights,
    acks,
    arrived,
    delivered,
    buffered,
    lost: t >= LOSS_TIME && (!tcp || t < RETRY_ARRIVAL),
    done: t >= DURATION[protocol],
    message,
  };
}
