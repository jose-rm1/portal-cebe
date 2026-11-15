<?php
declare(strict_types=1);
/** Sesión, respuestas JSON, protección CSRF y registro de actividad. */

class ErrorCampo extends Exception {}

function es_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function iniciar_sesion(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_name('cebe_sid');
    session_set_cookie_params([
        'lifetime' => 0, 'path' => '/', 'secure' => es_https(), 'httponly' => true, 'samesite' => 'Lax',
    ]);
    session_start();
    $ahora = time();
    $inactiva = isset($_SESSION['ultima']) && ($ahora - (int)$_SESSION['ultima']) > 2700;      // 45 min sin actividad
    $vencida = isset($_SESSION['inicio']) && ($ahora - (int)$_SESSION['inicio']) > 28800;      // 8 horas en total
    if ($inactiva || $vencida) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    if (empty($_SESSION['inicio'])) {
        $_SESSION['inicio'] = $ahora;
    }
    $_SESSION['ultima'] = $ahora;
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
}

function cabeceras_json(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
}

function responder($datos, int $codigo = 200): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    exit;
}

function error_api(string $mensaje, int $codigo = 400, array $extra = []): void
{
    responder(['error' => $mensaje] + $extra, $codigo);
}

/** Rechaza peticiones que vengan de otro sitio. */
function verificar_origen(): void
{
    $origen = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origen === '') {
        return;
    }
    $host = (string)parse_url($origen, PHP_URL_HOST);
    $puerto = parse_url($origen, PHP_URL_PORT);
    $esperado = $host . ($puerto ? ':' . $puerto : '');
    if (strcasecmp($esperado, (string)($_SERVER['HTTP_HOST'] ?? '')) !== 0) {
        error_api('Origen no permitido.', 403);
    }
}

function verificar_csrf(): void
{
    $token = (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!hash_equals((string)($_SESSION['csrf'] ?? ''), $token)) {
        error_api('La sesión no es válida. Recarga la página.', 403, ['csrf' => true]);
    }
}

function entrada_json(): array
{
    $crudo = file_get_contents('php://input');
    if ($crudo === false || $crudo === '') {
        return [];
    }
    $d = json_decode($crudo, true);
    if (!is_array($d)) {
        error_api('Datos inválidos.');
    }
    return $d;
}

function ip_cliente(): string
{
    return substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}

function registrar(string $accion, string $entidad = '', ?int $entidadId = null, string $detalle = '', ?int $usuarioId = null): void
{
    try {
        $st = db()->prepare('INSERT INTO registro_actividad (usuario_id, accion, entidad, entidad_id, detalle, ip) VALUES (?, ?, ?, ?, ?, ?)');
        $uid = $usuarioId ?? (isset($_SESSION['uid']) ? (int)$_SESSION['uid'] : null);
        $st->execute([$uid, $accion, $entidad, $entidadId, mb_substr($detalle, 0, 500), ip_cliente()]);
    } catch (Throwable $e) {
        error_log('[portal-cebe] registro: ' . $e->getMessage());
    }
}
