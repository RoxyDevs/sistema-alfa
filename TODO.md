# ✅ TODO - Sistema de Pagos Alternativos + Admin Panel

## Objetivo
Permitir ventas por fuera de Hotmart (PayPal, Transferencia, Cripto) con entrega automatizada del PDF, captura de leads y automatización de emails.

---

## ✅ Sistema Base Completo

---

## 🚀 FASE: Privacidad + Captura de Leads + Automatización Email ✅

### Fase 1: 🔒 Ocultar datos bancarios + Capturar email ✅
- [x] Datos bancarios ocultos por defecto en cada método de pago (PayPal, Transfer, Crypto)
- [x] Input de email + botón "🔓 Mostrar datos de pago" en cada método
- [x] Al hacer clic: guarda email en Firestore (`leads`) + revela datos sensibles
- [x] Animación fade-in al revelar datos

### Fase 2: ✅ Botón "Ya pagué / Confirmar compra" ✅
- [x] Botón "✅ Ya pagué — Confirmar mi compra" visible después de revelar datos
- [x] Guarda en `pending_sales` con status `pending_verification`
- [x] Mensaje de confirmación visual claro al usuario

### Fase 3: ✉️ Automatización con EmailJS ✅
- [x] SDK EmailJS agregado a `index.html` y `admin.html`
- [x] Email 1 (Interés): Se envía al revelar datos de pago
- [x] Email 2 (Recordatorio 24h): Se programa en colección `reminders`
- [x] Email 3 (Confirmación): Admin aprueba → envía link de descarga
- [x] Email 4 (Rechazo): Admin rechaza → notifica motivo
- [x] Notificación al admin cuando alguien confirma pago

### Fase 4: 🛠️ Admin Panel Mejorado ✅
- [x] Sección "⏳ Verificaciones Pendientes" con tabla + botones Aprobar/Rechazar
- [x] Sección "📧 Leads Capturados" con historial
- [x] Botón ✅ Aprobar: genera token + `manual_sale` + envía email con link
- [x] Botón ❌ Rechazar: actualiza estado + envía email con motivo

### Fase 5: 🔒 Reglas Firebase ✅
- [x] Reglas para colección `leads` (create público validado)
- [x] Reglas para colección `pending_sales` (create público, update admin)
- [x] Reglas para colección `reminders` (create público)

---

## ⚠️ Único Pendiente: Configurar EmailJS

Para que los emails funcionen, debes:

1. **Crear cuenta gratis** en https://dashboard.emailjs.com (200 emails/mes)
2. **Conectar un servicio de email** (Gmail, Outlook, etc.) → obtienes un **Service ID**
3. **Crear 5 templates** con estos nombres (deben coincidir con los del código):

| Template ID | Propósito | Variables |
|-------------|-----------|-----------|
| `template_interes` | Email de interés con datos de pago | `to_email`, `to_name`, `method_name`, `method_emoji`, `product_name`, `price`, `site_url`, `support_email` |
| `template_recordatorio` | Recordatorio 24h | `to_email`, `to_name`, `product_name`, `support_email`, `site_url` |
| `template_confirmacion` | Link de descarga aprobado | `to_email`, `to_name`, `download_link`, `product_name`, `support_email` |
| `template_rechazado` | Pago rechazado | `to_email`, `to_name`, `reason`, `support_email`, `product_name` |
| `template_admin_notify` | Notificación al admin | `to_email`, `buyer_email`, `method_name`, `method_emoji`, `status`, `admin_url` |

4. **Reemplazar** en `app.js` y `admin.js`:
   - `TU_PUBLIC_KEY` → tu Public Key de EmailJS
   - `TU_SERVICE_ID` → tu Service ID

---

## Archivos modificados:
1. `index.html` ✅ — Datos ocultos, captura email, botones confirmar, EmailJS SDK
2. `app.js` ✅ — `revealPaymentData()`, `confirmPayment()`, EmailJS, validación token
3. `admin.html` ✅ — Nuevas secciones Pendientes + Leads, EmailJS SDK
4. `admin.js` ✅ — `approvePayment()`, `rejectPayment()`, `loadLeads()`, `loadPendingVerifications()`
5. `firestore.rules` ✅ — Reglas para `leads`, `pending_sales`, `reminders`

