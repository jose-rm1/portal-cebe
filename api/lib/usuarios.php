<?php
declare(strict_types=1);
/** Cuentas de usuario: ingreso, permisos y administración de usuarios. */

const SECCIONES = ['noticias', 'avisos', 'calendario', 'preguntas', 'documentos', 'galeria', 'directorio'];

/** Hash de relleno: hace que tardar lo mismo si el usuario no existe. */
function hash_relleno(): string
{
    static $h = null;
    if ($h === null) {
        $h = password_hash(bin2hex(random_bytes(8)), PASSWORD_DEFAULT);
    }
    return $h;
}

function permisos_de(int $id, string $rol): array
{
    if ($rol === 'administradora') {
        return SECCIONES;
    }
    $st = db()->prepare('SELECT seccion FROM permisos_usuario WHERE usuario_id = ?');
    $st->execute([$id]);
    $lista = [];
    foreach ($st as $f) {
        $lista[] = $f['seccion'];
    }
    return array_values(array_intersect(SECCIONES, $lista));
}

function sesion_nueva(): void
{
    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['inicio'] = time();
    $_SESSION['ultima'] = time();
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
}

/** Usuario de la sesión. Se consulta la base en cada petición: si lo desactivan, pierde el acceso al instante. */
function usuario_actual(): ?array
{
    $id = (int)($_SESSION['uid'] ?? 0);
    if ($id <= 0) {
        return null;
    }
    $st = db()->prepare('SELECT id, usuario, nombre, correo, rol, principal, activo, debe_cambiar_clave, ultimo_acceso FROM usuarios WHERE id = ?');
    $st->execute([$id]);
    $u = $st->fetch();
    if (!$u || (int)$u['activo'] !== 1) {
        unset($_SESSION['uid']);
        return null;
    }
    $u['id'] = (int)$u['id'];
    $u['principal'] = (bool)$u['principal'];
    $u['activo'] = true;
    $u['debe_cambiar_clave'] = (bool)$u['debe_cambiar_clave'];
    $u['permisos'] = permisos_de($u['id'], (string)$u['rol']);
    return $u;
}

function es_admin(array $u): bool
{
    return $u['rol'] === 'administradora';
}

function puede_seccion(array $u, string $seccion): bool
{
    return in_array($seccion, $u['permisos'], true);
}

function exigir_admin(array $u): void
{
    if (!es_admin($u)) {
        error_api('Esta acción es solo para administradoras.', 403);
    }
}

