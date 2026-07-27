// ===== CONFIG FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyAgyQ-0FEXQ6J1ZxSckJ3OLo-_Z_8lXheU",
  authDomain: "sistemaalfa.firebaseapp.com",
  projectId: "sistemaalfa",
  storageBucket: "sistemaalfa.firebasestorage.app",
  messagingSenderId: "582264333501",
  appId: "1:582264333501:web:924850c63bd582d65003d4",
  measurementId: "G-7G4E34PV17"
};

firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();
const db = firebase.firestore();

// ===== EMAILJS CONFIG =====
const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'TU_PUBLIC_KEY',
  SERVICE_ID: 'TU_SERVICE_ID',
  TEMPLATE_CONFIRMATION: 'template_confirmacion',
  TEMPLATE_REJECTED: 'template_rechazado'
};

(function() {
  try {
    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.PUBLIC_KEY !== 'TU_PUBLIC_KEY') {
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    }
  } catch(e) {}
})();

async function sendEmailJS(templateId, templateParams) {
  if (EMAILJS_CONFIG.PUBLIC_KEY === 'TU_PUBLIC_KEY') {
    console.log('📧 EmailJS no configurado — saltando. Template:', templateId);
    return { status: 'skipped' };
  }
  try {
    return await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, templateId, templateParams);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { status: 'error', message: error.message };
  }
}

// ===== LOGIN SIMPLE =====
const ADMIN_PASSWORD = "alfa2026";

function checkPassword() {
  const pw = document.getElementById('admin-password').value;
  if (pw === ADMIN_PASSWORD) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    initAdmin();
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

function logout() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('admin-password').value = '';
  document.getElementById('login-error').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const pwInput = document.getElementById('admin-password');
  if (pwInput) {
    pwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') checkPassword();
    });
  }
});

// ===== ADMIN INIT =====
let pdfUploaded = false;

function initAdmin() {
  checkPDFStatus();
  loadSalesHistory();
  loadPendingVerifications();
  loadLeads();
  
  document.getElementById('pdf-upload').addEventListener('change', function() {
    document.getElementById('btn-upload-pdf').disabled = !this.files.length;
  });
}

// ===== CHECK PDF STATUS =====
async function checkPDFStatus() {
  const statusEl = document.getElementById('pdf-status-msg');
  const pdfRef = storage.ref('ebooks/sistema-alfa.pdf');
  
  try {
    const url = await pdfRef.getDownloadURL();
    pdfUploaded = true;
    statusEl.innerHTML = `<span class="dot green"></span> <span>✅ PDF subido — <a href="${url}" target="_blank" style="color: var(--primary);">Ver archivo</a></span>`;
  } catch (e) {
    pdfUploaded = false;
    statusEl.innerHTML = `<span class="dot red"></span> <span>❌ No hay PDF subido. Sube el archivo "SISTEMA ALFA.pdf"</span>`;
  }
}

// ===== UPLOAD PDF =====
async function uploadPDF() {
  const fileInput = document.getElementById('pdf-upload');
  const file = fileInput.files[0];
  const resultEl = document.getElementById('pdf-status-result');
  const btn = document.getElementById('btn-upload-pdf');

  if (!file) { showResult(resultEl, 'Selecciona un archivo PDF.', true); return; }
  if (file.type !== 'application/pdf') { showResult(resultEl, 'Solo se aceptan archivos PDF.', true); return; }
  if (file.size > 50 * 1024 * 1024) { showResult(resultEl, 'El archivo es demasiado grande. Máximo 50MB.', true); return; }

  btn.disabled = true;
  btn.textContent = '⏳ Subiendo...';

  try {
    const pdfRef = storage.ref('ebooks/sistema-alfa.pdf');
    await new Promise((resolve, reject) => {
      const task = pdfRef.put(file);
      task.on(firebase.storage.TaskEvent.STATE_CHANGED, (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        btn.textContent = `⏳ Subiendo... ${pct}%`;
      }, reject, resolve);
    });

    const url = await pdfRef.getDownloadURL();
    pdfUploaded = true;
    showResult(resultEl, `✅ PDF subido correctamente. <a href="${url}" target="_blank" style="color: var(--primary);">Ver PDF</a>`, false);
    document.getElementById('pdf-status-msg').innerHTML = `<span class="dot green"></span> <span>✅ PDF subido — <a href="${url}" target="_blank" style="color: var(--primary);">Ver archivo</a></span>`;
    fileInput.value = '';
  } catch (error) {
    console.error(error);
    showResult(resultEl, `❌ Error al subir: ${error.message}`, true);
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 Subir PDF';
  }
}

