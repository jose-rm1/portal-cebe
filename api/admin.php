<?php
declare(strict_types=1);
/**
 * API privada del panel de administración (un solo punto de entrada).
 * GET  api/admin.php?accion=sesion     -> estado de la sesión y token CSRF
 * POST api/admin.php  {accion: ...}    -> el resto de acciones (JSON, con cabecera X-CSRF-Token)
 * POST multipart accion=subir          -> subida de archivos
 * Toda acción, excepto "sesion" y "login", exige un usuario activo con sesión iniciada.
 */
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/seguridad.php';
require __DIR__ . '/lib/usuarios.php';
require __DIR__ . '/lib/recursos.php';
require __DIR__ . '/lib/subidas.php';

cabeceras_json();
iniciar_sesion();

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($metodo === 'GET') {
        if (($_GET['accion'] ?? '') !== 'sesion') {
            error_api('Acción no válida.', 400);
        }
        $u = usuario_actual();
        responder(['csrf' => $_SESSION['csrf'], 'usuario' => $u ? [
            'id' => $u['id'], 'usuario' => $u['usuario'], 'nombre' => $u['nombre'], 'rol' => $u['rol'],
            'principal' => $u['principal'], 'debe_cambiar_clave' => $u['debe_cambiar_clave'], 'permisos' => $u['permisos'],
        ] : null]);
    }
    if ($metodo !== 'POST') {
        error_api('Método no permitido.', 405);
    }

    verificar_origen();
    verificar_csrf();

    $multipart = stripos((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data') === 0;
    $in = $multipart ? $_POST : entrada_json();
    $accion = (string)($in['accion'] ?? '');

    if ($accion === 'login') {
        intentar_login((string)($in['usuario'] ?? ''), (string)($in['clave'] ?? ''));
        $u = usuario_actual();
        responder(['csrf' => $_SESSION['csrf'], 'usuario' => [
            'id' => $u['id'], 'usuario' => $u['usuario'], 'nombre' => $u['nombre'], 'rol' => $u['rol'],
            'principal' => $u['principal'], 'debe_cambiar_clave' => $u['debe_cambiar_clave'], 'permisos' => $u['permisos'],
        ]]);
    }

    $u = usuario_actual();
    if ($u === null) {
        error_api('Inicia sesión para continuar.', 401);
    }

    if ($accion === 'logout') {
        registrar('logout', 'usuario', $u['id']);
        sesion_nueva();
        responder(['ok' => true, 'csrf' => $_SESSION['csrf']]);
    }
    if ($accion === 'cambiar_clave') {
        cambiar_clave_propia($u, (string)($in['actual'] ?? ''), (string)($in['nueva'] ?? ''));
        responder(['ok' => true, 'csrf' => $_SESSION['csrf']]);
    }
    if ($u['debe_cambiar_clave']) {
        error_api('Debes cambiar tu contraseña antes de continuar.', 403, ['cambiar_clave' => true]);
    }

    $rec = (string)($in['recurso'] ?? '');
    $id = (int)($in['id'] ?? 0);

    switch ($accion) {
        case 'esquema':
            responder(['recursos' => esquema_para($u), 'estados' => ESTADOS]);
        case 'resumen':
            responder(resumen_para($u));
        case 'listar':
            responder(['filas' => listar_recurso($u, $rec, (string)($in['estado'] ?? ''))]);
        case 'obtener':
            responder(obtener_recurso($u, $rec, $id));
        case 'guardar':
            responder(guardar_recurso($u, $rec, $in));
        case 'estado':
            cambiar_estado($u, $rec, $id, (string)($in['estado'] ?? ''));
            responder(['ok' => true]);
        case 'eliminar':
            eliminar_recurso($u, $rec, $id);
            responder(['ok' => true]);
        case 'mover':
            mover_recurso($u, $rec, $id, (string)($in['dir'] ?? ''));
            responder(['ok' => true]);
        case 'subir':
            $r = subir_archivo((string)($in['tipo'] ?? ''));
            registrar('subir', 'archivo', null, $r['ruta']);
            responder($r);
        case 'usuarios':
            exigir_admin($u);
            responder(['usuarios' => listar_usuarios()]);
        case 'usuario_guardar':
            exigir_admin($u);
            responder(guardar_usuario($u, $in));
        case 'usuario_activo':
            exigir_admin($u);
            activar_usuario($u, $id, !empty($in['activo']));
            responder(['ok' => true]);
        case 'usuario_clave':
            exigir_admin($u);
            responder(['clave' => restablecer_clave($u, $id)]);
        case 'transferir':
            exigir_admin($u);
            transferir_principal($u, (int)($in['destino'] ?? 0), (string)($in['clave'] ?? ''));
            responder(['ok' => true]);
        case 'registro':
            exigir_admin($u);
            $filas = [];
            $sql = 'SELECT r.id, r.accion, r.entidad, r.entidad_id, r.detalle, r.ip, r.creado_en, u.usuario AS quien
                    FROM registro_actividad r LEFT JOIN usuarios u ON u.id = r.usuario_id ORDER BY r.id DESC LIMIT 200';
            foreach (db()->query($sql) as $f) {
                $filas[] = ['accion' => $f['accion'], 'entidad' => $f['entidad'], 'entidad_id' => $f['entidad_id'], 'detalle' => $f['detalle'],
                    'ip' => $f['ip'], 'fecha' => $f['creado_en'], 'quien' => (string)$f['quien']];
            }
            responder(['filas' => $filas]);
    }
    error_api('Acción desconocida.', 400);
} catch (ErrorCampo $e) {
    error_api($e->getMessage(), 422);
} catch (Throwable $e) {
    error_log('[portal-cebe] admin: ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
    error_api('Ocurrió un error en el servidor. Intenta de nuevo.', 500);
}
