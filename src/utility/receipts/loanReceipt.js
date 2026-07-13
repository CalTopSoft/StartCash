import { createModal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { authService } from '../../services/auth.service.js';
import { formatCurrency, formatDate, isOverdue, loanStatusLabel, loanTypeLabel, loanTypeIcon } from '../helpers.js';

const APP_NAME = 'StarCash';
const LOGO_SRC = 'src/assets/icons/logo.png';
const CURRENCY_FORMAT = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' });
const DATE_FORMAT = new Intl.DateTimeFormat('es-EC', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const TIME_FORMAT = new Intl.DateTimeFormat('es-EC', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

let logoPromise = null;

// ─── PALETTE ─────────────────────────────────────────────────────────────────
// Shared color tokens used by both image and PDF renderers
const C = {
  bg:        '#F7F8FC',   // page background
  surface:   '#FFFFFF',   // card background
  header:    '#101828',   // dark header strip
  accent:    '#5A47D6',   // purple brand accent
  accentLt:  '#EEE9FF',   // light accent fill
  border:    '#E2E6F0',   // subtle borders
  text:      '#101828',   // primary text
  text2:     '#4B5468',   // secondary text
  text3:     '#8A93A6',   // tertiary / labels
  green:     '#12B76A',   // paid / positive
  greenLt:   '#ECFDF3',
  red:       '#F04438',   // overdue / negative
  redLt:     '#FFF1F0',
  yellow:    '#F79009',   // interest
  yellowLt:  '#FFFAEB',
  purple:    '#7C5CFC',   // progress
  divider:   '#E2E6F0',
};

// ─── MODAL ───────────────────────────────────────────────────────────────────
export function openReceiptExportModal({ loan, payments = [], paymentId = null }) {
  const content = document.createElement('div');
  content.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
  content.innerHTML = `
    <div style="padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);">
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Comprobante de pago</div>
      <div style="font-size:13px;color:var(--text);font-weight:600;line-height:1.35;">${loan?.clientId?.name || 'Cliente'}</div>
      <div style="font-size:11px;color:var(--text2);margin-top:4px;">Elige si quieres compartir o descargar local.</div>
    </div>
    <button class="btn btn-primary" id="receiptSharePdfBtn" style="width:100%;justify-content:center;">PDF compartir</button>
    <button class="btn btn-secondary" id="receiptShareImageBtn" style="width:100%;justify-content:center;">Imagen compartir</button>
    <button class="btn" id="receiptShareBothBtn" style="width:100%;justify-content:center;background:var(--surface2);color:var(--text);border:1px solid var(--border);">Compartir ambas</button>
    <div style="height:1px;background:var(--border);margin:2px 0;"></div>
    <button class="btn" id="receiptDownloadBtn" style="width:100%;justify-content:center;background:var(--surface2);color:var(--text);border:1px solid var(--border2);">Descargar en el dispositivo</button>
    <div id="receiptDownloadOptions" style="display:none;gap:8px;grid-template-columns:1fr;">
      <button class="btn btn-secondary" id="receiptDownloadPdfBtn" style="width:100%;justify-content:center;">Descargar PDF</button>
      <button class="btn btn-secondary" id="receiptDownloadImageBtn" style="width:100%;justify-content:center;">Descargar imagen</button>
      <button class="btn btn-secondary" id="receiptDownloadBothBtn" style="width:100%;justify-content:center;">Descargar ambas</button>
    </div>
    <div style="font-size:11px;color:var(--text3);line-height:1.45;">
      Compartir usa la ventana del sistema. Descargar guarda el archivo directo en tu dispositivo.
    </div>
  `;

  const { close } = createModal({ title: 'Generar comprobante', content });

  const runExport = async (mode, type, button) => {
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span>';
    try {
      const context = buildReceiptContext({ loan, payments, paymentId });
      const files = await buildExportFiles(type, context);
      if (mode === 'share') {
        await shareFiles(files, context);
      } else {
        downloadFiles(files);
        toast.success(files.length > 1 ? 'Comprobantes descargados' : 'Comprobante descargado');
      }
      close();
    } catch (err) {
      const msg = err?.message || 'No se pudo generar el comprobante';
      toast.error(msg);
      button.disabled = false;
      button.textContent = button.dataset.label;
    }
  };

  const sharePdfBtn     = content.querySelector('#receiptSharePdfBtn');
  const shareImageBtn   = content.querySelector('#receiptShareImageBtn');
  const shareBothBtn    = content.querySelector('#receiptShareBothBtn');
  const downloadBtn     = content.querySelector('#receiptDownloadBtn');
  const downloadOptions = content.querySelector('#receiptDownloadOptions');
  const downloadPdfBtn  = content.querySelector('#receiptDownloadPdfBtn');
  const downloadImageBtn= content.querySelector('#receiptDownloadImageBtn');
  const downloadBothBtn = content.querySelector('#receiptDownloadBothBtn');

  sharePdfBtn.dataset.label     = 'PDF compartir';
  shareImageBtn.dataset.label   = 'Imagen compartir';
  shareBothBtn.dataset.label    = 'Compartir ambas';
  downloadBtn.dataset.label     = 'Descargar en el dispositivo';
  downloadPdfBtn.dataset.label  = 'Descargar PDF';
  downloadImageBtn.dataset.label= 'Descargar imagen';
  downloadBothBtn.dataset.label = 'Descargar ambas';

  sharePdfBtn.onclick   = () => runExport('share',    'pdf',   sharePdfBtn);
  shareImageBtn.onclick = () => runExport('share',    'image', shareImageBtn);
  shareBothBtn.onclick  = () => runExport('share',    'both',  shareBothBtn);

  downloadBtn.onclick = () => {
    const hidden = downloadOptions.style.display === 'none';
    downloadOptions.style.display = hidden ? 'grid' : 'none';
    downloadBtn.textContent = hidden ? 'Ocultar opciones de descarga' : downloadBtn.dataset.label;
  };

  downloadPdfBtn.onclick  = () => runExport('download', 'pdf',   downloadPdfBtn);
  downloadImageBtn.onclick= () => runExport('download', 'image', downloadImageBtn);
  downloadBothBtn.onclick = () => runExport('download', 'both',  downloadBothBtn);
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────────
function buildReceiptContext({ loan, payments, paymentId }) {
  const user    = authService.getUser();
  const ordered = normalizePayments(payments, Number(loan?.total || 0));
  const lastPayment = paymentId
    ? ordered.find((p) => p._id === paymentId) || ordered[ordered.length - 1] || null
    : ordered[ordered.length - 1] || null;

  const paidTotal  = ordered.reduce((sum, p) => sum + p.amount, 0);
  const total      = Number(loan?.total || 0);
  const remaining  = Math.max(0, total - paidTotal);
  const paidPercent= total > 0 ? Math.round((paidTotal / total) * 100) : 0;
  
  const loanType = loan?.loanType || 'NORMAL';

  return {
    appName:     APP_NAME,
    lenderName:  user?.name || 'Prestamista',
    clientName:  loan?.clientId?.name  || 'Cliente',
    clientPhone: loan?.clientId?.phone || '',
    clientEmail: loan?.clientId?.email || '',
    loanId:      loan?._id   || '',
    loanType,
    loanStatus:  loanStatusLabel(loan?.status || 'PENDING'),
    rawStatus:   loan?.status || 'PENDING',
    isOverdue:   isOverdue(loan?.dueDate, loan?.status),
    createdAt:   loan?.createdAt || '',
    dueDate:     loan?.dueDate   || '',
    capital:     Number(loan?.amount ?? loan?.capitalOriginal ?? 0),
    interest:    Number(loan?.interest || 0),
    total:       loanType === 'NORMAL' ? total : Number(loan?.totalAPagar ?? total),
    paidTotal,
    remaining:   loanType === 'FIXED_INTEREST'
      ? Number(loan?.capitalPendiente || 0) + Number(loan?.interesesPendientes || 0)
      : remaining,
    paidPercent: Math.min(100, Math.max(0, paidPercent)),
    description: loan?.description || '',
    payments:    ordered,
    lastPayment,
    generatedAt: new Date(),
    typeExtra:   buildTypeExtra(loan, loanType),
    // 👇 NUEVOS CAMPOS
    loanTypeLabel: loanTypeLabel(loanType),
    loanTypeIcon: loanTypeIcon(loanType),
    totalCuotas: loanType === 'INSTALLMENTS' ? (loan.meses ?? 0) : 0,
    cuotasPagadas: loanType === 'INSTALLMENTS' ? ordered.length : 0,
  };
}

function buildTypeExtra(loan, loanType) {
  if (loanType === 'FIXED_INTEREST') {
    return {
      label: 'Interés fijo',
      rows: [
        ['Capital original', CURRENCY_FORMAT.format(Number(loan?.capitalOriginal || 0))],
        ['Capital pendiente', CURRENCY_FORMAT.format(Number(loan?.capitalPendiente || 0))],
        ['Interés mensual', CURRENCY_FORMAT.format(Number(loan?.interesMensual || 0))],
        ['Intereses pendientes', CURRENCY_FORMAT.format(Number(loan?.interesesPendientes || 0))],
      ],
    };
  }
  if (loanType === 'INSTALLMENTS') {
    return {
      label: 'Diferidos',
      rows: [
        ['Cuota mensual', CURRENCY_FORMAT.format(Number(loan?.cuotaMensual || 0))],
        ['Plazo', `${loan?.meses ?? '-'} meses`],
        ['Interés', `${loan?.porcentajeInteres ?? 0}% / mes`],
        ['1er pago', loan?.fechaPrimerPago ? DATE_FORMAT.format(new Date(loan.fechaPrimerPago)) : '--'],
      ],
    };
  }
  return null;
}

function normalizePayments(payments, total) {
  const cloned = (payments || []).map((p) => ({ ...p }));
  cloned.sort((a, b) => getPaymentTimestamp(a) - getPaymentTimestamp(b));

  let running = 0;
  return cloned.map((p, idx) => {
    const amount = Number(p.amount || 0);
    running += amount;
    return {
      ...p,
      idx: idx + 1,
      amount,
      runningPaid: running,
      remaining:   Math.max(0, total - running),
      dateLabel:   formatSafeDate(p.date || p.createdAt || p.updatedAt),
      timeLabel:   formatSafeTime(p.createdAt || p.updatedAt || p.date),
      note:        p.note || p.description || '',
    };
  });
}

function getPaymentTimestamp(payment) {
  const value = payment?.createdAt || payment?.updatedAt || payment?.date;
  const ts = Number(new Date(value));
  return Number.isFinite(ts) ? ts : 0;
}

function formatSafeDate(value) {
  if (!value) return '--';
  const s = typeof value === 'string' ? value : new Date(value).toISOString();
  const datePart = s.slice(0, 10);
  const [y, mo, d] = datePart.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  if (isNaN(date.getTime())) return '--';
  return DATE_FORMAT.format(date);
}

function formatSafeTime(value) {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return TIME_FORMAT.format(date);
}

// ─── FILE BUILDERS ────────────────────────────────────────────────────────────
async function buildExportFiles(type, context) {
  const files = [];
  if (type === 'image' || type === 'both') {
    const imageBlob = await generateReceiptImageBlob(context);
    files.push({
      file: new File([imageBlob], getReceiptFilename(context, 'png'), { type: 'image/png' }),
      kind: 'image',
    });
  }
  if (type === 'pdf' || type === 'both') {
    const pdfBlob = await generateReceiptPdfBlob(context);
    files.push({
      file: new File([pdfBlob], getReceiptFilename(context, 'pdf'), { type: 'application/pdf' }),
      kind: 'pdf',
    });
  }
  return files;
}

async function shareFiles(items, context) {
  const files = items.map((i) => i.file);
  const shareText = `Comprobante de pago - ${context.clientName} - ${context.appName}`;

  const canUseShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files });

  if (canUseShare) {
    try {
      await navigator.share({ title: `Comprobante ${context.appName}`, text: shareText, files });
      toast.success('Comprobante listo para compartir');
      return;
    } catch (err) {
      if (err?.name === 'AbortError') return;
      downloadFiles(items);
      toast.warning('No se pudo compartir. Se descargaron los archivos.');
      return;
    }
  }

  downloadFiles(items);
  toast.warning('Tu dispositivo no permite compartir archivos. Se descargaron localmente.');
}

function downloadFiles(items) {
  for (const item of items) downloadFile(item.file);
}

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a   = document.createElement('a');
  a.href    = url;
  a.download= file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

function getReceiptFilename(context, ext) {
  const cleanName = (context.clientName || 'cliente')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const date  = context.generatedAt;
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join('');
  return `recibo-${cleanName || 'cliente'}-${stamp}.${ext}`;
}

// ─── SHARED CANVAS HELPERS ────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r, fill, stroke, strokeW = 1) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
  if (fill)   { ctx.fillStyle = fill;  ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeW; ctx.stroke(); }
}

function line(ctx, x1, y1, x2, y2, color, w = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth   = w;
  ctx.stroke();
}

function trimText(ctx, text, maxW) {
  const s = String(text ?? '');
  if (ctx.measureText(s).width <= maxW) return s;
  let out = s;
  while (out.length > 0 && ctx.measureText(out + '…').width > maxW) out = out.slice(0, -1);
  return out + '…';
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo convertir el comprobante'))),
      mime,
      quality
    );
  });
}

