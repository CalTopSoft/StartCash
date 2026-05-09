/**
 * StatsGrid — grid 2x2 de tarjetas de estadística reutilizable.
 *
 * @param {Array<{ label: string, value: string, sub: string, color?: string }>} stats
 * @returns {HTMLElement}
 */
export function createStatsGrid(stats) {
    const grid = document.createElement('div');
    grid.style.cssText =
      'display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;';
  
    stats.forEach(({ label, value, sub, color = 'var(--text)' }) => {
      grid.innerHTML += `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">${label}</div>
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:${color};">${value}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">${sub}</div>
        </div>
      `;
    });
  
    return grid;
  }