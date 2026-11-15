# Panel de administración (Fase 2)

Dirección: `http://localhost/portal-cebe/admin/` (en el servidor: `https://TU-DOMINIO/admin/`). No hay ningún botón en el sitio que lleve al panel; se entra escribiendo la dirección.

## Diseño del panel

El panel usa **Bootstrap 5** (barra lateral azul con los colores del logo, tarjetas, tablas y botones) y los íconos de Bootstrap Icons. Se cargan desde internet (jsDelivr, versión fija) y tu navegador los guarda después. Si no hay internet, el panel sigue funcionando con un diseño más simple.

Para usarlo **sin internet**, descarga estos dos paquetes, copia sus archivos a la carpeta `admin/vendor/` y cambia las dos direcciones `https://cdn.jsdelivr.net/...` de `admin/index.html` por `vendor/bootstrap.min.css` y `vendor/bootstrap-icons.min.css` (las fuentes de los íconos van en `vendor/fonts/`):
- Bootstrap 5.3.3: https://getbootstrap.com/docs/5.3/getting-started/download/
- Bootstrap Icons 1.11.3: https://icons.getbootstrap.com/

## Primer ingreso

1. Las cuentas ya se crean con `tools/crear_usuario.php` (ver LEEME-BACKEND.md).
2. Entra con el usuario y la contraseña temporal. El panel te pedirá crear una contraseña nueva (mínimo 8 caracteres, sin tu usuario, no solo números y no una contraseña muy común).

## Quién puede qué

| | Administradora | Editora |
|---|---|---|
| Ver y editar contenido | Todas las secciones | Solo las secciones que se le asignen |
| Crear contenido | Sí | Sí, como **borrador** |
| Enviar a revisión | — | Sí (borrador → en revisión) |
| Publicar, quitar del sitio, archivar | Sí | No |
| Editar contenido ya publicado | Sí | No (lo pide a una administradora) |
| Eliminar | Cualquiera | Solo sus propios borradores |
| Usuarios, registro de actividad | Sí | No |

La **administradora principal** (la directora) tiene protecciones extra: nadie más puede editarla, desactivarla ni restablecer su contraseña, solo ella crea o nombra otras administradoras, y puede **transferir su cargo** a otra administradora activa.

## Flujo del contenido

1. La editora crea el elemento: queda como **borrador**.
2. Lo envía a **revisión**.
3. Una administradora lo revisa y pulsa **Publicar**. Recién entonces aparece en el sitio.
4. Para sacarlo del sitio: **Quitar del sitio** (vuelve a borrador) o **Archivar**.

Las administradoras también pueden usar **Guardar y publicar** en el formulario.

## Usuarios (solo administradoras)

- **Nueva cuenta:** usuario, nombre, correo (opcional), rol, secciones y contraseña temporal (hay un botón para generarla). Entrégala en persona.
- **Desactivar:** la persona pierde el acceso **al instante**, aunque tenga la sesión abierta. Lo que publicó se conserva. Se puede reactivar.
- **Restablecer contraseña:** el sistema crea una temporal y la muestra **una sola vez**.
- Siempre debe quedar al menos una administradora activa.

## Archivos que se suben

- **Imágenes:** JPG, PNG o WebP, hasta 5 MB. Se vuelven a guardar quitando los datos ocultos (como la ubicación GPS) y se reducen a 1600 px de ancho si hace falta (requiere la extensión GD de PHP, que XAMPP trae).
- **Documentos:** solo PDF, hasta 8 MB.
- **Galería:** fotos o video MP4, hasta 9 MB (el límite de InfinityFree es de unos 10 MB por archivo).
- Se guardan en `uploads/` con nombres al azar. Esa carpeta no puede ejecutar programas.
- **Fotos y videos de estudiantes: solo con autorización de las familias.**

## Seguridad incorporada

- Contraseñas cifradas; bloqueo de 15 minutos tras 5 intentos fallidos, y límite de intentos por conexión.
- Sesión que se cierra tras 45 minutos sin actividad y a las 8 horas.
- Protección contra peticiones falsas (token CSRF) y verificación del origen.
- La autorización se comprueba **en el servidor** en cada petición; los botones ocultos no son la seguridad.
- Registro de actividad: ingresos, intentos fallidos, creación, edición, cambios de estado, eliminaciones y subidas.

## Cosas que aún no hace

- No borra del disco los archivos subidos que dejaron de usarse.
- No hay recuperación de contraseña por correo: una administradora la restablece.
- Las categorías de noticias son fijas (aniversario, actividades, familias, convivencia).
- La Mesa de Partes sigue siendo una demostración (Fase 3).
