/*const HEALTH_URL = 'http://localhost:3000/api/health';*/
const HEALTH_URL = 'https://startcashback.onrender.com/api/health';

const MAX_WAIT_MS = 1 * 60 * 1000;
const POLL_MS = 3000;

export async function renderWakeUp(onReady) {
  document.body.innerHTML = '';

  const page = document.createElement('div');
  page.style.cssText = `
    min-height:100vh;
    display:flex;
    align-items:center;
    justify-content:center;
    background:var(--bg);
    padding:20px;
  `;

  page.innerHTML = `
    <div style="text-align:center;max-width:360px;width:100%;">

      <div style="
        width:72px;height:72px;
        background:var(--accent);
        border-radius:18px;
        display:flex;
        align-items:center;
        justify-content:center;
        margin:0 auto 20px;
        box-shadow:0 0 32px var(--accent-glow);
      ">
        <img src="src/assets/icons/logo.png" alt="logo" style="width:44px;height:44px;object-fit:contain;"/>
      </div>

      <div style="font-size:24px;font-weight:700;color:var(--text);margin-bottom:6px;">
        StartCash
      </div>

      <div id="wakeHint" style="font-size:13px;color:var(--text3);margin-bottom:30px;">
        Iniciando plataforma...
      </div>

      <!-- Loader + estado juntos -->
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:12px;
      ">

        <!-- Spinner -->
        <div style="position:relative;width:56px;height:56px;">
          <svg viewBox="0 0 56 56"
            style="width:56px;height:56px;animation:spin 1s linear infinite;">
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border2)" stroke-width="3"/>
            <circle cx="28" cy="28" r="24" fill="none" stroke="var(--accent)" stroke-width="3"
              stroke-dasharray="38 113" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Estado -->
        <div id="wakeStatus" style="
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          font-size:14px;
          color:var(--text2);
        ">
          Conectando...
        </div>

      </div>

      <div id="wakeError" style="display:none;margin-top:20px;">
        <button id="retryBtn" style="
          background:none;
          border:none;
          color:var(--accent);
          cursor:pointer;
          font-size:13px;
          text-decoration:underline;
        ">Reintentar</button>
      </div>

    </div>
  `;

  document.body.appendChild(page);

  const statusEl = page.querySelector('#wakeStatus');
  const hintEl = page.querySelector('#wakeHint');
  const errorEl = page.querySelector('#wakeError');
  const retryBtn = page.querySelector('#retryBtn');

  async function tryConnect() {
    errorEl.style.display = 'none';
    hintEl.textContent = 'Iniciando plataforma...';

    const start = Date.now();
    let dots = 0;

    const dotInterval = setInterval(() => {
      dots = (dots + 1) % 4;
      statusEl.innerHTML = 'Conectando' + '.'.repeat(dots);
    }, 500);

    while (Date.now() - start < MAX_WAIT_MS) {
      try {
        const res = await fetch(HEALTH_URL, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });

        if (res.ok) {
          clearInterval(dotInterval);

          // 🔥 Mantiene loader + añade check
          statusEl.style.color = 'var(--green)';
          statusEl.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#22c55e" stroke-width="2"/>
              <path d="M7 12l3 3 7-7"
                stroke="#22c55e"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"/>
            </svg>
            Servidor listo
          `;

          hintEl.textContent = 'Redirigiendo...';

          await new Promise(r => setTimeout(r, 900));
          onReady();
          return;
        }
      } catch {}

      await new Promise(r => setTimeout(r, POLL_MS));
    }

    clearInterval(dotInterval);
    statusEl.textContent = 'No se pudo conectar';
    hintEl.textContent = '';
    errorEl.style.display = 'block';
  }

  retryBtn.onclick = () => tryConnect();
  await tryConnect();
}