// ===== LABELS POR MÉTODO =====
const METHOD_LABELS = {
  paypal: { emoji: '💙', label: 'PayPal (@roxdevit)' },
  arq: { emoji: '🇦🇷', label: 'ARQ / Transferencia AR' },
  usd: { emoji: '🇺🇸', label: 'Cuenta USD' },
  eur: { emoji: '🇪🇺', label: 'Cuenta EUR' },
  crypto: { emoji: '₿', label: 'Cripto (USDT/USDc)' }
};

// ===== REGISTER SALE =====
async function registerSale() {
  const email = document.getElementById('buyer-email').value.trim();
  const method = document.getElementById('payment-method').value;
  const proof = document.getElementById('payment-proof').value.trim();
  const note = document.getElementById('payment-note').value.trim();
  const resultEl = document.getElementById('sale-result');

  if (!email) { showResult(resultEl, 'Ingresa el email del comprador.', true); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showResult(resultEl, 'El email no tiene un formato válido.', true); return; }
  if (!pdfUploaded) { showResult(resultEl, '⚠️ Primero debes subir el PDF del producto.', true); return; }

  try {
    const token = crypto.randomUUID();
    const pdfRef = storage.ref('ebooks/sistema-alfa.pdf');
    const downloadUrl = await pdfRef.getDownloadURL();
    const methodInfo = METHOD_LABELS[method] || { emoji: '💳', label: method };

    await db.collection('manual_sales').add({
      email: email.toLowerCase(),
      method, methodLabel: methodInfo.label,
      proof: proof || '', note: note || '',
      token, downloadUrl, status: 'active',
      createdAt: new Date().toISOString(), usedAt: null
    });

    const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', '');
    const downloadLink = `${baseUrl}index.html?token=${token}`;

    await sendEmailJS(EMAILJS_CONFIG.TEMPLATE_CONFIRMATION, {
      to_email: email, to_name: email.split('@')[0],
      download_link: downloadLink, product_name: 'SISTEMA ALFA',
      support_email: 'roxana@axistechai.com'
    });

    showResult(resultEl, `
      ✅ Enlace generado y enviado a <strong>${email}</strong><br><br>
      📧 <strong>Link de descarga:</strong><br>
      <a href="${downloadLink}" target="_blank" style="color: var(--primary); word-break: break-all;">${downloadLink}</a>
      <br><br>
      <button class="btn" onclick="copyToClipboard('${downloadLink}')" style="padding: 8px 16px; font-size: 0.8rem;">📋 Copiar enlace</button>
      <br><br>
      ${proof ? `📎 <strong>Comprobante guardado:</strong><br><span style="color: var(--text-dim); font-size: 0.85rem;">${proof}</span>` : ''}
    `, false);

    document.getElementById('buyer-email').value = '';
    document.getElementById('payment-proof').value = '';
    document.getElementById('payment-note').value = '';
    loadSalesHistory();
    loadPendingVerifications();
  } catch (error) {
    console.error(error);
    showResult(resultEl, `❌ Error al registrar: ${error.message}`, true);
  }
}

// ===== COPY TO CLIPBOARD =====
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    btn.textContent = '✅ Copiado!';
    setTimeout(() => { btn.textContent = '📋 Copiar enlace'; }, 2000);
  });
}

