# Backend (Fase 1): base de datos MySQL + API pública

Esta fase deja lista la base de datos y la API de lectura. El panel de administración (Fase 2) está explicado en **LEEME-PANEL.md**.

## Qué incluye

| Carpeta o archivo | Para qué sirve |
|---|---|
| `database/schema.sql` | Crea las tablas (contenido, usuarios, permisos y registro de actividad). |
| `database/datos_iniciales.sql` | Carga el contenido actual del sitio. **Solo para la primera instalación: borra el contenido que ya existiera.** |
| `api/publico.php` | Entrega el contenido publicado en formato JSON (una sola petición). |
| `api/estado.php` | Comprueba que la instalación funciona. |
| `config/config.ejemplo.php` | Plantilla de configuración. |
| `tools/crear_usuario.php` | Crea cuentas (administradora o editora), con contraseña cifrada. |

La página (`js/render.js`) pide los datos a `api/publico.php`. Si no hay servidor o falla, sigue mostrando los datos de `data/*.js`, así que nunca queda vacía.

## Instalación en tu computadora con XAMPP (Windows)

1. Instala **XAMPP** y, en su panel, inicia **Apache** y **MySQL**.
2. Copia la carpeta `portal-cebe` a `C:\xampp\htdocs\`.
3. Abre `http://localhost/phpmyadmin`:
   - Crea una base de datos llamada `cebe` con cotejamiento `utf8mb4_unicode_ci`.
   - Entra a ella, pestaña **Importar**, y carga primero `database/schema.sql` y luego `database/datos_iniciales.sql`.
4. En `C:\xampp\htdocs\portal-cebe\config\` copia `config.ejemplo.php` como `config.php`. En XAMPP los valores por defecto sirven (usuario `root`, clave vacía).
5. Abre `http://localhost/portal-cebe/api/estado.php`. Debe mostrar `"configuracion": "ok"`, `"base_datos": "ok"` y los conteos de registros (5 noticias, 13 preguntas, etc.).
6. Abre `http://localhost/portal-cebe/`. Para confirmar que la página usa la base de datos, cambia un título en phpMyAdmin (tabla `noticias`) y recarga con Ctrl+F5.

## Crear las cuentas de acceso

El ingreso será con **usuario** y contraseña (el panel llega en la Fase 2). Abre el "Símbolo del sistema" y ejecuta, por ejemplo:

```
C:\xampp\php\php.exe C:\xampp\htdocs\portal-cebe\tools\crear_usuario.php direccion "Nombre de la directora" administradora --principal --ejecutar
C:\xampp\php\php.exe C:\xampp\htdocs\portal-cebe\tools\crear_usuario.php secretaria "Nombre de la secretaria" administradora --ejecutar
```

El programa pide una contraseña temporal de al menos 8 caracteres. La persona la cambiará en su primer ingreso. Sin `--ejecutar`, muestra una sentencia SQL para pegar en phpMyAdmin.

## Mientras no exista el panel

Cuando la API está activa, **la base de datos manda**: los cambios en `data/*.js` ya no se ven. Para cambiar contenido, edita las tablas en phpMyAdmin (usa el estado `publicado` para que se muestre). Si prefieres editar `data/*.js`, no copies `config/config.php`; así el sitio sigue funcionando como antes.

## Subirlo a InfinityFree (después de probarlo en local)

1. En el panel de InfinityFree crea una base de datos MySQL. Anota el **host** (algo como `sqlXXX.infinityfree.com`), el **nombre**, el **usuario** y la **contraseña**: son distintos a los de XAMPP.
2. En su phpMyAdmin importa `schema.sql` y `datos_iniciales.sql`.
3. Sube todo el contenido de `portal-cebe` a la carpeta `htdocs` por FTP o por el administrador de archivos. Debe incluir las carpetas `api`, `config`, `database` y `tools`, con sus archivos `.htaccess`.
4. Crea `config/config.php` en el servidor con los datos del paso 1.
5. Abre `https://TU-DOMINIO/api/estado.php` para comprobarlo.
6. Las cuentas se crean sin la línea de comandos: ejecuta `crear_usuario.php` en tu computadora **sin** `--ejecutar`, y pega la sentencia SQL en el phpMyAdmin de InfinityFree.

Recomendaciones: mantén la página y la API en el **mismo dominio**, haz copias de seguridad de la base de datos con frecuencia (InfinityFree no las hace por ti) y verifica en tu panel los límites actuales de visitas diarias y de tamaño.

## Seguridad

- `config/config.php` guarda las claves: **nunca lo subas a GitHub** (ya está en `.gitignore`).
- Las carpetas `config`, `database`, `tools` y `api/lib` tienen un `.htaccess` que bloquea su acceso desde el navegador. Comprueba que `https://TU-DOMINIO/config/config.php` responda "prohibido".
- La API pública es de solo lectura y solo entrega contenido con estado `publicado`.
- En producción, cambia la contraseña de `root` de MySQL en tu computadora y no uses esa cuenta en el servidor.
