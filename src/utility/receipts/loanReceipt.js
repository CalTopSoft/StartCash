import { createModal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { authService } from '../../services/auth.service.js';
import { formatCurrency, formatDate, isOverdue, loanStatusLabel } from '../helpers.js';

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

  const { close } = createModal({
    title: 'Generar comprobante',
    content,
  });

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

  const sharePdfBtn = content.querySelector('#receiptSharePdfBtn');
  const shareImageBtn = content.querySelector('#receiptShareImageBtn');
  const shareBothBtn = content.querySelector('#receiptShareBothBtn');
  const downloadBtn = content.querySelector('#receiptDownloadBtn');
  const downloadOptions = content.querySelector('#receiptDownloadOptions');
  const downloadPdfBtn = content.querySelector('#receiptDownloadPdfBtn');
  const downloadImageBtn = content.querySelector('#receiptDownloadImageBtn');
  const downloadBothBtn = content.querySelector('#receiptDownloadBothBtn');

  sharePdfBtn.dataset.label = 'PDF compartir';
  shareImageBtn.dataset.label = 'Imagen compartir';
  shareBothBtn.dataset.label = 'Compartir ambas';
  downloadBtn.dataset.label = 'Descargar en el dispositivo';
  downloadPdfBtn.dataset.label = 'Descargar PDF';
  downloadImageBtn.dataset.label = 'Descargar imagen';
  downloadBothBtn.dataset.label = 'Descargar ambas';

  sharePdfBtn.onclick = () => runExport('share', 'pdf', sharePdfBtn);
  shareImageBtn.onclick = () => runExport('share', 'image', shareImageBtn);
  shareBothBtn.onclick = () => runExport('share', 'both', shareBothBtn);

  downloadBtn.onclick = () => {
    const hidden = downloadOptions.style.display === 'none';
    downloadOptions.style.display = hidden ? 'grid' : 'none';
    downloadBtn.textContent = hidden ? 'Ocultar opciones de descarga' : downloadBtn.dataset.label;
  };

  downloadPdfBtn.onclick = () => runExport('download', 'pdf', downloadPdfBtn);
  downloadImageBtn.onclick = () => runExport('download', 'image', downloadImageBtn);
  downloadBothBtn.onclick = () => runExport('download', 'both', downloadBothBtn);
}