// ===== LOAD SALES HISTORY =====
async function loadSalesHistory() {
  const container = document.getElementById('sales-history');
  try {
    const snapshot = await db.collection('manual_sales').orderBy('createdAt', 'desc').limit(50).get();
    if (snapshot.empty) { container.innerHTML = '<div class="historial-empty">📭 No hay ventas registradas aún.</div>'; return; }

    let html = `<table><thead><tr><th>Email</th><th>Método</th><th>Comprobante</th><th>Estado</th><th>Fecha</th></tr></thead><tbody>`;
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      let methodTag = '';
      switch(data.method) {
        case 'paypal': methodTag = '<span class="tag paypal">💙 PayPal</span>'; break;
        case 'arq': methodTag = '<span class="tag" style="background:rgba(234,179,8,0.2);color:#eab308;">🇦🇷 ARQ</span>'; break;
        case 'usd': methodTag = '<span class="tag" style="background:rgba(34,197,94,0.2);color:#86efac;">🇺🇸 USD</span>'; break;
        case 'eur': methodTag = '<span class="tag" style="background:rgba(99,102,241,0.2);color:#818cf8;">🇪🇺 EUR</span>'; break;
        case 'crypto': methodTag = '<span class="tag" style="background:rgba(250,204,21,0.2);color:#facc15;">₿ Crypto</span>'; break;
        default: methodTag = '<span class="tag" style="background:rgba(107,114,128,0.2);color:#9ca3af;">' + data.method + '</span>';
      }
      const statusTag = data.status === 'active' ? '<span class="tag ok">✅ Activo</span>' : '<span class="tag used">🔴 Usado</span>';
      const proofPreview = data.proof ? `<span style="cursor:pointer;color:var(--primary);font-size:0.75rem;" onclick="alert('📎 Comprobante:\\n\\n${data.proof.replace(/'/g, "\\'")}')">📎 Ver</span>` : '<span style="color:#555;">—</span>';
      html += `<tr><td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;">${data.email}${data.note ? '<br><span style="color:#555;font-size:0.7rem;">📝 '+data.note+'</span>' : ''}</td><td>${methodTag}</td><td>${proofPreview}</td><td>${statusTag}</td><td style="white-space:nowrap;font-size:0.75rem;">${date}</td></tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="historial-empty" style="color: #fda4af;">❌ Error al cargar historial: ${error.message}</div>`;
  }
}

