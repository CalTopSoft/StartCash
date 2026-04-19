import { createLayout } from '../components/Layout.js';
import { loanService } from '../services/loan.service.js';
import { clientService } from '../services/client.service.js';
import { formatCurrency, formatDate, loanStatusClass, loanStatusLabel, isOverdue } from '../utility/helpers.js';
import { icons } from '../components/Icons.js';

export async function renderDashboard() {
  document.body.innerHTML = '';
  const container = createLayout('dashboard', 'Panel de control');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    const [loans, clients] = await Promise.all([loanService.list(), clientService.list()]);

    const activeLoans   = loans.filter(l => l.status !== 'PAID');
    const totalLent     = loans.reduce((s, l) => s + l.amount, 0);
    const totalInterest = loans.reduce((s, l) => s + l.interest, 0);
    const totalPaid     = loans.reduce((s, l) => s + l.amountPaid, 0);
    const overdueLoans  = loans.filter(l => isOverdue(l.dueDate, l.status));

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
        <div>
          <h1 class="page-title">Panel de control</h1>
          <p class="page-subtitle">Resumen general de tu cartera</p>
        </div>
      </div>

      ${overdueLoans.length > 0 ? `
        <div class="alert alert-error" style="margin-bottom:16px;">
          ${icons.alert}
          <div><strong>${overdueLoans.length} prestamo(s) vencido(s).</strong> Revisa tu lista de prestamos.</div>
        </div>
      ` : ''}

      <!-- Stats 2x2 -->
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Capital prestado</div>
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--accent2);">${formatCurrency(totalLent)}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">${loans.length} prestamos</div>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Ganancias</div>
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);">${formatCurrency(totalInterest)}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">En intereses</div>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Total cobrado</div>
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);">${formatCurrency(totalPaid)}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">Pagos recibidos</div>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;">
          <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Creditos activos</div>
          <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--text);">${activeLoans.length}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">${clients.length} clientes</div>
        </div>
      </div>

      <!-- Prestamos recientes -->
      <div class="card" style="padding:14px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text);">Prestamos recientes</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">Ultimos 5 registros</div>
          </div>
          <button class="btn btn-ghost btn-sm" id="goLoans">Ver todos</button>
        </div>

        <!-- Header tabla -->
        <div style="display:grid;grid-template-columns:85px 75px 72px 55px;gap:6px;align-items:center;padding:0 0 8px 0;border-bottom:2px solid var(--border);margin-bottom:4px;">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Cliente</div>
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Total</div>
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Estado</div>
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;">Vence</div>
        </div>
        <div id="recentLoans"></div>
        <div id="emptyLoans" style="display:none;text-align:center;padding:24px 0;color:var(--text3);font-size:13px;">Sin prestamos registrados</div>
      </div>

      <!-- Clientes recientes -->
      <div class="card" style="padding:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text);">Clientes recientes</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">Ultimos 5 registros</div>
          </div>
          <button class="btn btn-ghost btn-sm" id="goClients">Ver todos</button>
        </div>
        <div id="clientList"></div>
        <div id="emptyClients" style="display:none;text-align:center;padding:24px 0;color:var(--text3);font-size:13px;">Sin clientes registrados</div>
      </div>
    `;

    // Préstamos recientes
    const recentLoansEl = container.querySelector('#recentLoans');
    const emptyLoansEl  = container.querySelector('#emptyLoans');

    if (!loans.length) {
      emptyLoansEl.style.display = 'block';
    } else {
      loans.slice(0, 5).forEach(loan => {
        const overdue = isOverdue(loan.dueDate, loan.status);
        const fecha = formatDate(loan.dueDate).replace(/\s\d{4}$/, '');
        const row = document.createElement('div');
        row.style.cssText = 'display:grid;grid-template-columns:85px 75px 72px 55px;gap:6px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);';
        row.innerHTML = `
          <div style="font-size:12px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loan.clientId?.name || '—'}</div>
          <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--green);white-space:nowrap;">${formatCurrency(loan.total)}</div>
          <div><span class="${loanStatusClass(loan.status)}" style="font-size:9px;padding:2px 6px;">${loanStatusLabel(loan.status)}</span></div>
          <div style="font-size:11px;color:${overdue ? 'var(--red)' : 'var(--text2)'};white-space:nowrap;">${fecha}</div>
        `;
        recentLoansEl.appendChild(row);
      });
    }

    // Clientes recientes
    const clientListEl  = container.querySelector('#clientList');
    const emptyClientsEl = container.querySelector('#emptyClients');

    if (!clients.length) {
      emptyClientsEl.style.display = 'block';
    } else {
      clients.slice(0, 5).forEach(c => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);';
        item.innerHTML = `
          ${c.avatar
            ? `<img src="${c.avatar.startsWith('data:') ? c.avatar : `data:image/jpeg;base64,${c.avatar}`}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
            : `<div class="user-avatar" style="font-size:12px;flex-shrink:0;">${c.name.slice(0,2).toUpperCase()}</div>`
          }
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:1px;">${c.email || c.phone || 'Sin contacto'}</div>
          </div>
        `;
        clientListEl.appendChild(item);
      });
    }

    container.querySelector('#goLoans').onclick  = () => { window.location.hash = '#loans';   window.dispatchEvent(new CustomEvent('navigate')); };
    container.querySelector('#goClients').onclick = () => { window.location.hash = '#clients'; window.dispatchEvent(new CustomEvent('navigate')); };

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} Error al cargar datos: ${err.message}</div>`;
  }
}
