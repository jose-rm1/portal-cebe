# Portal web del CEBE "Félix y Carolina de Repetti" (Tacna)

Sitio institucional hecho con HTML, CSS y JavaScript, sin dependencias externas. Funciona en GitHub Pages y en cualquier hosting.

## Estructura

```
portal-cebe/
├── index.html          Estructura de todas las vistas
├── css/styles.css      Diseño (colores, tamaños, modo oscuro, alto contraste)
├── js/app.js           Navegación, menú, modo claro/oscuro, accesibilidad, formularios de demostración
├── js/render.js        Dibuja el contenido que viene de data/
├── data/               CONTENIDO que se actualiza sin tocar el diseño
│   ├── noticias.js     Noticias
│   ├── avisos.js       Comunicados y avisos
│   ├── calendario.js   Calendario escolar y cívico
│   ├── preguntas.js    Preguntas frecuentes
│   ├── documentos.js   Documentos (hoy vacío)
│   ├── galeria.js      Fotos y videos
│   └── directorio.js   Personal: nombre, cargo, grado y sección
├── img/                Logo, fotos e ilustraciones
├── video/              Videos
└── documentos/         PDF autorizados
```

## Cómo verlo en Visual Studio Code

1. Abre la carpeta `portal-cebe` (Archivo > Abrir carpeta).
2. Instala la extensión **Live Server** y haz clic en "Go Live". También puedes abrir `index.html` con doble clic.

## Cómo actualizar el contenido

Abre el archivo de `data/` que corresponda y copia un bloque existente.

- **Noticia:** en `data/noticias.js` copia un bloque `{ ... }`, cámbiale título, fecha, resumen e imagen y ponlo al inicio de la lista. Pon la foto en `img/`.
- **Comunicado:** en `data/avisos.js`. Con `"destacado": true` se muestra en rojo; con `"archivado": true` pasa a "Comunicados anteriores".
- **Documento:** guarda el PDF en `documentos/` y agrégalo en `data/documentos.js`.
- **Calendario, preguntas, galería, directorio:** el mismo procedimiento.

Reglas: no publiques datos sin confirmar con la Dirección, ni fotos de estudiantes sin autorización de las familias, ni teléfonos personales del personal. Después de cada cambio, vuelve a subir los archivos a GitHub.

## Publicar en GitHub Pages

Sube **el contenido** de esta carpeta (no la carpeta en sí) a la raíz del repositorio, de modo que `index.html` quede en la raíz. En Settings > Pages elige la rama `main` y la carpeta `/ (root)`. Si cambias el nombre del repositorio o usuario, actualiza las direcciones `og:url` y `og:image` de `index.html` para que la vista previa al compartir funcione.

## Qué es real y qué es demostración

- **Real:** todas las vistas informativas, el calendario, el directorio, el modo claro/oscuro y las opciones de accesibilidad.
- **Demostración (no envía ni guarda datos):** el formulario de contacto y la Mesa de Partes Virtual.
- **No existe todavía:** panel de administración, inicio de sesión y base de datos.

## Backend

La Fase 1 (base de datos MySQL y API pública) está en **LEEME-BACKEND.md** y el panel de administración (Fase 2) en **LEEME-PANEL.md**.

## Preparado para el backend

`js/render.js` lee `window.CEBE` (los archivos de `data/`). Cuando exista la API, esos mismos datos llegarán por `fetch` y el diseño no cambia. `render.js` inserta el texto con `textContent` para evitar código malicioso. El panel de administración y la Mesa de Partes necesitarán autenticación y autorización en el servidor, validación de archivos y protección de datos personales (Ley N.° 29733).
