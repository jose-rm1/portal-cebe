<?php
declare(strict_types=1);
/**
 * Crea una cuenta de usuario. Solo se ejecuta desde la línea de comandos.
 *
 *   php tools/crear_usuario.php USUARIO "Nombre Apellido" administradora|editora [--principal] [--ejecutar]
 *
 * Sin --ejecutar, muestra una sentencia SQL para pegar en phpMyAdmin (útil en InfinityFree).
 * Con --ejecutar, inserta la cuenta directamente en la base de datos de config/config.php.
 */
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Solo se puede ejecutar desde la línea de comandos.');
}

$args = array_slice($argv, 1);
$principal = in_array('--principal', $args, true);
$ejecutar = in_array('--ejecutar', $args, true);
$pos = array_values(array_filter($args, function ($a) { return strpos($a, '--') !== 0; }));

if (count($pos) < 3) {
    echo "Uso: php tools/crear_usuario.php USUARIO \"Nombre Apellido\" administradora|editora [--principal] [--ejecutar]\n";
    exit(1);
}
list($usuario, $nombre, $rol) = $pos;

if (!preg_match('/^[a-z0-9._-]{3,50}$/', $usuario)) {
    echo "El usuario debe tener de 3 a 50 caracteres: letras minúsculas, números, punto, guion o guion bajo.\n";
    exit(1);
}
if (!in_array($rol, ['administradora', 'editora'], true)) {
    echo "El rol debe ser administradora o editora.\n";
    exit(1);
}

echo 'Contraseña temporal (mínimo 8 caracteres; la persona la cambiará al entrar): ';
$clave = rtrim((string)fgets(STDIN), "\r\n");
require __DIR__ . '/../api/lib/usuarios.php';
$problema = error_clave($clave, $usuario);
if ($problema !== null) {
    echo $problema . "\n";
    exit(1);
}
$hash = password_hash($clave, PASSWORD_DEFAULT);

if ($ejecutar) {
    require __DIR__ . '/../api/lib/db.php';
    $st = db()->prepare('INSERT INTO usuarios (usuario, nombre, clave_hash, rol, principal, activo, debe_cambiar_clave) VALUES (?, ?, ?, ?, ?, 1, 1)');
    $st->execute([$usuario, $nombre, $hash, $rol, $principal ? 1 : 0]);
    echo "Usuario creado: $usuario ($rol)\n";
} else {
    $q = function (string $s): string { return "'" . str_replace(['\\', "'"], ['\\\\', "''"], $s) . "'"; };
    echo "\nPega esto en la pestaña SQL de phpMyAdmin:\n\n";
    echo 'INSERT INTO usuarios (usuario, nombre, clave_hash, rol, principal, activo, debe_cambiar_clave) VALUES ('
        . $q($usuario) . ', ' . $q($nombre) . ', ' . $q($hash) . ', ' . $q($rol) . ', ' . ($principal ? 1 : 0) . ", 1, 1);\n";
}
