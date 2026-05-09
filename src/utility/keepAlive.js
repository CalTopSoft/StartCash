import { API_HEALTH_URL } from '../api/client.js';


const INTERVAL_MS = 2 * 60 * 1000; // 4 minutos

let intervalId = null;

export function startKeepAlive() {
  if (intervalId) return;
  intervalId = setInterval(async () => {
    try { await fetch(API_HEALTH_URL); } catch {}
  }, INTERVAL_MS);
}

export function stopKeepAlive() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}
