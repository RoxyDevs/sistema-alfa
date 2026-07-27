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
const db = firebase.firestore();

// ===== CONFIGURACIÓN EMAILJS =====
// Lee estas de tu cuenta en https://dashboard.emailjs.com
// Son 100% seguras para usarse desde frontend
const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'TU_PUBLIC_KEY',          // Reemplazar con tu Public Key de EmailJS
  SERVICE_ID: 'TU_SERVICE_ID',         // Reemplazar con tu Service ID
  TEMPLATE_INTEREST: 'template_interes',  // Template para "Gracias por tu interés"
  TEMPLATE_REMINDER: 'template_recordatorio', // Template para recordatorio 24h
  TEMPLATE_CONFIRMATION: 'template_confirmacion' // Template para "Compra aprobada - link descarga"
};

// Inicializar EmailJS
(function() {
  try {
    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.PUBLIC_KEY !== 'TU_PUBLIC_KEY') {
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
      console.log('✅ EmailJS initialized');
    }
  } catch(e) {
    console.warn('EmailJS no configurado aún. Configúralo en EMAILJS_CONFIG');
  }
})();

// Helper: enviar email via EmailJS
async function sendEmailJS(templateId, templateParams) {
  if (EMAILJS_CONFIG.PUBLIC_KEY === 'TU_PUBLIC_KEY') {
    console.log('📧 EmailJS no configurado — saltando envío de email. Template:', templateId, 'Params:', templateParams);
    return { status: 'skipped', message: 'EmailJS not configured' };
  }
  try {
    const response = await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, templateId, templateParams);
    console.log(`✅ Email sent: ${templateId}`, response);
    return response;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { status: 'error', message: error.message };
  }
}

// Helper: mostrar resultado
function showResult(el, message, isError) {
  el.innerHTML = `<div class="status ${isError ? 'error' : 'success'}">${message}</div>`;
}

// =====================================================================
// FASE 1: REVELAR DATOS DE PAGO SOLO CON EMAIL
// =====================================================================

const METHOD_LABELS = {
  paypal: { emoji: '💙', label: 'PayPal (@roxdevit)' },
  transfer: { emoji: '💸', label: 'ARQ / Transferencia' },
  crypto: { emoji: '₿', label: 'Cripto (USDT/USDc)' }
};

async function revealPaymentData(method) {
  const emailInput = document.getElementById(`${method}-email`);
  const statusEl = document.getElementById(`${method}-email-status`);
  const revealBox = document.getElementById(`${method}-reveal-box`);
  const sensitiveData = document.getElementById(`${method}-sensitive-data`);
  const email = emailInput.value.trim();

  // Validar email
  if (!email) {
    statusEl.innerHTML = '<span style="color:#fda4af;">❌ Ingresa tu email primero</span>';
    emailInput.focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    statusEl.innerHTML = '<span style="color:#fda4af;">❌ Email no válido</span>';
    emailInput.focus();
    return;
  }

  statusEl.innerHTML = '<span style="color:var(--accent);">⏳ Guardando...</span>';

  try {
    const methodInfo = METHOD_LABELS[method] || { emoji: '💳', label: method };

    // 1. Guardar lead en Firestore
    await db.collection('leads').add({
      email: email.toLowerCase(),
      method: method,
      methodLabel: methodInfo.label,
      source: window.location.href,
      createdAt: new Date().toISOString(),
      notified: false,
      reminded: false
    });

    // 2. Revelar datos sensibles con animación
    sensitiveData.style.display = 'block';
    sensitiveData.style.animation = 'fadeIn 0.5s ease-in forwards';
    revealBox.style.display = 'none';

    // 3. Enviar Email 1: Interés — "Gracias, aquí tienes los datos"
    await sendEmailJS(EMAILJS_CONFIG.TEMPLATE_INTEREST, {
      to_email: email,
      to_name: email.split('@')[0],
      method_name: methodInfo.label,
      method_emoji: methodInfo.emoji,
      product_name: 'SISTEMA ALFA',
      price: '$8 USD',
      site_url: window.location.origin,
      support_email: 'roxana@axistechai.com'
    });

    // 4. Programar recordatorio 24h (se guarda en Firestore, el admin o un cron lo procesa)
    // Guardamos un pending reminder
    await db.collection('reminders').add({
      email: email.toLowerCase(),
      method: method,
      type: '24h_reminder',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      sent: false,
      createdAt: new Date().toISOString()
    });

    statusEl.innerHTML = `<span style="color:#86efac;">✅ Datos revelados — Revisa tu email con la información</span>`;
    emailInput.disabled = true;

  } catch (error) {
    console.error(error);
    statusEl.innerHTML = `<span style="color:#fda4af;">❌ Error: ${error.message}</span>`;
  }
}

