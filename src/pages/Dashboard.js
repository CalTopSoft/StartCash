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

    const activeLoans  = loans.filter(l => l.status !== 'PAID');
    const totalLent    = loans.reduce((s, l) => s + l.amount, 0);
    const totalInterest= loans.reduce((s, l) => s + l.interest, 0);
    const totalPaid    = loans.reduce((s, l) => s + l.amountPaid, 0);
    const overdueLoans = loans.filter(l => isOverdue(l.dueDate, l.status));

    container.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">Panel de control</h1>
          <p class="page-subtitle">Resumen general de tu cartera</p>
        </div>
      </div>

      ${overdueLoans.length > 0 ? `
        <div class="alert alert-error" style="margin-bottom:20px;">
          ${icons.alert}
          <div><strong>${overdueLoans.length} prestamo(s) vencido(s).</strong> Revisa tu lista de prestamos.</div>
        </div>
      ` : ''}

      <!-- Stats 2x2 siempre -->
      <div class="dash-stats">
        <div class="dash-stat-card">
          <div class="dash-stat-label">Capital prestado</div>
          <div class="dash-stat-value">${formatCurrency(totalLent)}</div>
          <div class="dash-stat-sub">${loans.length} prestamos</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-label">Ganancias</div>
          <div class="dash-stat-value">${formatCurrency(totalInterest)}</div>
          <div class="dash-stat-sub">En intereses</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-label">Total cobrado</div>
          <div class="dash-stat-value">${formatCurrency(totalPaid)}</div>
          <div class="dash-stat-sub">Pagos recibidos</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-label">Creditos activos</div>
          <div class="dash-stat-value">${activeLoans.length}</div>
          <div class="dash-stat-sub">${clients.length} clientes</div>
        </div>
      </div>

      <!-- Tablas -->
      <div class="dash-grid">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Prestamos recientes</div>
              <div class="card-subtitle">Ultimos 5 registros</div>
            </div>
            <button class="btn btn-ghost btn-sm" id="goLoans">Ver todos</button>
          </div>
          <div class="dash-table-wrap">
            <table class="dash-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Vence</th>
                </tr>
              </thead>
              <tbody id="recentLoans"></tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Clientes recientes</div>
              <div class="card-subtitle">Ultimos 5 registros</div>
            </div>
            <button class="btn btn-ghost btn-sm" id="goClients">Ver todos</button>
          </div>
          <div id="clientList"></div>
        </div>
      </div>
    `;

    // Préstamos recientes
    const recentLoans = container.querySelector('#recentLoans');
    if (!loans.length) {
      recentLoans.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:24px 0;">Sin prestamos registrados</td></tr>`;
    } else {
      loans.slice(0, 5).forEach(loan => {
        const overdue = isOverdue(loan.dueDate, loan.status);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="td-primary" style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loan.clientId?.name || '—'}</td>
          <td class="td-mono">${formatCurrency(loan.total)}</td>
          <td><span class="${loanStatusClass(loan.status)}">${loanStatusLabel(loan.status)}</span></td>
          <td style="${overdue ? 'color:var(--red)' : 'color:var(--text2)'};font-size:13px;">${formatDate(loan.dueDate)}</td>
        `;
        recentLoans.appendChild(tr);
      });
    }

    // Clientes recientes
    const clientList = container.querySelector('#clientList');
    if (!clients.length) {
      clientList.innerHTML = `<div class="empty-state"><div class="empty-state-title">Sin clientes</div></div>`;
    } else {
      clients.slice(0, 5).forEach(c => {
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border);';
        item.innerHTML = `
${c.avatar 
  ? `<img src="${c.avatar.startsWith('data:') ? c.avatar : `data:image/jpeg;base64,${c.avatar}`}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
  : `<div class="user-avatar" style="font-size:12px;flex-shrink:0;">${c.name.slice(0,2).toUpperCase()}</div>`
}          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</div>
            <div style="font-size:12px;color:var(--text3);margin-top:1px;">${c.email || c.phone || 'Sin contacto'}</div>
          </div>
        `;
        clientList.appendChild(item);
      });
    }

    container.querySelector('#goLoans').onclick  = () => { window.location.hash = '#loans';   window.dispatchEvent(new CustomEvent('navigate')); };
    container.querySelector('#goClients').onclick = () => { window.location.hash = '#clients'; window.dispatchEvent(new CustomEvent('navigate')); };

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} Error al cargar datos: ${err.message}</div>`;
  }
}