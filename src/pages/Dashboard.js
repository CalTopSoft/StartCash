import { createLayout } from '../components/Layout.js';
import { loanService } from '../services/loan.service.js';
import { clientService } from '../services/client.service.js';
import { debtService } from '../services/debt.service.js';
import { formatCurrency, formatDate, loanStatusClass, loanStatusLabel, isOverdue } from '../utility/helpers.js';
import { icons } from '../components/Icons.js';

export async function renderDashboard() {
  document.body.innerHTML = '';
  const container = createLayout('dashboard', 'Panel de control');
  container.innerHTML = `<div style="text-align:center;padding:60px 0;"><span class="spinner spinner-dark"></span></div>`;

  try {
    const [loans, clients, myDebts] = await Promise.all([
      loanService.list(),
      clientService.list(),
      debtService.getMyDebts().catch(() => []),
    ]);

    const activeLoans   = loans.filter(l => l.status !== 'PAID');
    const totalLent     = loans.reduce((s, l) => s + l.amount, 0);
    const totalInterest = loans.reduce((s, l) => s + l.interest, 0);
    const totalPaid     = loans.reduce((s, l) => s + l.amountPaid, 0);
    const overdueLoans  = loans.filter(l => isOverdue(l.dueDate, l.status));

    // Mis deudas
    const totalDeuda      = myDebts.reduce((s, d) => s + d.total, 0);
    const totalPendiente  = myDebts.reduce((s, d) => s + (d.total - d.amountPaid), 0);
    const deudasActivas   = myDebts.filter(d => d.status !== 'PAID');
    const deudasVencidas  = myDebts.filter(d => isOverdue(d.dueDate, d.status));

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;">
        <div>
          <h1 class="page-title">Panel de control</h1>
          <p class="page-subtitle">Resumen general de tu cartera</p>
        </div>
      </div>

      ${overdueLoans.length > 0 ? `
        <div class="alert alert-error" style="margin-bottom:12px;">
          ${icons.alert}
          <div><strong>${overdueLoans.length} prestamo(s) vencido(s).</strong> Revisa tu lista de prestamos.</div>
        </div>
      ` : ''}

      ${deudasVencidas.length > 0 ? `
        <div class="alert alert-error" style="margin-bottom:12px;border-left-color:var(--yellow);">
          ${icons.alert}
          <div><strong>${deudasVencidas.length} deuda(s) vencida(s).</strong> Contacta a tu prestamista.</div>
        </div>
      ` : ''}

      <!-- Stats 2x2 de prestamos -->
<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
    <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Capital prestado</div>
    <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--accent2);">${formatCurrency(totalLent)}</div>
    <div style="font-size:10px;color:var(--text3);margin-top:2px;">${loans.length} prestamos</div>
  </div>
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
    <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Ganancias</div>
    <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);">${formatCurrency(totalInterest)}</div>
    <div style="font-size:10px;color:var(--text3);margin-top:2px;">En intereses</div>
  </div>
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
    <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Total cobrado</div>
    <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--green);">${formatCurrency(totalPaid)}</div>
    <div style="font-size:10px;color:var(--text3);margin-top:2px;">Pagos recibidos</div>
  </div>
  <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:12px;text-align:center;">
    <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Créditos activos</div>
    <div style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--text);">${activeLoans.length}</div>
    <div style="font-size:10px;color:var(--text3);margin-top:2px;">${clients.length} clientes</div>
  </div>