// ===== LOAD PENDING VERIFICATIONS =====
async function loadPendingVerifications() {
  const container = document.getElementById('pending-list');
  try {
    const snapshot = await db.collection('pending_sales').where('status', '==', 'pending_verification').orderBy('createdAt', 'desc').limit(50).get();
    if (snapshot.empty) { container.innerHTML = '<div class="historial-empty">✅ No hay pagos pendientes de verificación</div>'; return; }

    let html = `<table><thead><tr><th>Email</th><th>Método</th><th>Fecha</th><th>Acción</th></tr></thead><tbody>`;
    snapshot.forEach(doc => {
      const data = doc.data();
      const docId = doc.id;
      const date = new Date(data.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      let methodTag = '';
      switch(data.method) {
        case 'paypal': methodTag = '<span class="tag paypal">💙 PayPal</span>'; break;
        case 'transfer': methodTag = '<span class="tag" style="background:rgba(234,179,8,0.2);color:#eab308;">💸 Transferencia</span>'; break;
        case 'crypto': methodTag = '<span class="tag" style="background:rgba(250,204,21,0.2);color:#facc15;">₿ Crypto</span>'; break;
        default: methodTag = '<span class="tag" style="background:rgba(107,114,128,0.2);color:#9ca3af;">' + data.method + '</span>';
      }
      html += `<tr><td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;">${data.email}</td><td>${methodTag}</td><td style="white-space:nowrap;font-size:0.75rem;">${date}</td>
        <td><div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn" onclick="approvePayment('${docId}','${data.email}','${data.method}')" style="padding:6px 14px;font-size:0.75rem;">✅ Aprobar</button>
          <button class="btn btn-danger" onclick="rejectPayment('${docId}','${data.email}')" style="padding:6px 14px;font-size:0.75rem;">❌ Rechazar</button>
        </div></td></tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="historial-empty" style="color: #fda4af;">❌ Error: ${error.message}</div>`;
  }
}

// ===== APPROVE PAYMENT =====
async function approvePayment(docId, email, method) {
  if (!pdfUploaded) { alert('⚠️ Primero debes subir el PDF del producto.'); return; }
  if (!confirm(`✅ ¿Aprobar pago de ${email}? Se generará su enlace de descarga.`)) return;

  try {
    const token = crypto.randomUUID();
    const pdfRef = storage.ref('ebooks/sistema-alfa.pdf');
    const downloadUrl = await pdfRef.getDownloadURL();
    const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', '');
    const downloadLink = `${baseUrl}index.html?token=${token}`;

    await db.collection('pending_sales').doc(docId).update({ status: 'approved', verifiedAt: new Date().toISOString(), adminNote: 'Aprobado manualmente' });

    const methodInfo = METHOD_LABELS[method] || { emoji: '💳', label: method };
    await db.collection('manual_sales').add({
      email: email.toLowerCase(), method, methodLabel: methodInfo.label,
      proof: 'Verificado desde "Ya pagué"', note: 'Auto-aprobación desde pending_sales',
      token, downloadUrl, status: 'active',
      createdAt: new Date().toISOString(), usedAt: null
    });

    await sendEmailJS(EMAILJS_CONFIG.TEMPLATE_CONFIRMATION, {
      to_email: email, to_name: email.split('@')[0],
      download_link: downloadLink, product_name: 'SISTEMA ALFA',
      support_email: 'roxana@axistechai.com'
    });

    alert(`✅ Pago aprobado. Email de descarga enviado a ${email}`);
    loadPendingVerifications();
    loadSalesHistory();
  } catch (error) {
    console.error(error);
    alert(`❌ Error al aprobar: ${error.message}`);
  }
}

// ===== REJECT PAYMENT =====
async function rejectPayment(docId, email) {
  const reason = prompt(`❌ Motivo del rechazo para ${email}:`, 'No recibimos el pago');
  if (!reason) return;
  if (!confirm(`¿Rechazar pago de ${email}? Motivo: "${reason}"`)) return;

  try {
    await db.collection('pending_sales').doc(docId).update({ status: 'rejected', verifiedAt: new Date().toISOString(), adminNote: reason });
    await sendEmailJS(EMAILJS_CONFIG.TEMPLATE_REJECTED, {
      to_email: email, to_name: email.split('@')[0],
      reason, support_email: 'roxana@axistechai.com', product_name: 'SISTEMA ALFA'
    });
    alert(`❌ Pago rechazado. Email enviado a ${email} con el motivo.`);
    loadPendingVerifications();
  } catch (error) {
    console.error(error);
    alert(`❌ Error al rechazar: ${error.message}`);
  }
}

// ===== LOAD LEADS =====
async function loadLeads() {
  const container = document.getElementById('leads-list');
  try {
    const snapshot = await db.collection('leads').orderBy('createdAt', 'desc').limit(50).get();
    if (snapshot.empty) { container.innerHTML = '<div class="historial-empty">📭 No hay leads capturados aún</div>'; return; }

    let html = `<table><thead><tr><th>Email</th><th>Método de interés</th><th>Notificado</th><th>Fecha</th></tr></thead><tbody>`;
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      let methodTag = '';
      switch(data.method) {
        case 'paypal': methodTag = '<span class="tag paypal">💙 PayPal</span>'; break;
        case 'transfer': methodTag = '<span class="tag" style="background:rgba(234,179,8,0.2);color:#eab308;">💸 Transferencia</span>'; break;
        case 'crypto': methodTag = '<span class="tag" style="background:rgba(250,204,21,0.2);color:#facc15;">₿ Crypto</span>'; break;
        default: methodTag = '<span class="tag">' + data.method + '</span>';
      }
      html += `<tr><td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;">${data.email}</td><td>${methodTag}</td><td>${data.notified ? '✅ Sí' : '❌ No'}</td><td style="white-space:nowrap;font-size:0.75rem;">${date}</td></tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="historial-empty" style="color: #fda4af;">❌ Error: ${error.message}</div>`;
  }
}

// ===== HELPERS =====
function showResult(el, message, isError) {
  el.innerHTML = `<div class="status ${isError ? 'error' : 'success'}">${message}</div>`;
}

