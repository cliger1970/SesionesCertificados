# 🎓 EduSuite Pro — Generador de Certificados con QR & Planificador Curricular CNEB con Gemini AI

> Plataforma SaaS integral para instituciones educativas, docentes, formadores y conferencistas. Diseña y emite certificados con validación QR inviolable, genera sesiones de aprendizaje alineadas al Currículo Nacional (CNEB) del MINEDU, rúbricas analíticas y evaluaciones interactivas con inteligencia artificial.

---

## ⚡ Inicio Rápido (1 Solo Clic - Sin Conocimientos Técnicos)

Para usar la aplicación en tu computadora con Windows:

1. **Haz doble clic en el archivo:**
   ```text
   iniciar.bat
   ```
2. **¡Y listo!** El instalador automático se encargará de todo:
   - Detecta si tienes **Node.js** instalado (si no lo tienes, lo descarga e instala automáticamente).
   - Instala todas las librerías necesarias.
   - Compila la plataforma y **abre tu navegador web automáticamente** en `http://localhost:3000`.

---

## ✨ Características Principales

### 🏆 1. Diseñador & Generador de Certificados Inteligente
- **Editor Visual WYSIWYG:** Sube cualquier imagen como plantilla de fondo, arrastra y redimensiona elementos (nombres, motivos, fechas, códigos e insignias).
- **Optimizador Automático WebP:** Al subir una imagen de fondo, se comprime en el navegador a formato WebP al 95%. Si el resultado es más ligero se utiliza la versión optimizada; si no, se preserva el original para asegurar el menor peso y máxima nitidez.
- **Barra de Herramientas Tipográficas:** Negrita, cursiva, subrayado, tachado, fuentes elegantes y alineaciones (izquierda, centro, derecha, justificado).
- **Emisión Masiva desde Excel:** Sube archivos `.xlsx`, `.csv` o pega celdas copiadas directamente de Excel para emitir decenas de certificados en segundos.
- **Gestor Multi-Plantilla:** Crea múltiples diseños para diferentes cursos, talleres o grados.
- **Formulario Público de Auto-Emisión (`/formulario-emision?templateId=...`):**
  - Cada plantilla genera su propio enlace público para compartir a los participantes.
  - **Mecanismo Anti-Duplicidad:** Si un participante ya se registró, el sistema le permite editar sus datos y actualiza su certificado sin duplicar registros.
- **Portal de Validación QR y Descarga en PDF (`/verificar`):**
  - Validador público de autenticidad mediante código QR o ID único.
  - Permite descargar el certificado original en **PDF de alta resolución (2x pixel ratio)** con total fidelidad gráfica.

---

### 📚 2. Generador de Sesiones de Aprendizaje Oficiales (MINEDU - CNEB)
- **Alineación con el Currículo Nacional de la Educación Básica (CNEB):**
  - Selección de Áreas, Grados, Secciones, Docente y Duración.
  - Competencias, Capacidades, Desempeños Precisados y Evidencias de Aprendizaje.
  - Competencias Transversales y Enfoques Transversales con valores.
  - **Secuencia Didáctica Oficial en 3 Momentos:**
    1. **Inicio:** Motivación, Saberes Previos, Conflicto Cognitivo y Propósito.
    2. **Desarrollo:** Metodología Activa y acompañamiento docente con actividades paso a paso.
    3. **Cierre:** Metacognición reflexiva y síntesis evaluativa.
- **Rúbrica de Evaluación Analítica:** Matriz con los 4 niveles oficiales: **AD (Destacado)**, **A (Logrado)**, **B (En Proceso)** y **C (En Inicio)**.
- **Evaluación Interactiva para Alumnos:** Examen objetivo que los estudiantes pueden resolver en pantalla con calificación instantánea y justificación pedagógica.
- **Exportación & Persistencia:**
  - Descarga directa en **Word (.docx)** y **PDF**.
  - Almacenamiento local para editar, duplicar o consultar sesiones creadas.

---

### 🤖 3. Motor Dinámico de IA con Gemini & Failover Multi-Key
- **Modelos Recientes:** Integrado con los modelos más modernos de Google Gemini (serie **Gemini 3.5 Flash-Lite**, **Gemini 3.8 Flash**, **Gemini 3.6 Flash** y **Gemini 2.5**).
- **Detección Dinámica:** Detecta automáticamente en tiempo real los modelos disponibles en tu cuenta de Google AI Studio.
- **Failover Automático (Multi-Key):** Puedes registrar una o múltiples API Keys. Si una clave alcanza su límite de cuota (*Rate Limit 429*), el motor pasa a la siguiente clave sin detener la generación.

---

## 💻 Ejecución Manual (Opcional para Desarrolladores)

Si prefieres ejecutarlo mediante la terminal:

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar para producción
npm run build

# 3. Iniciar el servidor
npm run start
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

---

## 🔒 Privacidad y Almacenamiento

- Todos los datos de plantillas, certificados emitidos y sesiones de aprendizaje se almacenan de forma local en la carpeta `/data` del proyecto.
- No se envían datos sensibles a servidores de terceros más allá de las consultas al API de Google Gemini para la generación curricular.

---
Desarrollado con ❤️ para docentes y formadores.
