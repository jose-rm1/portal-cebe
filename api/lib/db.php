<?php
declare(strict_types=1);

/** Lee la configuración (config/config.php). */
function configuracion(): array
{
    static $c = null;
    if ($c !== null) {
        return $c;
    }
    $archivo = __DIR__ . '/../../config/config.php';
    if (!is_file($archivo)) {
        throw new RuntimeException('Falta config/config.php');
    }
    $c = require $archivo;
    return $c;
}

/** Devuelve la conexión a MySQL (una sola por petición). */
function db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }
    $c = configuracion();
    $dsn = 'mysql:host=' . $c['db_host'] . ';dbname=' . $c['db_nombre'] . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $c['db_usuario'], $c['db_clave'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}