function buildReceiptContext({ loan, payments, paymentId }) {
  const user = authService.getUser();
  const ordered = normalizePayments(payments, Number(loan?.total || 0));
  const lastPayment = paymentId
    ? ordered.find((p) => p._id === paymentId) || ordered[ordered.length - 1] || null
    : ordered[ordered.length - 1] || null;

  const paidTotal = ordered.reduce((sum, p) => sum + p.amount, 0);
  const total = Number(loan?.total || 0);
  const remaining = Math.max(0, total - paidTotal);
  const paidPercent = total > 0 ? Math.round((paidTotal / total) * 100) : 0;

  return {
    appName: APP_NAME,
    lenderName: user?.name || 'Prestamista',
    clientName: loan?.clientId?.name || 'Cliente',
    clientPhone: loan?.clientId?.phone || '',
    loanId: loan?._id || '',
    loanStatus: loanStatusLabel(loan?.status || 'PENDING'),
    isOverdue: isOverdue(loan?.dueDate, loan?.status),
    createdAt: loan?.createdAt || '',
    dueDate: loan?.dueDate || '',
    capital: Number(loan?.amount || 0),
    interest: Number(loan?.interest || 0),
    total,
    paidTotal,
    remaining,
    paidPercent: Math.min(100, Math.max(0, paidPercent)),
    description: loan?.description || '',
    payments: ordered,
    lastPayment,
    generatedAt: new Date(),
  };
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
      remaining: Math.max(0, total - running),
      dateLabel: formatSafeDate(p.date || p.createdAt || p.updatedAt),
      timeLabel: formatSafeTime(p.createdAt || p.updatedAt || p.date),
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

  const canUseShare = typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function'
    && navigator.canShare({ files });

  if (canUseShare) {
    try {
      await navigator.share({
        title: `Comprobante ${context.appName}`,
        text: shareText,
        files,
      });
      toast.success('Comprobante listo para compartir');
      return;
    } catch (err) {
      if (err?.name === 'AbortError') {
        return;
      }
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
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
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

  const date = context.generatedAt;
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    '-',
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join('');

  return `recibo-${cleanName || 'cliente'}-${stamp}.${ext}`;
}

async function generateReceiptImageBlob(context) {
  const width = 1080;
  const height = 1460;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0b1020');
  gradient.addColorStop(1, '#1a2546');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  drawRoundedRect(ctx, 40, 40, width - 80, height - 80, 28, 'rgba(13,18,37,0.84)');
  drawRoundedRect(ctx, 70, 70, width - 140, 160, 20, 'rgba(108,99,255,0.18)');
  await drawLogo(ctx, 96, 104, 84);

  ctx.fillStyle = '#f8f9ff';
  ctx.font = '700 44px Sora';
  ctx.fillText('Comprobante de pago', 200, 136);
  ctx.font = '500 26px Sora';
  ctx.fillStyle = '#b6bddc';
  ctx.fillText(context.appName, 200, 178);

  drawQuickRow(ctx, 'Cliente', context.clientName, 90, 280, width - 180);
  drawQuickRow(ctx, 'Prestamista', context.lenderName, 90, 352, width - 180);
  drawQuickRow(ctx, 'Estado del prestamo', context.loanStatus, 90, 424, width - 180);
  drawQuickRow(ctx, 'Vencido', context.isOverdue ? 'Si' : 'No', 90, 496, width - 180);

  drawStatCard(ctx, {
    x: 90, y: 584, w: 286, h: 150,
    label: 'Capital', value: CURRENCY_FORMAT.format(context.capital), valueColor: '#f8f9ff',
  });
  drawStatCard(ctx, {
    x: 397, y: 584, w: 286, h: 150,
    label: 'Interes', value: CURRENCY_FORMAT.format(context.interest), valueColor: '#ffd166',
  });
  drawStatCard(ctx, {
    x: 704, y: 584, w: 286, h: 150,
    label: 'Total', value: CURRENCY_FORMAT.format(context.total), valueColor: '#f8f9ff',
  });

  drawStatCard(ctx, {
    x: 90, y: 756, w: 286, h: 150,
    label: 'Pagado', value: CURRENCY_FORMAT.format(context.paidTotal), valueColor: '#3bcf98',
  });
  drawStatCard(ctx, {
    x: 397, y: 756, w: 286, h: 150,
    label: 'Restante', value: CURRENCY_FORMAT.format(context.remaining), valueColor: '#ff8f8f',
  });
  drawStatCard(ctx, {
    x: 704, y: 756, w: 286, h: 150,
    label: 'Progreso', value: `${context.paidPercent}%`, valueColor: '#9ea8ff',
  });

  drawProgress(ctx, 90, 940, width - 180, 20, context.paidPercent);

  ctx.fillStyle = '#c7cce5';
  ctx.font = '600 22px Sora';
  ctx.fillText('Ultimo pago registrado', 90, 1024);

  const lp = context.lastPayment;
  drawRoundedRect(ctx, 90, 1048, width - 180, 160, 16, 'rgba(30,41,72,0.7)');
  ctx.font = '600 22px Sora';
  ctx.fillStyle = '#f6f7ff';
  ctx.fillText(lp ? CURRENCY_FORMAT.format(lp.amount) : CURRENCY_FORMAT.format(0), 120, 1108);
  ctx.font = '500 17px Sora';
  ctx.fillStyle = '#b8c1e0';
  ctx.fillText(`Fecha: ${lp ? lp.dateLabel : '--'}   Hora: ${lp ? lp.timeLabel : '--:--'}`, 120, 1146);
  ctx.fillText(`Pagos acumulados: ${context.payments.length}`, 120, 1182);

  ctx.font = '500 14px Sora';
  ctx.fillStyle = '#aeb6d8';
  ctx.fillText(`Generado: ${DATE_FORMAT.format(context.generatedAt)} ${TIME_FORMAT.format(context.generatedAt)}`, 90, 1288);
  ctx.fillText(`Cliente: ${context.clientName}  |  ID prestamo: ${shortLoanCode(context.loanId)}`, 90, 1324);
  ctx.fillText(`${context.appName} - comprobante resumido`, 90, 1360);

  return canvasToBlob(canvas, 'image/png', 0.96);
}

async function generateReceiptPdfBlob(context) {
  const rowHeight = 34;
  const tableRows = Math.max(1, context.payments.length);
  const width = 1240;
  const height = Math.max(1400, 800 + tableRows * rowHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f5f7ff';
  ctx.fillRect(0, 0, width, height);

  drawRoundedRect(ctx, 48, 48, width - 96, 180, 18, '#101a37');
  await drawLogo(ctx, 74, 92, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 34px Sora';
  ctx.fillText(`Recibo de pago - ${context.appName}`, 158, 126);
  ctx.font = '500 20px Sora';
  ctx.fillStyle = '#ccd4f7';
  ctx.fillText(`Cliente: ${context.clientName}`, 158, 160);
  ctx.fillText(`Prestamista: ${context.lenderName}`, 158, 188);

  drawPdfInfoBlock(ctx, 48, 252, 560, 220, [
    ['Estado', context.loanStatus],
    ['Vencido', context.isOverdue ? 'Si' : 'No'],
    ['Inicio', formatDate(context.createdAt)],
    ['Vencimiento', formatDate(context.dueDate)],
    ['ID prestamo', shortLoanCode(context.loanId)],
  ]);

  drawPdfInfoBlock(ctx, 632, 252, 560, 220, [
    ['Capital', CURRENCY_FORMAT.format(context.capital)],
    ['Interes', CURRENCY_FORMAT.format(context.interest)],
    ['Total', CURRENCY_FORMAT.format(context.total)],
    ['Pagado', CURRENCY_FORMAT.format(context.paidTotal)],
    ['Pendiente', CURRENCY_FORMAT.format(context.remaining)],
  ]);

  ctx.fillStyle = '#1f2a4f';
  ctx.font = '700 24px Sora';
  ctx.fillText('Historial completo de pagos', 48, 528);

  const tableX = 48;
  const tableY = 552;
  const tableW = width - 96;
  drawRoundedRect(ctx, tableX, tableY, tableW, 44, 10, '#202d55');
  ctx.fillStyle = '#d9e0ff';
  ctx.font = '600 16px Sora';
  ctx.fillText('#', tableX + 20, tableY + 28);
  ctx.fillText('Fecha', tableX + 70, tableY + 28);
  ctx.fillText('Hora', tableX + 250, tableY + 28);
  ctx.fillText('Pago', tableX + 390, tableY + 28);
  ctx.fillText('Pagado acum.', tableX + 580, tableY + 28);
  ctx.fillText('Deuda restante', tableX + 810, tableY + 28);

  const rows = context.payments.length ? context.payments : [{
    idx: 1,
    dateLabel: '--',
    timeLabel: '--:--',
    amount: 0,
    runningPaid: context.paidTotal,
    remaining: context.remaining,
  }];

  rows.forEach((p, i) => {
    const y = tableY + 52 + i * rowHeight;
    const isEven = i % 2 === 0;
    ctx.fillStyle = isEven ? '#eef2ff' : '#e8edff';
    ctx.fillRect(tableX, y - 22, tableW, rowHeight);

    ctx.fillStyle = '#253462';
    ctx.font = '500 15px Sora';
    ctx.fillText(String(p.idx), tableX + 20, y);
    ctx.fillText(p.dateLabel, tableX + 70, y);
    ctx.fillText(p.timeLabel, tableX + 250, y);
    ctx.fillText(CURRENCY_FORMAT.format(p.amount), tableX + 390, y);
    ctx.fillText(CURRENCY_FORMAT.format(p.runningPaid), tableX + 580, y);
    ctx.fillText(CURRENCY_FORMAT.format(p.remaining), tableX + 810, y);
  });

  const footerY = tableY + 56 + rows.length * rowHeight + 40;
  ctx.fillStyle = '#1f2a4f';
  ctx.font = '500 16px Sora';
  ctx.fillText(`Descripcion: ${context.description || 'Sin descripcion'}`, 48, footerY);
  ctx.fillText(`Generado: ${DATE_FORMAT.format(context.generatedAt)} ${TIME_FORMAT.format(context.generatedAt)}`, 48, footerY + 30);
  ctx.fillText(`${context.appName} - soporte documental del credito`, 48, footerY + 60);

  const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
  return imageBlobToPdfBlob(jpegBlob, width, height);
}

function drawRoundedRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawQuickRow(ctx, label, value, x, y, w) {
  drawRoundedRect(ctx, x, y, w, 56, 14, 'rgba(27,37,68,0.65)');
  ctx.fillStyle = '#97a2cb';
  ctx.font = '500 18px Sora';
  ctx.fillText(label, x + 18, y + 34);
  ctx.fillStyle = '#f4f7ff';
  ctx.font = '600 19px Sora';
  const valueX = x + 300;
  ctx.fillText(trimCanvasText(ctx, value, w - 320), valueX, y + 34);
}

function drawStatCard(ctx, { x, y, w, h, label, value, valueColor }) {
  drawRoundedRect(ctx, x, y, w, h, 16, 'rgba(25,35,65,0.72)');
  ctx.fillStyle = '#9ca8cf';
  ctx.font = '500 16px Sora';
  ctx.fillText(label.toUpperCase(), x + 16, y + 34);
  ctx.fillStyle = valueColor;
  ctx.font = '700 29px Sora';
  ctx.fillText(trimCanvasText(ctx, value, w - 32), x + 16, y + 92);
}

function drawProgress(ctx, x, y, w, h, percent) {
  drawRoundedRect(ctx, x, y, w, h, 10, 'rgba(255,255,255,0.1)');
  const fillW = Math.max(8, Math.round((w * Math.max(0, Math.min(100, percent))) / 100));
  drawRoundedRect(ctx, x, y, fillW, h, 10, '#3bcf98');
  ctx.fillStyle = '#d8ddf3';
  ctx.font = '600 16px Sora';
  ctx.fillText(`${percent}% pagado`, x + w - 120, y - 10);
}

function drawPdfInfoBlock(ctx, x, y, w, h, lines) {
  drawRoundedRect(ctx, x, y, w, h, 12, '#e8edff');
  let yy = y + 36;
  lines.forEach(([k, v]) => {
    ctx.fillStyle = '#5f6f9e';
    ctx.font = '500 14px Sora';
    ctx.fillText(k, x + 18, yy);
    ctx.fillStyle = '#1d2b54';
    ctx.font = '600 16px Sora';
    ctx.fillText(trimCanvasText(ctx, String(v || '--'), w - 180), x + 180, yy);
    yy += 36;
  });
}

async function drawLogo(ctx, x, y, size) {
  try {
    const img = await getLogoImage();
    ctx.drawImage(img, x, y, size, size);
  } catch {
    drawRoundedRect(ctx, x, y, size, size, 14, '#6c63ff');
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px Sora';
    ctx.fillText('SC', x + 15, y + size / 2 + 7);
  }
}

function getLogoImage() {
  if (!logoPromise) {
    logoPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = LOGO_SRC;
    });
  }
  return logoPromise;
}

function trimCanvasText(ctx, text, maxWidth) {
  const safe = String(text ?? '');
  if (ctx.measureText(safe).width <= maxWidth) return safe;
  let out = safe;
  while (out.length > 0 && ctx.measureText(`${out}...`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}...`;
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('No se pudo convertir el comprobante'));
        return;
      }
      resolve(blob);
    }, mime, quality);
  });
}

async function imageBlobToPdfBlob(imageBlob, widthPx, heightPx) {
  const imageBytes = new Uint8Array(await imageBlob.arrayBuffer());
  const widthPt = Math.round(widthPx * 0.75);
  const heightPt = Math.round(heightPx * 0.75);
  const encoder = new TextEncoder();

  const objects = [];
  const pushObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  const imageObj = pushObject({
    streamHead: `<< /Type /XObject /Subtype /Image /Width ${widthPx} /Height ${heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>`,
    streamBytes: imageBytes,
  });

  const contentStream = `q\n${widthPt} 0 0 ${heightPt} 0 0 cm\n/Im0 Do\nQ`;
  const contentObj = pushObject(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);

  const pageObj = pushObject(
    `<< /Type /Page /Parent 4 0 R /Resources << /XObject << /Im0 ${imageObj} 0 R >> >> /MediaBox [0 0 ${widthPt} ${heightPt}] /Contents ${contentObj} 0 R >>`
  );

  const pagesObj = pushObject(`<< /Type /Pages /Kids [${pageObj} 0 R] /Count 1 >>`);
  const catalogObj = pushObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  const chunks = [];
  let length = 0;
  const pushText = (text) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    length += bytes.length;
  };
  const pushBytes = (bytes) => {
    chunks.push(bytes);
    length += bytes.length;
  };

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
  for (let i = 1; i <= objects.length; i += 1) {
    pushText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushText(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob(chunks, { type: 'application/pdf' });
}

function shortLoanCode(id) {
  if (!id) return 'N/A';
  return id.slice(-8).toUpperCase();
}
