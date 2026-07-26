# ✅ TODO - Implementación de Correcciones SISTEMA ALFA

## Paso 1 🔴 — Corregir ruta de imagen en Hero ✅
- [x] index.html: Cambiar `src="Imagen2.png"` → `src="assets/images/Imagen2.png"`

## Paso 2 🔴 — Mejorar reglas de seguridad ✅
- [x] firestore.rules: Restringir acceso solo a escritura validada (create con validación de campos, update/delete denegado)
- [x] storage.rules: Restringir acceso — solo lectura pública, escritura solo a PDFs <50MB en ebooks/

## Paso 3 🟡 — Reemplazar placeholders con imágenes reales ✅
- [x] index.html: Reemplazar placeholder mockup con imagen real (`assets/images/imagen1.png`)
- [x] index.html: Reemplazar placeholder garantía con diseño mejorado (sin placeholder genérico)

## Paso 4 🟡 — Corregir error asíncrono en Firebase Storage ✅
- [x] app.js: Corregido uso de UploadTask con Promise manual + evento STATE_CHANGED para progreso
- [x] app.js: Agregada validación de tipo PDF y tamaño máximo 50MB

## Paso 5 🟢 — Agregar Meta Tags SEO/OG ✅
- [x] index.html: Agregados meta description, keywords, author, robots
- [x] index.html: Agregados Open Graph tags (og:title, og:description, og:image, og:url)
- [x] index.html: Agregados Twitter Cards tags

## Paso 6 🟢 — Agregar sección de Bonos/Regalos ✅
- [x] index.html: Agregada sección con 3 bonos (Checklist, Plantilla Auditoría, Audio-guía Meditación)
- [x] index.html: Incluye valores de cada bono y total de $56 USD

## Paso 7 🟢 — Agregar sección de video testimonial ✅
- [x] index.html: Agregada sección con 2 videos MP4 de assets/ con posters de imágenes

