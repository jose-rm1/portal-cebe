<?php
declare(strict_types=1);
/** Subida segura de imágenes, PDF y videos. */

function subir_archivo(string $tipo): array
{
    $reglas = [
        'imagen'    => ['dir' => 'img', 'max' => 5 * 1024 * 1024, 'ext' => ['jpg', 'jpeg', 'png', 'webp']],
        'documento' => ['dir' => 'documentos', 'max' => 8 * 1024 * 1024, 'ext' => ['pdf']],
        'medio'     => ['dir' => 'media', 'max' => 9 * 1024 * 1024, 'ext' => ['jpg', 'jpeg', 'png', 'webp', 'mp4']],
    ];
    if (!isset($reglas[$tipo])) {
        error_api('Tipo de archivo no válido.', 422);
    }
    $r = $reglas[$tipo];
    if (!isset($_FILES['archivo']) || !is_array($_FILES['archivo']) || (int)$_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
        error_api('No se pudo recibir el archivo. Revisa que no supere el tamaño permitido.', 422);
    }
    $f = $_FILES['archivo'];
    if (!is_uploaded_file($f['tmp_name'])) {
        error_api('Archivo no válido.', 422);
    }
    if ((int)$f['size'] <= 0 || (int)$f['size'] > $r['max']) {
        error_api('El archivo es demasiado grande (máximo ' . (int)($r['max'] / 1048576) . ' MB).', 422);
    }
    $ext = strtolower(pathinfo((string)$f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $r['ext'], true)) {
        error_api('Formato no permitido. Usa: ' . implode(', ', $r['ext']) . '.', 422);
    }
    $mimes = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'pdf' => 'application/pdf', 'mp4' => 'video/mp4'];
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    if ($mime !== $mimes[$ext]) {
        error_api('El contenido del archivo no coincide con su formato.', 422);
    }
    $esImagen = strpos($mime, 'image/') === 0;
    if ($esImagen) {
        $info = @getimagesize($f['tmp_name']);
        if ($info === false || $info[0] > 8000 || $info[1] > 8000) {
            error_api('La imagen no es válida o es demasiado grande (máximo 8000 px).', 422);
        }
    } else {
        $cabeza = (string)file_get_contents($f['tmp_name'], false, null, 0, 12);
        if ($ext === 'pdf' && strpos($cabeza, '%PDF-') !== 0) {
            error_api('El PDF no es válido.', 422);
        }
        if ($ext === 'mp4' && substr($cabeza, 4, 4) !== 'ftyp') {
            error_api('El video no es válido.', 422);
        }
    }

    $carpeta = __DIR__ . '/../../uploads/' . $r['dir'];
    if (!is_dir($carpeta) && !mkdir($carpeta, 0755, true) && !is_dir($carpeta)) {
        error_api('No se pudo preparar la carpeta de archivos.', 500);
    }
    $nombre = bin2hex(random_bytes(8)) . '.' . ($ext === 'jpeg' ? 'jpg' : $ext);
    $destino = $carpeta . '/' . $nombre;

    $guardado = false;
    if ($esImagen) {
        $guardado = reencodar_imagen($f['tmp_name'], $mime, $destino);   // quita datos ocultos (ubicación GPS) y reduce el tamaño
    }
    if (!$guardado && !move_uploaded_file($f['tmp_name'], $destino)) {
        error_api('No se pudo guardar el archivo.', 500);
    }
    @chmod($destino, 0644);
    return ['ruta' => 'uploads/' . $r['dir'] . '/' . $nombre];
}

/** Vuelve a guardar la imagen con GD: elimina EXIF/GPS, corrige la orientación y limita el ancho a 1600 px. */
function reencodar_imagen(string $origen, string $mime, string $destino): bool
{
    if (!function_exists('imagecreatetruecolor')) {
        return false;
    }
    $crear = ['image/jpeg' => 'imagecreatefromjpeg', 'image/png' => 'imagecreatefrompng', 'image/webp' => 'imagecreatefromwebp'][$mime] ?? null;
    if ($crear === null || !function_exists($crear)) {
        return false;
    }
    $img = @$crear($origen);
    if (!$img) {
        return false;
    }
    if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($origen);
        $o = (int)($exif['Orientation'] ?? 1);
        $giro = [3 => 180, 6 => -90, 8 => 90][$o] ?? 0;
        if ($giro !== 0 && function_exists('imagerotate')) {
            $r = imagerotate($img, $giro, 0);
            if ($r) { imagedestroy($img); $img = $r; }
        }
    }
    $ancho = imagesx($img);
    if ($ancho > 1600 && function_exists('imagescale')) {
        $e = imagescale($img, 1600);
        if ($e) { imagedestroy($img); $img = $e; }
    }
    $ok = false;
    if ($mime === 'image/jpeg') {
        $ok = imagejpeg($img, $destino, 85);
    } elseif ($mime === 'image/png') {
        imagesavealpha($img, true);
        $ok = imagepng($img, $destino, 6);
    } elseif (function_exists('imagewebp')) {
        $ok = imagewebp($img, $destino, 85);
    }
    imagedestroy($img);
    return (bool)$ok;
}
