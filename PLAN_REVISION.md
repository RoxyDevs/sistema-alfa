# Plan de Revisión - SISTEMA ALFA

## Problemas Identificados y Soluciones

---

### 1. 🔴 Imagen rota en el Hero (index.html)
**Problema:** La imagen del hero usa `src="Imagen2.png"` pero el archivo está en `assets/images/Imagen2.png`
**Solución:** Corregir la ruta en index.html línea 93.

---

### 2. 🔴 Reglas de Seguridad (firestore.rules + storage.rules)
**Problema:** Actualmente `allow read, write: if true` en ambos — cualquiera puede leer/escribir.
**Solución:**
- **Firestore:** Restringir escritura a solicitudes autenticadas. Como no hay auth, al menos validar estructura de datos.
- **Storage:** Restringir a solo escritura autenticada. Para lectura del PDF público, permitir solo lectura.

---

### 3. 🟡 Placeholders de imagen sin reemplazar (index.html)
**Problema:** Dos `image-placeholder` con texto genérico:
- "Mockup eBook Interactivo (500x500px)" 
- "Garantía de Satisfacción"
**Solución:** Reemplazar con imágenes reales de `assets/images/`.

---

### 4. 🟡 Error asíncrono en subida Firebase (app.js)
**Problema:** `storageRef.put()` retorna un `UploadTask`, no una Promise. El `await` no funciona correctamente.
**Solución:** Usar el método correcto con `.then()` o usar `uploadBytes()` y `getDownloadURL()` de Firebase Storage v9+.

---

### 5. 🟢 Meta Tags SEO / Open Graph (index.html)
**Problema:** Faltan meta tags para SEO y redes sociales.
**Solución:** Agregar meta description, keywords, Open Graph (og:title, og:description, og:image, og:url), Twitter Cards.

---

### 6. 🟢 Agregar sección de Bonos/Regalos (index.html)
**Problema:** No hay sección que muestre los bonos incluidos (importante para conversión).
**Solución:** Agregar sección atractiva con los bonos del producto.

---

### 7. 🟢 Videos sin usar (index.html)
**Problema:** Hay 3 videos MP4 en `assets/` pero no se utilizan en la página.
**Solución:** Agregar una sección de video testimonial o demostrativo para aumentar credibilidad.

---

## Archivos a modificar:
1. `index.html` — Correcciones de rutas, placeholders, meta tags, nuevas secciones
2. `app.js` — Corrección en subida Firebase
3. `firestore.rules` — Reglas más seguras
4. `storage.rules` — Reglas más seguras