async function drawLogo(ctx, x, y, size) {
  try {
    const img = await getLogoImage();
    ctx.save();
    rrect(ctx, x, y, size, size, size * 0.22, null, null);
    ctx.clip();
    ctx.drawImage(img, x, y, size, size);
    ctx.restore();
  } catch {
    rrect(ctx, x, y, size, size, size * 0.22, C.accent, null);
    ctx.fillStyle = '#fff';
    ctx.font      = `700 ${Math.round(size * 0.38)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SC', x + size / 2, y + size / 2 + size * 0.13);
    ctx.textAlign = 'left';
  }
}

function getLogoImage() {
  if (!logoPromise) {
    logoPromise = new Promise((resolve, reject) => {
      const img   = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src     = LOGO_SRC;
    });
  }
  return logoPromise;
}

function shortLoanCode(id) {
  if (!id) return 'N/A';
  return id.slice(-8).toUpperCase();
}

function statusColors(rawStatus) {
  if (rawStatus === 'PAID')    return { bg: C.greenLt,  text: C.green  };
  if (rawStatus === 'OVERDUE') return { bg: C.redLt,    text: C.red    };
  return                              { bg: C.accentLt, text: C.accent };
}

// ─────────────────────────────────────────────────────────────────────────────
//  IMAGE RECEIPT  (1080 × dynamic — white professional)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateReceiptImageBlob(context) {
  const W  = 1080;
  const margin = 60;
  const inner  = W - margin * 2;

  // Calcular altura dinámica
  const extraRows = context.typeExtra ? 4 : 0;
  const extraH = extraRows > 0 ? 120 : 0;
  const payCount   = context.payments.length || 1;
  const tableRowH  = 68;
  const tableH     = 52 + payCount * tableRowH;
  const H = 320 + 280 + 220 + 120 + 56 + tableH + 180 + extraH;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background ──
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // ══ HEADER BAND ══════════════════════════════════════════════════════════════
  const hdrH = 200;
  rrect(ctx, 0, 0, W, hdrH, 0, C.header);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W - 300, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, hdrH);
  ctx.lineTo(W - 500, hdrH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(90,71,214,0.28)';
  ctx.fill();
  ctx.restore();

  await drawLogo(ctx, margin, 58, 72);

  ctx.fillStyle = '#FFFFFF';
  ctx.font      = `700 46px Georgia, serif`;
  ctx.fillText(context.appName, margin + 90, 106);
  ctx.font      = `400 22px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('Comprobante de Pago', margin + 90, 140);

  ctx.textAlign = 'right';
  ctx.font      = `500 20px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.70)';
  ctx.fillText(`ID: ${shortLoanCode(context.loanId)}`, W - margin, 80);
  ctx.font      = `400 19px sans-serif`;
  ctx.fillText(`Generado: ${DATE_FORMAT.format(context.generatedAt)} ${TIME_FORMAT.format(context.generatedAt)}`, W - margin, 112);
  ctx.textAlign = 'left';

  // Status badge
  const sc = statusColors(context.rawStatus);
  const badgeW = 200, badgeH = 40;
  const badgeX = W - margin - badgeW;
  const badgeY = 140;
  rrect(ctx, badgeX, badgeY, badgeW, badgeH, 8, sc.bg);
  ctx.fillStyle  = sc.text;
  ctx.font       = `700 19px sans-serif`;
  ctx.textAlign  = 'center';
  ctx.fillText(context.loanStatus.toUpperCase(), badgeX + badgeW / 2, badgeY + 26);
  
  // 👇 AGREGAR TIPO DE PRÉSTAMO
  if (context.loanType !== 'NORMAL') {
    const typeColors = {
      'FIXED_INTEREST': { bg: '#FFFAEB', text: '#F79009' },
      'INSTALLMENTS': { bg: '#EEE9FF', text: '#5A47D6' },
    };
    const tc = typeColors[context.loanType] || { bg: '#F7F8FC', text: '#101828' };
    const typeW = 160, typeH = 32;
    const typeX = W - margin - typeW;
    const typeY = badgeY + badgeH + 8;
    rrect(ctx, typeX, typeY, typeW, typeH, 6, tc.bg);
    ctx.fillStyle = tc.text;
    ctx.font      = `600 14px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(context.loanTypeLabel.toUpperCase(), typeX + typeW / 2, typeY + 21);
    ctx.textAlign = 'left';
  }

  ctx.textAlign = 'left';

  let y = hdrH + 36;

  // ══ CLIENT / LOAN INFO CARD ══════════════════════════════════════════════════
  rrect(ctx, margin, y, inner, 220, 14, C.surface, C.border, 1.5);

  ctx.fillStyle = C.text3;
  ctx.font      = `600 17px sans-serif`;
  ctx.fillText('CLIENTE', margin + 28, y + 46);
  ctx.fillStyle = C.text;
  ctx.font      = `700 30px Georgia, serif`;
  ctx.fillText(trimText(ctx, context.clientName, 460), margin + 28, y + 88);
  ctx.fillStyle = C.text2;
  ctx.font      = `400 20px sans-serif`;
  if (context.clientPhone) ctx.fillText(`Tel: ${context.clientPhone}`, margin + 28, y + 122);
  if (context.clientEmail) ctx.fillText(`Email: ${context.clientEmail}`, margin + 28, y + 150);

  line(ctx, margin + inner / 2, y + 24, margin + inner / 2, y + 196, C.border, 1.5);

  const rX = margin + inner / 2 + 28;
  ctx.fillStyle = C.text3;
  ctx.font      = `600 17px sans-serif`;
  ctx.fillText('PRÉSTAMO', rX, y + 46);

  const meta = [
    ['Prestamista',  context.lenderName],
    ['Inicio',       formatDate(context.createdAt) || '--'],
    ['Vencimiento',  formatDate(context.dueDate)   || '--'],
    ['Vencido',      context.isOverdue ? 'Sí' : 'No'],
    ['Descripción',  context.description || 'Sin descripción'],
  ];
  let my = y + 76;
  for (const [k, v] of meta) {
    ctx.fillStyle = C.text3;
    ctx.font      = `400 17px sans-serif`;
    ctx.fillText(k + ':', rX, my);
    ctx.fillStyle = context.isOverdue && k === 'Vencido' ? C.red : C.text;
    ctx.font      = `600 17px sans-serif`;
    ctx.fillText(trimText(ctx, v, 320), rX + 148, my);
    my += 30;
  }

  y += 220 + 28;

  // ══ EXTRA BLOCK PARA FIXED_INTEREST / INSTALLMENTS ════════════════════════
  if (context.typeExtra) {
    const extra = context.typeExtra;
    const exH = 110;
    rrect(ctx, margin, y, inner, exH, 12, C.accentLt, C.accent, 1.5);
    
    ctx.fillStyle = C.accent;
    ctx.font      = `700 16px sans-serif`;
    ctx.fillText(extra.label.toUpperCase(), margin + 24, y + 30);
    
    const colW = (inner - 48) / extra.rows.length;
    extra.rows.forEach(([label, value], i) => {
      const cx = margin + 24 + i * colW;
      ctx.fillStyle = C.text3;
      ctx.font      = `400 14px sans-serif`;
      ctx.fillText(label, cx, y + 62);
      ctx.fillStyle = C.text;
      ctx.font      = `700 18px sans-serif`;
      ctx.fillText(trimText(ctx, value, colW - 16), cx, y + 88);
    });
    
    y += exH + 28;
  }

  // ══ AMOUNT CARDS ROW ════════════════════════════════════════════════════════
  const cardGap = 20;
  const cardW   = (inner - cardGap * 2) / 3;
  const cardH   = 150;

  const amountCards = [
    { label: 'Capital',  value: CURRENCY_FORMAT.format(context.capital),  bg: C.surface,   vc: C.text   },
    { label: 'Interés',  value: CURRENCY_FORMAT.format(context.interest), bg: C.yellowLt,  vc: C.yellow },
    { label: 'Total',    value: CURRENCY_FORMAT.format(context.total),    bg: C.accentLt,  vc: C.accent },
  ];
  for (let i = 0; i < amountCards.length; i++) {
    const cx = margin + i * (cardW + cardGap);
    const cd = amountCards[i];
    rrect(ctx, cx, y, cardW, cardH, 12, cd.bg, C.border, 1);

    ctx.fillStyle = C.text3;
    ctx.font      = `600 15px sans-serif`;
    ctx.fillText(cd.label.toUpperCase(), cx + 20, y + 38);

    ctx.fillStyle = cd.vc;
    ctx.font      = `700 34px Georgia, serif`;
    ctx.fillText(trimText(ctx, cd.value, cardW - 40), cx + 20, y + 96);
  }

  y += cardH + cardGap;

  const statusCards = [
    { label: 'Pagado',   value: CURRENCY_FORMAT.format(context.paidTotal), bg: C.greenLt, vc: C.green  },
    { label: 'Restante', value: CURRENCY_FORMAT.format(context.remaining),  bg: C.redLt,  vc: context.remaining > 0 ? C.red : C.green },
    { label: 'Progreso', value: `${context.paidPercent}%`,                  bg: C.surface, vc: C.purple },
  ];
  for (let i = 0; i < statusCards.length; i++) {
    const cx = margin + i * (cardW + cardGap);
    const cd = statusCards[i];
    rrect(ctx, cx, y, cardW, cardH, 12, cd.bg, C.border, 1);
    ctx.fillStyle = C.text3;
    ctx.font      = `600 15px sans-serif`;
    ctx.fillText(cd.label.toUpperCase(), cx + 20, y + 38);
    ctx.fillStyle = cd.vc;
    ctx.font      = `700 34px Georgia, serif`;
    ctx.fillText(trimText(ctx, cd.value, cardW - 40), cx + 20, y + 96);
  }

  y += cardH + 28;

  // ── Progress bar ──
  const pbH = 14;
  rrect(ctx, margin, y, inner, pbH, 7, C.border);
  const fillW = Math.max(pbH, Math.round((inner * context.paidPercent) / 100));
  const grad = ctx.createLinearGradient(margin, 0, margin + fillW, 0);
  grad.addColorStop(0, C.green);
  grad.addColorStop(1, C.purple);
  rrect(ctx, margin, y, fillW, pbH, 7, grad);

  // 👇 MODIFICADO: muestra progreso de cuotas si es INSTALLMENTS
  let progressLabel = `${context.paidPercent}% pagado`;
  if (context.loanType === 'INSTALLMENTS' && context.totalCuotas > 0) {
    const cuotasPagadas = Math.min(context.cuotasPagadas, context.totalCuotas);
    progressLabel = `${cuotasPagadas}/${context.totalCuotas} cuotas · ${context.paidPercent}% pagado`;
  }

  ctx.fillStyle = C.text2;
  ctx.font      = `600 17px sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(progressLabel, margin + inner, y - 10);
  ctx.textAlign = 'left';

  y += pbH + 36;

  // ══ PAYMENT TABLE ════════════════════════════════════════════════════════════
  rrect(ctx, margin, y, inner, 52, 0, C.header, null, 0);
  ctx.save();
  const tblR = 10;
  ctx.beginPath();
  ctx.moveTo(margin + tblR, y);
  ctx.arcTo(margin + inner, y,     margin + inner, y + 52, tblR);
  ctx.arcTo(margin + inner, y + 52, margin,         y + 52, 0);
  ctx.arcTo(margin,         y + 52, margin,         y,     0);
  ctx.arcTo(margin,         y,     margin + inner, y,     tblR);
  ctx.closePath();
  ctx.fillStyle = C.header;
  ctx.fill();
  ctx.restore();

  const cols = [
    { label: '#',              x: margin + 20,  w: 50  },
    { label: 'Fecha',          x: margin + 80,  w: 180 },
    { label: 'Hora',           x: margin + 270, w: 110 },
    { label: 'Pago',           x: margin + 390, w: 180 },
    { label: 'Acumulado',      x: margin + 580, w: 180 },
    { label: 'Deuda restante', x: margin + 770, w: 210 },
  ];

  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.font      = `600 17px sans-serif`;
  for (const col of cols) ctx.fillText(col.label, col.x, y + 32);

  y += 52;

  const rows = context.payments.length ? context.payments : [{
    idx: 1,
    dateLabel:   '--',
    timeLabel:   '--:--',
    amount:      0,
    runningPaid: context.paidTotal,
    remaining:   context.remaining,
    note:        '',
  }];

  for (let i = 0; i < rows.length; i++) {
    const p     = rows[i];
    const rowY  = y + i * tableRowH;
    const isEven= i % 2 === 0;
    ctx.fillStyle = isEven ? '#FFFFFF' : '#F4F6FB';
    ctx.fillRect(margin, rowY, inner, tableRowH);

    if (i === rows.length - 1) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(margin, rowY, 4, tableRowH);
    }

    const textY = rowY + tableRowH * 0.62;
    ctx.fillStyle = C.text;
    ctx.font      = `600 17px sans-serif`;
    ctx.fillText(String(p.idx), cols[0].x, textY);

    ctx.font      = `400 17px sans-serif`;
    ctx.fillText(p.dateLabel, cols[1].x, textY);
    ctx.fillText(p.timeLabel, cols[2].x, textY);

    ctx.fillStyle = C.green;
    ctx.font      = `600 17px sans-serif`;
    ctx.fillText(CURRENCY_FORMAT.format(p.amount), cols[3].x, textY);

    ctx.fillStyle = C.text;
    ctx.font      = `400 17px sans-serif`;
    ctx.fillText(CURRENCY_FORMAT.format(p.runningPaid), cols[4].x, textY);

    ctx.fillStyle = p.remaining > 0 ? C.red : C.green;
    ctx.fillText(CURRENCY_FORMAT.format(p.remaining), cols[5].x, textY);

    if (p.note) {
      ctx.fillStyle = C.text3;
      ctx.font      = `400 14px sans-serif`;
      ctx.fillText(trimText(ctx, p.note, 600), cols[1].x, textY + 20);
    }
  }

  const tableBottom = y + rows.length * tableRowH;
  line(ctx, margin, tableBottom, margin + inner, tableBottom, C.border, 1.5);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(margin + inner, y);
  ctx.lineTo(margin + inner, tableBottom + tblR);
  ctx.arcTo(margin + inner, tableBottom + tblR * 2, margin, tableBottom + tblR * 2, tblR);
  ctx.arcTo(margin, tableBottom + tblR * 2, margin, tableBottom, tblR);
  ctx.closePath();
  ctx.strokeStyle = C.border;
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();

  y = tableBottom + 36;

  // ══ LAST PAYMENT HIGHLIGHT ═══════════════════════════════════════════════════
  const lp = context.lastPayment;
  rrect(ctx, margin, y, inner, 100, 12, C.accentLt, C.accent, 1.5);

  ctx.fillStyle = C.accent;
  ctx.font      = `700 17px sans-serif`;
  ctx.fillText('ÚLTIMO PAGO REGISTRADO', margin + 24, y + 34);

  ctx.fillStyle = C.text;
  ctx.font      = `700 28px Georgia, serif`;
  ctx.fillText(lp ? CURRENCY_FORMAT.format(lp.amount) : '$0,00', margin + 24, y + 74);

  ctx.textAlign = 'right';
  ctx.fillStyle = C.text2;
  ctx.font      = `400 17px sans-serif`;
  ctx.fillText(
    lp ? `${lp.dateLabel}  ·  ${lp.timeLabel}` : '--',
    margin + inner - 24, y + 58
  );
  ctx.fillText(`${context.payments.length} pago(s) registrado(s)`, margin + inner - 24, y + 84);
  ctx.textAlign = 'left';

  y += 100 + 32;

  // ══ FOOTER ═══════════════════════════════════════════════════════════════════
  line(ctx, margin, y, margin + inner, y, C.border, 1);
  y += 24;

  ctx.fillStyle = C.text3;
  ctx.font      = `400 16px sans-serif`;
  ctx.fillText(`${context.appName}  ·  Documento generado el ${DATE_FORMAT.format(context.generatedAt)} a las ${TIME_FORMAT.format(context.generatedAt)}`, margin, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${context.appName} — Comprobante`, margin + inner, y);
  ctx.textAlign = 'left';

  return canvasToBlob(canvas, 'image/png', 0.97);
}

