// One fictional trip and the same network incidents for both protocols.
export const POSITION_GAP = 1200;
export const POSITION_COUNT = 12;
export const LOST_POSITIONS = [3, 4, 8];
export const ROUTE = [[90, 260], [190, 260], [190, 160], [340, 160], [340, 80], [480, 80]];
const lengths = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]));
const totalLength = lengths.reduce((sum, n) => sum + n, 0);
const samples = Array.from({ length: POSITION_COUNT + 1 }, (_, n) => ({
  n,
  // Position 6 arrives after position 7: the UDP application rejects stale data.
  arrival: n * POSITION_GAP + 400 + (n === 6 ? 2200 : 0),
}));
let deliveredAt = 0;
let animationEnd = 0;
export const TCP_POSITIONS = samples.map(({ n, arrival }) => {
  deliveredAt = Math.max(deliveredAt, arrival + (LOST_POSITIONS.includes(n) ? 2600 : 0));
  const start = Math.max(deliveredAt, animationEnd);
  animationEnd = start + (n === 0 ? 0 : POSITION_GAP);
  return { n, deliveredAt, start, end: animationEnd };
});
export const RIDE_DURATION = TCP_POSITIONS.at(-1).end + 600;
export function routePoint(progress) {
  let distance = Math.max(0, Math.min(1, progress)) * totalLength;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const from = ROUTE[i], to = ROUTE[i + 1];
      const fraction = Math.min(1, distance / lengths[i]);
      return { x: from[0] + (to[0] - from[0]) * fraction, y: from[1] + (to[1] - from[1]) * fraction, left: to[0] < from[0] };
    }
    distance -= lengths[i];
  }
}
export function rideAt(elapsed) {
  const time = Math.max(0, Math.min(RIDE_DURATION, elapsed));
  const available = samples.filter(s => s.arrival <= time && !LOST_POSITIONS.includes(s.n));
  const udpSequence = available.reduce((n, s) => Math.max(n, s.n), 0);
  const discarded = available.some(s => s.n === 6) && udpSequence > 6;
  let tcpProgress = 0;
  for (const s of TCP_POSITIONS.slice(1)) {
    if (time < s.start) break;
    tcpProgress = (s.n - 1 + Math.min(1, (time - s.start) / POSITION_GAP)) / POSITION_COUNT;
  }
  const tcpSequence = TCP_POSITIONS.filter(s => s.deliveredAt <= time).at(-1)?.n ?? 0;
  const waiting = TCP_POSITIONS.some(s => LOST_POSITIONS.includes(s.n) && time >= s.n * POSITION_GAP + 400 && time < s.deliveredAt && tcpProgress === (s.n - 1) / POSITION_COUNT);
  const done = time >= RIDE_DURATION;
  const udpProgress = udpSequence / POSITION_COUNT;
  return {
    time, done,
    realProgress: Math.min(1, time / (POSITION_COUNT * POSITION_GAP)),
    tcp: { progress: tcpProgress, sequence: tcpSequence, waiting, arrived: tcpProgress >= 1 },
    udp: { progress: udpProgress, sequence: udpSequence, discarded, arrived: udpProgress >= 1 },
  };
}
export function rideStep(elapsed) {
  return Math.min(RIDE_DURATION, (Math.floor(elapsed / POSITION_GAP) + 1) * POSITION_GAP);
}