</div>

      <!-- ═══ CARD COMBINADA: Mis deudas + Buzón ═══ -->
      ${myDebts.length > 0 ? `
      <div class="card" style="padding:0;overflow:hidden;margin-bottom:14px;border-color:${deudasVencidas.length > 0 ? 'rgba(255,107,107,0.4)' : 'var(--border)'};">

        <!-- Mitad superior: resumen de deudas -->
        <div style="padding:14px; border-radius: 10px; border-bottom:1px solid var(--border);background:var(--surface2);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:28px;height:28px;border-radius:var(--radius-sm);background:var(--red-bg);border:1px solid rgba(255,107,107,0.25);display:flex;align-items:center;justify-content:center;">
                ${icons.debtBox}
              </div>
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--text);">Mis deudas</div>
                <div style="font-size:10px;color:var(--text3);">${deudasActivas.length} activa(s) · ${myDebts.length} total</div>
              </div>
            </div>
            ${deudasVencidas.length > 0 ? `<span style="font-size:10px;font-weight:700;color:var(--red);background:var(--red-bg);padding:3px 8px;border-radius:20px;">⚠ ${deudasVencidas.length} vencida(s)</span>` : ''}
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div style="padding:10px;background:var(--surface);border-radius:var(--radius-sm);text-align:center;border:1px solid var(--border);">
              <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">Deuda total</div>
              <div style="font-family:var(--mono);font-size:15px;font-weight:700;color:var(--red);">${formatCurrency(totalDeuda)}</div>
            </div>
            <div style="padding:10px;background:var(--surface);border-radius:var(--radius-sm);text-align:center;border:1px solid var(--border);">
              <div style="font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">Por pagar</div>
              <div style="font-family:var(--mono);font-size:15px;font-weight:700;color:var(--yellow);">${formatCurrency(totalPendiente)}</div>
            </div>
          </div>
        </div>

        <!-- Mitad inferior: buzón / lista rápida -->
        <div style="padding:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <div style="font-size:12px;font-weight:600;color:var(--text2);">Buzón de deudas</div>
            <button class="btn btn-ghost btn-sm" id="goDebts" style="font-size:11px;">${icons.arrowRight} Ver todas</button>
          </div>

          <!-- Últimas 3 deudas activas -->
          <div>
            ${deudasActivas.slice(0, 3).map(d => {
              const overdue = isOverdue(d.dueDate, d.status);
              const remaining = d.total - d.amountPaid;
              const fecha = formatDate(d.dueDate).replace(/\s\d{4}$/, '');
              return `
                <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">
${d.lender?.avatar
  ? `<img src="${d.lender.avatar.startsWith('data:') ? d.lender.avatar : `data:image/jpeg;base64,${d.lender.avatar}`}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
  : `<div style="width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;">${(d.lender?.name || '?').slice(0,2).toUpperCase()}</div>`
}
                  <div style="flex:1;min-width:0;">
                    <div style="font-size:12px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.lender?.name || 'Prestamista'}</div>
                    <div style="font-size:10px;color:${overdue ? 'var(--red)' : 'var(--text3)'};margin-top:1px;">Vence: ${fecha}${overdue ? ' · Vencido' : ''}</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0;">
                    <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--red);">${formatCurrency(remaining)}</div>
                    <div style="font-size:10px;color:var(--text3);">pendiente</div>
                  </div>
                </div>
              `;
            }).join('')}
            ${deudasActivas.length === 0 ? `
              <div style="text-align:center;padding:16px;color:var(--text3);font-size:12px;">
                Sin deudas activas ✓
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Prestamos recientes -->
      <div class="card" style="padding:14px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text);">Prestamos recientes</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px;">Ultimos 5 registros</div>
          </div>
          <button class="btn btn-ghost btn-sm" id="goLoans">Ver todos</button>
        </div>

<div style="display:grid;grid-template-columns:32px 1fr 70px 72px 50px;gap:6px;align-items:center;padding:0 0 8px 0;border-bottom:2px solid var(--border);margin-bottom:4px;">
  <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;grid-column:1/3;">Cliente</div>
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
        row.style.cssText = 'display:grid;grid-template-columns:32px 1fr 70px 72px 50px;gap:6px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);';
        const client = loan.clientId;
        const avatarHtml = client?.avatar
          ? `<img src="${client.avatar.startsWith('data:') ? client.avatar : `data:image/jpeg;base64,${client.avatar}`}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;flex-shrink:0;"/>`
          : `<div style="width:26px;height:26px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;">${(client?.name || '?').slice(0,2).toUpperCase()}</div>`;
          row.innerHTML = `
          ${avatarHtml}
          <div style="font-size:12px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${client?.name || '—'}</div>
          <div style="font-family:var(--mono);font-size:12px;font-weight:700;color:var(--green);white-space:nowrap;">${formatCurrency(loan.total)}</div>
          <div><span class="${loanStatusClass(loan.status)}" style="font-size:9px;padding:2px 6px;">${loanStatusLabel(loan.status)}</span></div>
          <div style="font-size:11px;color:${overdue ? 'var(--red)' : 'var(--text2)'};white-space:nowrap;">${fecha}</div>
        `;
        recentLoansEl.appendChild(row);
      });
    }

    // Clientes recientes
    const clientListEl   = container.querySelector('#clientList');
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

    container.querySelector('#goLoans').onclick   = () => { window.location.hash = '#loans';   window.dispatchEvent(new CustomEvent('navigate')); };
    container.querySelector('#goClients').onclick  = () => { window.location.hash = '#clients'; window.dispatchEvent(new CustomEvent('navigate')); };
    container.querySelector('#goDebts')?.addEventListener('click', () => { window.location.hash = '#debts'; window.dispatchEvent(new CustomEvent('navigate')); });

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${icons.alert} Error al cargar datos: ${err.message}</div>`;
  }
}