// =====================================================================
// FASE 2: CONFIRMAR PAGO — "YA PAGUÉ"
// =====================================================================

async function confirmPayment(method, btn) {
  const emailInput = document.getElementById(`${method}-email`);
  const statusEl = document.getElementById(`${method}-confirm-status`);
  const email = emailInput.value.trim();

  if (!email) {
    statusEl.innerHTML = '<span style="color:#fda4af;">❌ No se encontró tu email. Recarga e intenta de nuevo.</span>';
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Enviando...';

  try {
    const methodInfo = METHOD_LABELS[method] || { emoji: '💳', label: method };

    // Guardar en pending_sales para que el admin lo verifique
    await db.collection('pending_sales').add({
      email: email.toLowerCase(),
      method: method,
      methodLabel: methodInfo.label,
      status: 'pending_verification',
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      adminNote: '',
      token: null,
      downloadUrl: null
    });

    // Actualizar UI con mensaje de éxito
    statusEl.innerHTML = `
      <div style="background: rgba(34,197,94,0.1); border-radius: 10px; padding: 16px; border: 1px solid rgba(34,197,94,0.3);">
        <p style="color: #86efac; font-weight: 600; margin-bottom: 5px;">✅ ¡Recibimos tu confirmación!</p>
        <p style="color: var(--text-dim); font-size: 0.85rem;">Estamos verificando tu pago. En breve recibirás un email con tu enlace de descarga.</p>
        <p style="color: var(--text-dim); font-size: 0.8rem; margin-top: 8px;">⏱️ Tiempo estimado: 5-15 minutos en horario laboral.</p>
      </div>
    `;

    // Enviar email de notificación al admin
    await sendEmailJS('template_admin_notify', {
      to_email: 'roxana@axistechai.com',
      buyer_email: email,
      method_name: methodInfo.label,
      method_emoji: methodInfo.emoji,
      status: 'Pendiente de verificación',
      admin_url: window.location.origin + '/admin.html'
    });

    btn.textContent = '✅ Confirmado';
    btn.style.background = 'linear-gradient(135deg,#16a34a,#15803d)';

  } catch (error) {
    console.error(error);
    statusEl.innerHTML = `<span style="color:#fda4af;">❌ Error al confirmar: ${error.message}. Escríbenos a roxana@axistechai.com</span>`;
    btn.disabled = false;
    btn.textContent = '✅ Ya pagué — Confirmar mi compra';
  }
}

// =====================================================================
// VALIDACIÓN DE TOKEN DE DESCARGA
// =====================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (token) {
    const descargaSection = document.getElementById('descarga');
    descargaSection.style.display = 'block';
    descargaSection.scrollIntoView({ behavior: 'smooth' });
    await validateToken(token);
  }
});