// ─────────────────────────────────────────────────────────────────────────────
//  PDF RECEIPT  (1240 × dynamic — clean white corporate)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateReceiptPdfBlob(context) {
  const W      = 1240;
  const margin = 56;
  const inner  = W - margin * 2;

  const extraRows = context.typeExtra ? 4 : 0;
  const extraH = extraRows > 0 ? 130 : 0;
  const payCount  = Math.max(1, context.payments.length);
  const rowH      = 52;
  const tableH    = 50 + payCount * rowH;
  const H = Math.max(1400, 280 + 250 + 180 + 160 + tableH + 200 + 100 + extraH);

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = C.accent;
  ctx.fillRect(0, 0, W, 6);

  // ══ HEADER ════════════════════════════════════════════════════════════════
  const hdrH = 220;
  rrect(ctx, 0, 6, W, hdrH, 0, C.header);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W - 280, 6);
  ctx.lineTo(W, 6);
  ctx.lineTo(W, 6 + hdrH);
  ctx.lineTo(W - 460, 6 + hdrH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(90,71,214,0.25)';
  ctx.fill();
  ctx.restore();

  await drawLogo(ctx, margin, 38, 80);

  ctx.fillStyle = '#FFFFFF';
  ctx.font      = `700 50px Georgia, serif`;
  ctx.fillText(`Recibo de Pago`, margin + 104, 96);
  ctx.font      = `400 22px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.60)';
  ctx.fillText(context.appName, margin + 104, 132);

  ctx.font      = `400 20px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(`Cliente: ${context.clientName}`, margin + 104, 166);
  ctx.fillText(`Prestamista: ${context.lenderName}`, margin + 104, 196);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font      = `600 20px sans-serif`;
  ctx.fillText(`ID: ${shortLoanCode(context.loanId)}`, W - margin, 68);
  ctx.font      = `400 18px sans-serif`;
  ctx.fillText(`${DATE_FORMAT.format(context.generatedAt)} ${TIME_FORMAT.format(context.generatedAt)}`, W - margin, 96);

  // Status badge
  const sc = statusColors(context.rawStatus);
  const bW = 220, bH = 42;
  rrect(ctx, W - margin - bW, 120, bW, bH, 8, sc.bg);
  ctx.fillStyle = sc.text;
  ctx.font      = `700 19px sans-serif`;
  ctx.fillText(context.loanStatus.toUpperCase(), W - margin - bW / 2, 120 + 27);

  // 👇 AGREGAR TIPO DE PRÉSTAMO DEBAJO DEL BADGE
  if (context.loanType !== 'NORMAL') {
    const typeColors = {
      'FIXED_INTEREST': { bg: '#FFFAEB', text: '#F79009' },
      'INSTALLMENTS': { bg: '#EEE9FF', text: '#5A47D6' },
    };
    const tc = typeColors[context.loanType] || { bg: '#F7F8FC', text: '#101828' };
    const typeW = 180, typeH = 32;
    const typeX = W - margin - typeW;
    const typeY = 120 + bH + 10;
    rrect(ctx, typeX, typeY, typeW, typeH, 6, tc.bg);
    ctx.fillStyle = tc.text;
    ctx.font      = `600 15px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(context.loanTypeLabel.toUpperCase(), typeX + typeW / 2, typeY + 21);
    ctx.textAlign = 'left';
  }

  ctx.textAlign = 'left';

  let y = 6 + hdrH + 36;

  // ══ INFO BLOCKS ═══════════════════════════════════════════════════════════
  const blockW = (inner - 28) / 2;
  const blockH = 230;

  rrect(ctx, margin, y, blockW, blockH, 12, '#F7F8FC', C.border, 1.5);
  ctx.fillStyle = C.accent;
  ctx.fillRect(margin, y, 4, blockH);

  ctx.fillStyle = C.text3;
  ctx.font      = `700 14px sans-serif`;
  ctx.fillText('DETALLES DEL PRÉSTAMO', margin + 20, y + 34);

  const loanMeta = [
    ['Estado',       context.loanStatus],
    ['Vencido',      context.isOverdue ? 'Sí' : 'No'],
    ['Fecha inicio', formatDate(context.createdAt) || '--'],
    ['Vencimiento',  formatDate(context.dueDate)   || '--'],
    ['ID préstamo',  shortLoanCode(context.loanId)  ],
    ['Descripción',  context.description || 'Sin descripción'],
  ];
  let ly = y + 62;
  for (const [k, v] of loanMeta) {
    ctx.fillStyle = C.text3;
    ctx.font      = `400 16px sans-serif`;
    ctx.fillText(k, margin + 20, ly);
    const vc = (k === 'Vencido' && context.isOverdue) ? C.red
              : (k === 'Estado') ? sc.text
              : C.text;
    ctx.fillStyle = vc;
    ctx.font      = `600 16px sans-serif`;
    ctx.fillText(trimText(ctx, v, blockW - 180), margin + 170, ly);
    ly += 28;
  }

  const rx = margin + blockW + 28;
  rrect(ctx, rx, y, blockW, blockH, 12, '#F7F8FC', C.border, 1.5);
  ctx.fillStyle = C.accent;
  ctx.fillRect(rx, y, 4, blockH);

  ctx.fillStyle = C.text3;
  ctx.font      = `700 14px sans-serif`;
  ctx.fillText('RESUMEN FINANCIERO', rx + 20, y + 34);

  const finMeta = [
    ['Capital',   CURRENCY_FORMAT.format(context.capital),   C.text   ],
    ['Interés',   CURRENCY_FORMAT.format(context.interest),  C.yellow ],
    ['Total',     CURRENCY_FORMAT.format(context.total),     C.accent ],
    ['Pagado',    CURRENCY_FORMAT.format(context.paidTotal), C.green  ],
    ['Pendiente', CURRENCY_FORMAT.format(context.remaining), context.remaining > 0 ? C.red : C.green],
    ['Progreso',  `${context.paidPercent}%`,                 C.purple ],
  ];
  let fy = y + 62;
  for (const [k, v, vc] of finMeta) {
    ctx.fillStyle = C.text3;
    ctx.font      = `400 16px sans-serif`;
    ctx.fillText(k, rx + 20, fy);
    ctx.fillStyle = vc;
    ctx.font      = `700 18px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(v, rx + blockW - 20, fy);
    ctx.textAlign = 'left';
    if (fy < y + blockH - 40) line(ctx, rx + 16, fy + 10, rx + blockW - 16, fy + 10, C.divider, 1);
    fy += 30;
  }

  y += blockH + 28;

  // ══ EXTRA BLOCK PARA FIXED_INTEREST / INSTALLMENTS ════════════════════════
  if (context.typeExtra) {
    const extra = context.typeExtra;
    const exH = 110;
    rrect(ctx, margin, y, inner, exH, 12, C.accentLt, C.accent, 1.5);
    
    ctx.fillStyle = C.accent;
    ctx.font      = `700 16px sans-serif`;
    ctx.fillText(extra.label.toUpperCase(), margin + 24, y + 30);
    
    const colW = (inner - 48) / extra.rows.length;
    extra.rows.forEach(([label, value], i) => {
      const cx = margin + 24 + i * colW;
      ctx.fillStyle = C.text3;
      ctx.font      = `400 14px sans-serif`;
      ctx.fillText(label, cx, y + 62);
      ctx.fillStyle = C.text;
      ctx.font      = `700 18px sans-serif`;
      ctx.fillText(trimText(ctx, value, colW - 16), cx, y + 88);
    });
    
    y += exH + 28;
  }

  // ── Progress bar ──
  const pbH = 12;
  rrect(ctx, margin, y, inner, pbH, 6, C.border);
  const fillW = Math.max(pbH, Math.round((inner * context.paidPercent) / 100));
  const pgrd  = ctx.createLinearGradient(margin, 0, margin + fillW, 0);
  pgrd.addColorStop(0, C.green);
  pgrd.addColorStop(1, C.purple);
  rrect(ctx, margin, y, fillW, pbH, 6, pgrd);

  // ── Etiqueta de progreso ──
  let progressLabel = `${context.paidPercent}% pagado de ${CURRENCY_FORMAT.format(context.total)}`;

  if (context.loanType === 'INSTALLMENTS' && context.totalCuotas > 0) {
    const cuotasPagadas = Math.min(context.cuotasPagadas, context.totalCuotas);
    progressLabel = `${cuotasPagadas}/${context.totalCuotas} cuotas`;
  }

  ctx.fillStyle = C.text2;
  ctx.font      = `600 16px sans-serif`;
  ctx.textAlign = 'right';  
  ctx.fillText(progressLabel, margin + inner, y - 10);
  ctx.textAlign = 'left';

  y += pbH + 36;

  // ══ PAYMENT TABLE ════════════════════════════════════════════════════════════
  ctx.fillStyle = C.text;
  ctx.font      = `700 22px Georgia, serif`;
  ctx.fillText('Historial completo de pagos', margin, y);
  y += 30;

  rrect(ctx, margin, y, inner, 50, 0, C.header);
  ctx.save();
  const tR = 10;
  ctx.beginPath();
  ctx.moveTo(margin + tR, y);
  ctx.arcTo(margin + inner, y, margin + inner, y + 50, tR);
  ctx.arcTo(margin + inner, y + 50, margin, y + 50, 0);
  ctx.arcTo(margin, y + 50, margin, y, 0);
  ctx.arcTo(margin, y, margin + inner, y, tR);
  ctx.closePath();
  ctx.fillStyle = C.header;
  ctx.fill();
  ctx.restore();

  const cols = [
    { label: '#',              x: margin + 16,  fw: 50  },
    { label: 'Fecha',          x: margin + 76,  fw: 180 },
    { label: 'Hora',           x: margin + 266, fw: 110 },
    { label: 'Monto',          x: margin + 386, fw: 180 },
    { label: 'Acumulado',      x: margin + 576, fw: 200 },
    { label: 'Deuda restante', x: margin + 786, fw: 200 },
    { label: 'Nota',           x: margin + 996, fw: 188 },
  ];

  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.font      = `600 16px sans-serif`;
  for (const c of cols) ctx.fillText(c.label, c.x, y + 31);

  y += 50;

  const rows = context.payments.length ? context.payments : [{
    idx: 1, dateLabel: '--', timeLabel: '--:--',
    amount: 0, runningPaid: context.paidTotal, remaining: context.remaining, note: '',
  }];

  for (let i = 0; i < rows.length; i++) {
    const p    = rows[i];
    const ry   = y + i * rowH;
    ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F7F8FC';
    ctx.fillRect(margin, ry, inner, rowH);

    if (p._id === context.lastPayment?._id || i === rows.length - 1) {
      ctx.fillStyle = C.accent;
      ctx.fillRect(margin, ry, 4, rowH);
    }

    const ty = ry + rowH * 0.60;
    ctx.fillStyle = C.text2;
    ctx.font      = `600 16px sans-serif`;
    ctx.fillText(String(p.idx), cols[0].x, ty);

    ctx.font      = `400 16px sans-serif`;
    ctx.fillText(p.dateLabel, cols[1].x, ty);
    ctx.fillText(p.timeLabel, cols[2].x, ty);

    ctx.fillStyle = C.green;
    ctx.font      = `700 16px sans-serif`;
    ctx.fillText(CURRENCY_FORMAT.format(p.amount), cols[3].x, ty);

    ctx.fillStyle = C.text;
    ctx.font      = `400 16px sans-serif`;
    ctx.fillText(CURRENCY_FORMAT.format(p.runningPaid), cols[4].x, ty);

    ctx.fillStyle = p.remaining > 0 ? C.red : C.green;
    ctx.fillText(CURRENCY_FORMAT.format(p.remaining),   cols[5].x, ty);

    ctx.fillStyle = C.text3;
    ctx.font      = `400 14px sans-serif`;
    ctx.fillText(trimText(ctx, p.note || '—', cols[6].fw - 8), cols[6].x, ty);
  }

  const tblBottom = y + rows.length * rowH;
  line(ctx, margin, tblBottom, margin + inner, tblBottom, C.border, 1.5);

  y = tblBottom + 28;

  // ══ LAST PAYMENT BOX ═════════════════════════════════════════════════════════
  const lp = context.lastPayment;
  rrect(ctx, margin, y, inner, 90, 10, C.accentLt, C.accent, 1.5);

  ctx.fillStyle = C.accent;
  ctx.font      = `700 15px sans-serif`;
  ctx.fillText('ÚLTIMO PAGO', margin + 24, y + 32);
  ctx.fillStyle = C.text;
  ctx.font      = `700 30px Georgia, serif`;
  ctx.fillText(lp ? CURRENCY_FORMAT.format(lp.amount) : '$0,00', margin + 24, y + 68);

  ctx.textAlign = 'right';
  ctx.fillStyle = C.text2;
  ctx.font      = `400 16px sans-serif`;
  ctx.fillText(lp ? `${lp.dateLabel}  ·  ${lp.timeLabel}` : '--', margin + inner - 24, y + 44);
  ctx.fillText(`${context.payments.length} pago(s) en total`, margin + inner - 24, y + 70);
  ctx.textAlign = 'left';

  y += 90 + 28;

  // ── Description ──
  if (context.description) {
    rrect(ctx, margin, y, inner, 56, 8, '#F7F8FC', C.border, 1);
    ctx.fillStyle = C.text3;
    ctx.font      = `400 15px sans-serif`;
    ctx.fillText('Descripción:', margin + 16, y + 30);
    ctx.fillStyle = C.text;
    ctx.font      = `400 16px sans-serif`;
    ctx.fillText(trimText(ctx, context.description, inner - 180), margin + 140, y + 30);
    y += 56 + 20;
  }

  // ── Client info row ──
  if (context.clientPhone || context.clientEmail) {
    rrect(ctx, margin, y, inner, 56, 8, '#F7F8FC', C.border, 1);
    ctx.fillStyle = C.text3;
    ctx.font      = `400 15px sans-serif`;
    ctx.fillText('Contacto:', margin + 16, y + 30);
    ctx.fillStyle = C.text;
    ctx.font      = `400 16px sans-serif`;
    const contact = [context.clientPhone, context.clientEmail].filter(Boolean).join('  ·  ');
    ctx.fillText(contact, margin + 120, y + 30);
    y += 56 + 20;
  }

  // ══ FOOTER ════════════════════════════════════════════════════════════════
  line(ctx, margin, y, margin + inner, y, C.border, 1.5);
  y += 22;

  ctx.fillStyle = C.accent;
  ctx.fillRect(margin, y, 40, 4);

  y += 20;
  ctx.fillStyle = C.text3;
  ctx.font      = `400 15px sans-serif`;
  ctx.fillText(
    `${context.appName}  ·  Comprobante generado el ${DATE_FORMAT.format(context.generatedAt)} a las ${TIME_FORMAT.format(context.generatedAt)}`,
    margin, y
  );
  ctx.textAlign = 'right';
  ctx.fillText(
    `Este documento es válido como soporte de crédito  ·  ${context.appName}`,
    margin + inner, y
  );
  ctx.textAlign = 'left';

  y += 24;
  ctx.fillStyle = C.text3;
  ctx.font      = `400 14px sans-serif`;
  ctx.fillText(`Cliente: ${context.clientName}  ·  Prestamista: ${context.lenderName}  ·  ID: ${shortLoanCode(context.loanId)}`, margin, y);

  const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', 0.94);
  return imageBlobToPdfBlob(jpegBlob, W, H);
}