function error_clave(string $clave, string $usuario): ?string
{
    if (strlen($clave) < 8) {
        return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (strlen($clave) > 72) {
        return 'La contraseña no puede pasar de 72 caracteres.';
    }
    if ($usuario !== '' && stripos($clave, $usuario) !== false) {
        return 'La contraseña no debe contener el nombre de usuario.';
    }
    if (ctype_digit($clave)) {
        return 'La contraseña no puede tener solo números.';
    }
    if (count(array_unique(str_split(strtolower($clave)))) < 4) {
        return 'La contraseña es demasiado repetitiva.';
    }
    $comunes = ['password', 'contrasena', 'contraseña', 'qwertyui', 'abcd1234', 'abc12345', 'admin123', 'cebe2026', 'cebe2025',
        'tacna123', 'tacna2026', 'peru2026', 'peru1234', 'colegio1', 'colegio123', 'iloveyou', 'letmein1', 'bienvenido'];
    foreach ($comunes as $c) {
        if (strcasecmp($clave, $c) === 0) {
            return 'Esa contraseña es muy común. Elige otra.';
        }
    }
    return null;
}

function clave_temporal(): string
{
    $alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $s = '';
    for ($i = 0; $i < 12; $i++) {
        $s .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
    }
    return $s;
}

function intentar_login(string $usuario, string $clave): array
{
    $db = db();
    $usuario = strtolower(trim($usuario));
    $generico = 'Usuario o contraseña incorrectos.';

    $st = $db->prepare("SELECT COUNT(*) FROM registro_actividad WHERE accion = 'login_fallido' AND ip = ? AND creado_en > (NOW() - INTERVAL 15 MINUTE)");
    $st->execute([ip_cliente()]);
    if ((int)$st->fetchColumn() >= 20) {
        error_api('Demasiados intentos desde esta conexión. Espera unos minutos.', 429);
    }

    $st = $db->prepare('SELECT *, (bloqueado_hasta IS NOT NULL AND bloqueado_hasta > NOW()) AS bloqueado FROM usuarios WHERE usuario = ?');
    $st->execute([$usuario]);
    $u = $st->fetch();

    if (!$u) {
        password_verify($clave, hash_relleno());
        registrar('login_fallido', 'usuario', null, 'usuario: ' . mb_substr($usuario, 0, 50), 0);
        error_api($generico, 401);
    }
    if ((int)$u['bloqueado'] === 1) {
        error_api('Cuenta bloqueada temporalmente por intentos fallidos. Intenta en unos minutos.', 429);
    }
    if (!password_verify($clave, (string)$u['clave_hash'])) {
        $db->prepare('UPDATE usuarios SET intentos_fallidos = intentos_fallidos + 1 WHERE id = ?')->execute([$u['id']]);
        $n = $db->prepare('SELECT intentos_fallidos FROM usuarios WHERE id = ?');
        $n->execute([$u['id']]);
        if ((int)$n->fetchColumn() >= 5) {
            $db->prepare('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?')->execute([$u['id']]);
        }
        registrar('login_fallido', 'usuario', (int)$u['id'], '', (int)$u['id']);
        error_api($generico, 401);
    }
    if ((int)$u['activo'] !== 1) {
        error_api('Tu cuenta está desactivada. Habla con la administración.', 403);
    }
    if (password_needs_rehash((string)$u['clave_hash'], PASSWORD_DEFAULT)) {
        $db->prepare('UPDATE usuarios SET clave_hash = ? WHERE id = ?')->execute([password_hash($clave, PASSWORD_DEFAULT), $u['id']]);
    }
    $db->prepare('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = NOW() WHERE id = ?')->execute([$u['id']]);
    sesion_nueva();
    $_SESSION['uid'] = (int)$u['id'];
    registrar('login', 'usuario', (int)$u['id']);
    return ['id' => (int)$u['id']];
}

function cambiar_clave_propia(array $u, string $actual, string $nueva): void
{
    $st = db()->prepare('SELECT clave_hash FROM usuarios WHERE id = ?');
    $st->execute([$u['id']]);
    if (!password_verify($actual, (string)$st->fetchColumn())) {
        error_api('La contraseña actual no es correcta.', 422);
    }
    if ($actual === $nueva) {
        error_api('La contraseña nueva debe ser distinta de la actual.', 422);
    }
    $e = error_clave($nueva, (string)$u['usuario']);
    if ($e !== null) {
        error_api($e, 422);
    }
    db()->prepare('UPDATE usuarios SET clave_hash = ?, debe_cambiar_clave = 0 WHERE id = ?')->execute([password_hash($nueva, PASSWORD_DEFAULT), $u['id']]);
    session_regenerate_id(true);
    registrar('clave_cambiada', 'usuario', $u['id']);
}

function admins_activos_sin(int $idExcluido): int
{
    $st = db()->prepare("SELECT COUNT(*) FROM usuarios WHERE rol = 'administradora' AND activo = 1 AND id <> ?");
    $st->execute([$idExcluido]);
    return (int)$st->fetchColumn();
}

function usuario_por_id(int $id): array
{
    $st = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
    $st->execute([$id]);
    $x = $st->fetch();
    if (!$x) {
        error_api('Usuario no encontrado.', 404);
    }
    return $x;
}

function listar_usuarios(): array
{
    $perm = [];
    foreach (db()->query('SELECT usuario_id, seccion FROM permisos_usuario') as $p) {
        $perm[(int)$p['usuario_id']][] = $p['seccion'];
    }
    $res = [];
    foreach (db()->query('SELECT id, usuario, nombre, correo, rol, principal, activo, debe_cambiar_clave, ultimo_acceso FROM usuarios ORDER BY principal DESC, rol ASC, nombre ASC') as $f) {
        $id = (int)$f['id'];
        $res[] = [
            'id' => $id, 'usuario' => $f['usuario'], 'nombre' => $f['nombre'], 'correo' => (string)$f['correo'], 'rol' => $f['rol'],
            'principal' => (bool)$f['principal'], 'activo' => (bool)$f['activo'], 'debe_cambiar_clave' => (bool)$f['debe_cambiar_clave'],
            'ultimo_acceso' => $f['ultimo_acceso'], 'permisos' => $f['rol'] === 'administradora' ? SECCIONES : ($perm[$id] ?? []),
        ];
    }
    return $res;
}

/** Crea o edita una cuenta. Devuelve la contraseña temporal solo al crear. */
function guardar_usuario(array $actor, array $in): array
{
    $db = db();
    $id = (int)($in['id'] ?? 0);
    $nombre = trim((string)($in['nombre'] ?? ''));
    $correo = trim((string)($in['correo'] ?? ''));
    $rol = (string)($in['rol'] ?? 'editora');
    $permisos = is_array($in['permisos'] ?? null) ? array_values(array_intersect(SECCIONES, $in['permisos'])) : [];

    if (mb_strlen($nombre) < 3 || mb_strlen($nombre) > 120) {
        error_api('El nombre debe tener entre 3 y 120 caracteres.', 422);
    }
    if ($correo !== '' && (!filter_var($correo, FILTER_VALIDATE_EMAIL) || strlen($correo) > 150)) {
        error_api('El correo no es válido.', 422);
    }
    if (!in_array($rol, ['administradora', 'editora'], true)) {
        error_api('Rol no válido.', 422);
    }

    if ($id === 0) {
        $usuario = strtolower(trim((string)($in['usuario'] ?? '')));
        $clave = (string)($in['clave'] ?? '');
        if (!preg_match('/^[a-z0-9._-]{3,50}$/', $usuario)) {
            error_api('El usuario debe tener de 3 a 50 caracteres: letras minúsculas, números, punto, guion o guion bajo.', 422);
        }
        if ($rol === 'administradora' && !$actor['principal']) {
            error_api('Solo la administradora principal puede crear otras administradoras.', 403);
        }
        $e = error_clave($clave, $usuario);
        if ($e !== null) {
            error_api($e, 422);
        }
        $existe = $db->prepare('SELECT COUNT(*) FROM usuarios WHERE usuario = ?');
        $existe->execute([$usuario]);
        if ((int)$existe->fetchColumn() > 0) {
            error_api('Ese usuario ya existe.', 422);
        }
        $db->beginTransaction();
        try {
            $db->prepare('INSERT INTO usuarios (usuario, nombre, correo, clave_hash, rol, principal, activo, debe_cambiar_clave) VALUES (?, ?, ?, ?, ?, 0, 1, 1)')
               ->execute([$usuario, $nombre, $correo === '' ? null : $correo, password_hash($clave, PASSWORD_DEFAULT), $rol]);
            $nuevo = (int)$db->lastInsertId();
            if ($rol === 'editora') {
                $ins = $db->prepare('INSERT INTO permisos_usuario (usuario_id, seccion) VALUES (?, ?)');
                foreach ($permisos as $s) { $ins->execute([$nuevo, $s]); }
            }
            $db->commit();
        } catch (Throwable $e) {
            $db->rollBack();
            throw $e;
        }
        registrar('usuario_creado', 'usuario', $nuevo, $usuario . ' (' . $rol . ')');
        return ['id' => $nuevo];
    }

    $x = usuario_por_id($id);
    $esMismo = $id === $actor['id'];
    if ((bool)$x['principal'] && !$esMismo) {
        error_api('Solo la administradora principal puede editar su propia cuenta.', 403);
    }
    if ($x['rol'] === 'administradora' && !$esMismo && !$actor['principal']) {
        error_api('Solo la administradora principal puede editar a otras administradoras.', 403);
    }
    if ($esMismo || (bool)$x['principal']) {
        $rol = (string)$x['rol'];            // nadie cambia su propio rol
    } elseif ($rol === 'administradora' && !$actor['principal']) {
        error_api('Solo la administradora principal puede nombrar administradoras.', 403);
    }
    if ($x['rol'] === 'administradora' && $rol !== 'administradora' && admins_activos_sin($id) < 1) {
        error_api('Debe quedar al menos una administradora activa.', 422);
    }
    $db->beginTransaction();
    try {
        $db->prepare('UPDATE usuarios SET nombre = ?, correo = ?, rol = ? WHERE id = ?')->execute([$nombre, $correo === '' ? null : $correo, $rol, $id]);
        if (!$esMismo) {
            $db->prepare('DELETE FROM permisos_usuario WHERE usuario_id = ?')->execute([$id]);
            if ($rol === 'editora') {
                $ins = $db->prepare('INSERT INTO permisos_usuario (usuario_id, seccion) VALUES (?, ?)');
                foreach ($permisos as $s) { $ins->execute([$id, $s]); }
            }
        }
        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }
    registrar('usuario_editado', 'usuario', $id, $x['usuario'] . ' (' . $rol . ')');
    return ['id' => $id];
}

function activar_usuario(array $actor, int $id, bool $activo): void
{
    $x = usuario_por_id($id);
    if ($id === $actor['id']) {
        error_api('No puedes desactivar tu propia cuenta.', 422);
    }
    if ((bool)$x['principal']) {
        error_api('La cuenta de la administradora principal no se puede desactivar.', 403);
    }
    if ($x['rol'] === 'administradora' && !$actor['principal']) {
        error_api('Solo la administradora principal puede desactivar a otras administradoras.', 403);
    }
    if (!$activo && $x['rol'] === 'administradora' && admins_activos_sin($id) < 1) {
        error_api('Debe quedar al menos una administradora activa.', 422);
    }
    db()->prepare('UPDATE usuarios SET activo = ?, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?')->execute([$activo ? 1 : 0, $id]);
    registrar($activo ? 'usuario_activado' : 'usuario_desactivado', 'usuario', $id, (string)$x['usuario']);
}

/** Genera una contraseña temporal nueva. Se muestra una sola vez a quien la pidió. */
function restablecer_clave(array $actor, int $id): string
{
    $x = usuario_por_id($id);
    if ((bool)$x['principal'] && !$actor['principal']) {
        error_api('Solo la administradora principal puede restablecer su contraseña.', 403);
    }
    if ($x['rol'] === 'administradora' && $id !== $actor['id'] && !$actor['principal']) {
        error_api('Solo la administradora principal puede restablecer la contraseña de otras administradoras.', 403);
    }
    $nueva = clave_temporal();
    db()->prepare('UPDATE usuarios SET clave_hash = ?, debe_cambiar_clave = 1, intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?')
        ->execute([password_hash($nueva, PASSWORD_DEFAULT), $id]);
    registrar('clave_restablecida', 'usuario', $id, (string)$x['usuario']);
    return $nueva;
}

/** La administradora principal entrega ese cargo a otra administradora activa. */
function transferir_principal(array $actor, int $destino, string $clave): void
{
    if (!$actor['principal']) {
        error_api('Solo la administradora principal puede transferir el cargo.', 403);
    }
    $st = db()->prepare('SELECT clave_hash FROM usuarios WHERE id = ?');
    $st->execute([$actor['id']]);
    if (!password_verify($clave, (string)$st->fetchColumn())) {
        error_api('Tu contraseña no es correcta.', 422);
    }
    $x = usuario_por_id($destino);
    if ($destino === $actor['id'] || $x['rol'] !== 'administradora' || (int)$x['activo'] !== 1) {
        error_api('El destino debe ser otra administradora activa.', 422);
    }
    $db = db();
    $db->beginTransaction();
    try {
        $db->prepare('UPDATE usuarios SET principal = 0 WHERE id = ?')->execute([$actor['id']]);
        $db->prepare('UPDATE usuarios SET principal = 1 WHERE id = ?')->execute([$destino]);
        $db->commit();
    } catch (Throwable $e) {
        $db->rollBack();
        throw $e;
    }
    registrar('cargo_transferido', 'usuario', $destino, 'de ' . $actor['usuario'] . ' a ' . $x['usuario']);
}
