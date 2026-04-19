const PING_URL = 'http://localhost:3000/api/health';
/*const PING_URL = 'https://startcashback.onrender.com/api/health'; */


const INTERVAL_MS = 2 * 60 * 1000; // 4 minutos

let intervalId = null;

export function startKeepAlive() {
  if (intervalId) return;
  intervalId = setInterval(async () => {
    try { await fetch(PING_URL); } catch {}
  }, INTERVAL_MS);
}

export function stopKeepAlive() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}