// ─── PDF WRAPPER ─────────────────────────────────────────────────────────────
async function imageBlobToPdfBlob(imageBlob, widthPx, heightPx) {
  const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
  const widthPt    = Math.round(widthPx * 0.75);
  const heightPt   = Math.round(heightPx * 0.75);
  const encoder    = new TextEncoder();

  const objects   = [];
  const pushObject= (body) => { objects.push(body); return objects.length; };

  const imageObj = pushObject({
    streamHead:  `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>`,
    streamBytes: imageBytes,
  });

  const contentStream = `q\n${widthPt} 0 0 ${heightPt} 0 0 cm\n/Im0 Do\nQ`;
  const contentObj    = pushObject(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);
  const pageObj       = pushObject(`<< /Type /Page /Parent 4 0 R /Resources << /XObject << /Im0 ${imageObj} 0 R >> >> /MediaBox [0 0 ${widthPt} ${heightPt}] /Contents ${contentObj} 0 R >>`);
  const pagesObj      = pushObject(`<< /Type /Pages /Kids [${pageObj} 0 R] /Count 1 >>`);
  const catalogObj    = pushObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  const chunks = [];
  let   length = 0;
  const pushText  = (t) => { const b = encoder.encode(t);  chunks.push(b); length += b.length; };
  const pushBytes = (b) => { chunks.push(b); length += b.length; };

  const offsets = [0];
  pushText('%PDF-1.4\n');

  objects.forEach((obj, index) => {
    offsets[index + 1] = length;
    pushText(`${index + 1} 0 obj\n`);
    if (typeof obj === 'string') {
      pushText(`${obj}\nendobj\n`);
      return;
    }
    pushText(`${obj.streamHead}\nstream\n`);
    pushBytes(obj.streamBytes);
    pushText('\nendstream\nendobj\n');
  });

  const xrefStart = length;
  pushText(`xref\n0 ${objects.length + 1}\n`);
  pushText('0000000000 65535 f \n');
  for (let i = 1; i <= objects.length; i++) {
    pushText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushText(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob(chunks, { type: 'application/pdf' });
}