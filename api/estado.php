<?php
declare(strict_types=1);
/** Comprobación rápida de la instalación: abre api/estado.php en el navegador. */
require __DIR__ . '/lib/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$res = ['servidor' => 'ok', 'configuracion' => 'error', 'base_datos' => 'error'];
try {
    configuracion();
    $res['configuracion'] = 'ok';
    $db = db();
    $res['base_datos'] = 'ok';
    $tablas = ['noticias', 'avisos', 'calendario_items', 'preguntas', 'documentos', 'galeria', 'directorio', 'usuarios'];
    foreach ($tablas as $t) {
        $col = $t === 'usuarios' ? '1=1' : "estado = 'publicado'";
        $res['registros'][$t] = (int)$db->query("SELECT COUNT(*) FROM $t WHERE $col")->fetchColumn();
    }
} catch (Throwable $e) {
    error_log('[portal-cebe] estado: ' . $e->getMessage());
    $res['ayuda'] = 'Revisa config/config.php y que hayas importado database/schema.sql y datos_iniciales.sql';
}
echo json_encode($res, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
