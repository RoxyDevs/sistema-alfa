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

const form = document.getElementById('delivery-form');
const statusEl = document.getElementById('delivery-status');
const linkEl = document.getElementById('delivery-link');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const buyerName = document.getElementById('buyerName').value.trim();
  const buyerEmail = document.getElementById('buyerEmail').value.trim();
  const pdfFile = document.getElementById('pdfFile').files[0];

  if (!buyerName || !buyerEmail || !pdfFile) {
    showStatus('Completa todos los campos antes de subir el PDF.', true);
    return;
  }

  // Validar tipo de archivo
  if (pdfFile.type !== 'application/pdf') {
    showStatus('Solo se aceptan archivos PDF.', true);
    return;
  }

  // Validar tamaño (máx 50MB)
  if (pdfFile.size > 50 * 1024 * 1024) {
    showStatus('El archivo es demasiado grande. El tamaño máximo es 50MB.', true);
    return;
  }

  showStatus('Subiendo PDF a Firebase Storage...');

  try {
    const fileName = `${Date.now()}-${pdfFile.name.replace(/\s+/g, '_')}`;
    const storageRef = storage.ref(`ebooks/${fileName}`);

    // Usar promesa manual para UploadTask (SDK v8 compatible)
    const snapshot = await new Promise((resolve, reject) => {
      const task = storageRef.put(pdfFile);
      task.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        (snap) => {
          const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          statusEl.textContent = `Subiendo... ${progress}%`;
        },
        reject,
        resolve
      );
    });

    const downloadUrl = await snapshot.ref.getDownloadURL();

    const saleRecord = {
      buyerName,
      buyerEmail,
      fileName,
      downloadUrl,
      uploadedAt: new Date().toISOString()
    };

    await db.collection('sales').add(saleRecord);

    showStatus(`✅ Entrega registrada correctamente para ${buyerName}.`, false);
    linkEl.innerHTML = `<a class="cta-button" href="${downloadUrl}" target="_blank" rel="noopener">📄 Abrir PDF entregado</a>`;
    form.reset();
  } catch (error) {
    console.error(error);
    showStatus(`❌ No se pudo completar la entrega: ${error.message}`, true);
  }
});

function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = `delivery-status ${isError ? 'error' : 'success'}`;
  if (!message) {
    statusEl.className = 'delivery-status';
  }
}