async function validateToken(token) {
  const msgEl = document.getElementById('download-message');
  const btnContainer = document.getElementById('download-button-container');
  const infoEl = document.getElementById('download-info');

  try {
    const snapshot = await db.collection('manual_sales')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      msgEl.textContent = '❌ Enlace inválido o no encontrado.';
      msgEl.style.color = '#fda4af';
      btnContainer.innerHTML = '<p style="color: var(--text-dim);">Si compraste el producto, contáctanos a <strong style="color: var(--secondary);">roxana@axistechai.com</strong></p>';
      return;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    if (data.status === 'used') {
      msgEl.textContent = '🔴 Este enlace de descarga ya fue utilizado.';
      msgEl.style.color = '#fda4af';
      btnContainer.innerHTML = '';
      infoEl.innerHTML = '<p style="color: var(--text-dim);">Si necesitas ayuda, escríbenos a <strong style="color: var(--secondary);">roxana@axistechai.com</strong></p>';
      return;
    }

    msgEl.textContent = '✅ Tu enlace está listo. Haz clic para descargar el PDF.';
    msgEl.style.color = '#86efac';

    btnContainer.innerHTML = `
      <a class="cta-button" href="${data.downloadUrl}" target="_blank" rel="noopener" id="download-btn" style="font-size: 1.1rem; padding: 20px 40px;">
        📥 DESCARGAR SISTEMA ALFA
      </a>
    `;

    infoEl.innerHTML = `
      <p>📧 Email: <strong>${data.email}</strong></p>
      <p>💳 Método: <strong>${data.methodLabel || data.method}</strong></p>
      <p style="margin-top: 10px; color: #555;">Este enlace expirará después de la descarga.</p>
    `;

    document.getElementById('download-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        await db.collection('manual_sales').doc(doc.id).update({
          status: 'used',
          usedAt: new Date().toISOString()
        });

        window.open(data.downloadUrl, '_blank');

        msgEl.textContent = '📥 Descarga completada. ¡Gracias por tu compra!';
        msgEl.style.color = '#86efac';
        btnContainer.innerHTML = `
          <div style="padding: 20px; background: rgba(34,197,94,0.1); border-radius: 12px; border: 1px solid rgba(34,197,94,0.3);">
            <p style="color: #86efac; font-weight: 600;">✅ PDF descargado exitosamente</p>
            <p style="color: var(--text-dim); font-size: 0.9rem; margin-top: 8px;">Recuerda revisar también tus bonos en el PDF.</p>
          </div>
        `;
        infoEl.innerHTML = '';
      } catch (error) {
        console.error('Error al marcar como usado:', error);
        window.open(data.downloadUrl, '_blank');
      }
    });

  } catch (error) {
    console.error(error);
    msgEl.textContent = '❌ Error al validar el enlace. Intenta de nuevo.';
    msgEl.style.color = '#fda4af';
    btnContainer.innerHTML = `<p style="color: var(--text-dim);">Error: ${error.message}</p>`;
  }
}

// ===== CRYPTO TABS (USDT / USDc) =====
function switchCrypto(coin) {
  const usdt = document.getElementById('crypto-usdt');
  const usdc = document.getElementById('crypto-usdc');
  const tabUsdt = document.getElementById('tab-usdt');
  const tabUsdc = document.getElementById('tab-usdc');

  if (!usdt || !usdc) return;

  if (coin === 'usdt') {
    usdt.style.display = 'block';
    usdc.style.display = 'none';
    tabUsdt.style.background = '#6366f1';
    tabUsdt.style.borderColor = '#6366f1';
    tabUsdt.style.color = '#fff';
    tabUsdc.style.background = 'transparent';
    tabUsdc.style.borderColor = '#334155';
    tabUsdc.style.color = 'var(--text-dim)';
  } else {
    usdt.style.display = 'none';
    usdc.style.display = 'block';
    tabUsdc.style.background = '#6366f1';
    tabUsdc.style.borderColor = '#6366f1';
    tabUsdc.style.color = '#fff';
    tabUsdt.style.background = 'transparent';
    tabUsdt.style.borderColor = '#334155';
    tabUsdt.style.color = 'var(--text-dim)';
  }
}

