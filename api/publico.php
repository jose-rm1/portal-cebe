<?php
declare(strict_types=1);
/**
 * API pública de solo lectura.
 * GET api/publico.php?r=todo | noticias | avisos | calendario | preguntas | documentos | galeria | directorio
 * Solo entrega contenido con estado "publicado". Devuelve la misma forma de datos que data/*.js.
 */
require __DIR__ . '/lib/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: public, max-age=60');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    http_response_code(405);
    echo '{"error":"metodo"}';
    exit;
}

$permitidos = ['todo', 'noticias', 'avisos', 'calendario', 'preguntas', 'documentos', 'galeria', 'directorio', 'mision', 'historia'];
$recurso = (string)($_GET['r'] ?? 'todo');
if (!in_array($recurso, $permitidos, true)) {
    http_response_code(400);
    echo '{"error":"recurso"}';
    exit;
}

function enlaces_de(PDO $db, string $entidad): array
{
    $st = $db->prepare('SELECT entidad_id, texto, href, externo FROM enlaces WHERE entidad = ? ORDER BY entidad_id, orden, id');
    $st->execute([$entidad]);
    $res = [];
    foreach ($st as $f) {
        $res[(int)$f['entidad_id']][] = ['texto' => $f['texto'], 'href' => $f['href'], 'externo' => (bool)$f['externo']];
    }
    return $res;
}

function noticias(PDO $db): array
{
    $en = enlaces_de($db, 'noticia');
    $res = [];
    foreach ($db->query("SELECT * FROM noticias WHERE estado = 'publicado' ORDER BY creado_en DESC, orden, id") as $n) {
        $res[] = [
            'id' => $n['slug'], 'categoria' => $n['categoria'], 'etiqueta' => $n['etiqueta'],
            'fecha' => $n['fecha_texto'], 'titulo' => $n['titulo'], 'resumen' => $n['resumen'],
            'imagen' => $n['imagen'], 'alt' => $n['alt'], 'enlaces' => $en[(int)$n['id']] ?? [],
        ];
    }
    return $res;
}

function avisos(PDO $db): array
{
    $items = [];
    foreach ($db->query('SELECT aviso_id, tipo, col_a, col_b FROM aviso_items ORDER BY aviso_id, orden, id') as $f) {
        $items[(int)$f['aviso_id']][] = $f;
    }
    $sql = "SELECT * FROM avisos WHERE estado = 'publicado' AND (vigente_desde IS NULL OR vigente_desde <= CURDATE()) ORDER BY creado_en DESC, orden, id";
    $hoy = date('Y-m-d');
    $res = [];
    foreach ($db->query($sql) as $a) {
        $vencido = $a['vigente_hasta'] !== null && $a['vigente_hasta'] < $hoy;
        $r = [
            'id' => $a['slug'], 'destacado' => (bool)$a['destacado'], 'archivado' => ((bool)$a['archivado'] || $vencido),
            'etiqueta' => $a['etiqueta'], 'titulo' => $a['titulo'], 'texto' => (string)$a['texto'],
        ];
        if (($a['formato'] ?? 'texto') === 'archivo' && ($a['archivo'] ?? '') !== '') {
            // Comunicado subido como imagen o PDF: se envía el archivo y su resumen (texto alternativo).
            $r['archivo'] = $a['archivo'];
            $r['resumen'] = (string)$a['alt'];
            $r['texto'] = '';
        }
        $filas = [];
        $detalles = [];
        $notas = [];
        foreach ($items[(int)$a['id']] ?? [] as $x) {
            if ($x['tipo'] === 'fila') {
                $filas[] = ['actividad' => $x['col_a'], 'fecha' => $x['col_b']];
            } elseif ($x['tipo'] === 'detalle') {
                $detalles[] = ['etiqueta' => $x['col_a'], 'texto' => $x['col_b']];
            } else {
                $notas[] = $x['col_b'];
            }
        }
        if ($filas) { $r['filas'] = $filas; }
        if ($detalles) { $r['detalles'] = $detalles; }
        if ($notas) { $r['notas'] = $notas; }
        if ($a['cierre'] !== '') { $r['cierre'] = $a['cierre']; }
        if ($a['firma'] !== '') { $r['firma'] = $a['firma']; }
        $res[] = $r;
    }
    return $res;
}

function calendario(PDO $db): array
{
    $nombres = [1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril', 5 => 'Mayo', 6 => 'Junio', 7 => 'Julio',
        8 => 'Agosto', 9 => 'Setiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'];
    $proximas = [];
    foreach ($db->query("SELECT * FROM calendario_proximas WHERE estado = 'publicado' ORDER BY orden, id") as $p) {
        $x = ['etiqueta' => $p['etiqueta'], 'titulo' => $p['titulo'], 'texto' => $p['texto'], 'destacado' => (bool)$p['destacado']];
        if ($p['enlace_href'] !== '') {
            $x['enlace'] = ['texto' => $p['enlace_texto'], 'href' => $p['enlace_href']];
        }
        $proximas[] = $x;
    }
    $porMes = [];
    foreach ($db->query("SELECT mes, dia, texto FROM calendario_items WHERE estado = 'publicado' ORDER BY mes, CAST(dia AS UNSIGNED), dia, id") as $i) {
        $porMes[(int)$i['mes']][] = ['dia' => $i['dia'], 'texto' => $i['texto']];
    }
    ksort($porMes);
    $meses = [];
    foreach ($porMes as $m => $items) {
        $meses[] = ['mes' => $m, 'nombre' => $nombres[$m] ?? (string)$m, 'items' => $items];
    }
    return ['proximas' => $proximas, 'meses' => $meses];
}

function preguntas(PDO $db): array
{
    $en = enlaces_de($db, 'pregunta');
    $res = [];
    foreach ($db->query("SELECT * FROM preguntas WHERE estado = 'publicado' ORDER BY orden, id") as $p) {
        $res[] = ['pregunta' => $p['pregunta'], 'respuesta' => $p['respuesta'], 'enlaces' => $en[(int)$p['id']] ?? []];
    }
    return $res;
}

function documentos(PDO $db): array
{
    $res = [];
    foreach ($db->query("SELECT * FROM documentos WHERE estado = 'publicado' ORDER BY creado_en DESC, id DESC") as $d) {
        $res[] = ['nombre' => $d['nombre'], 'descripcion' => $d['descripcion'], 'fecha' => $d['fecha_texto'], 'tipo' => $d['tipo'], 'url' => $d['archivo']];
    }
    return $res;
}

function galeria(PDO $db): array
{
    $fotos = [];
    $videos = [];
    foreach ($db->query("SELECT * FROM galeria WHERE estado = 'publicado' ORDER BY orden, id") as $g) {
        if ($g['tipo'] === 'foto') {
            $fotos[] = ['src' => $g['src'], 'alt' => $g['alt'], 'pie' => $g['pie']];
        } else {
            $videos[] = ['titulo' => $g['titulo'], 'src' => $g['src'], 'poster' => $g['poster'], 'descripcion' => $g['descripcion']];
        }
    }
    return ['fotos' => $fotos, 'videos' => $videos];
}

function directorio(PDO $db): array
{
    $res = [];
    $pos = [];
    foreach ($db->query("SELECT grupo, nombre, cargo, detalle FROM directorio WHERE estado = 'publicado' ORDER BY grupo_orden, orden, id") as $d) {
        if (!isset($pos[$d['grupo']])) {
            $pos[$d['grupo']] = count($res);
            $res[] = ['grupo' => $d['grupo'], 'personas' => []];
        }
        $res[$pos[$d['grupo']]]['personas'][] = ['nombre' => $d['nombre'], 'cargo' => $d['cargo'], 'detalle' => $d['detalle']];
    }
    return $res;
}

/** Misión y visión vigente: la versión publicada más reciente (o null si no hay). */
function mision(PDO $db): ?array
{
    $m = $db->query("SELECT periodo, mision, vision, valores FROM mision_vision WHERE estado = 'publicado' ORDER BY creado_en DESC, id DESC LIMIT 1")->fetch();
    if (!$m) {
        return null;
    }
    $valores = array_values(array_filter(array_map('trim', preg_split('/\R/', (string)$m['valores']))));
    return ['periodo' => $m['periodo'], 'mision' => $m['mision'], 'vision' => $m['vision'], 'valores' => $valores];
}

function historia(PDO $db): array
{
    $res = [];
    foreach ($db->query("SELECT * FROM historia WHERE estado = 'publicado' ORDER BY orden, id") as $h) {
        $res[] = ['titulo' => $h['titulo'], 'fecha' => $h['fecha'], 'texto' => $h['texto'], 'imagen' => $h['imagen'], 'alt' => $h['alt'], 'pie' => $h['pie']];
    }
    return $res;
}

try {
    $db = db();
    $todo = [
        'noticias' => noticias($db), 'avisos' => avisos($db), 'calendario' => calendario($db), 'preguntas' => preguntas($db),
        'documentos' => documentos($db), 'galeria' => galeria($db), 'directorio' => directorio($db),
        'mision' => mision($db), 'historia' => historia($db),
    ];
    $salida = $recurso === 'todo' ? $todo : $todo[$recurso];
    echo json_encode($salida, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $e) {
    error_log('[portal-cebe] ' . $e->getMessage());
    http_response_code(500);
    header('Cache-Control: no-store');
    echo '{"error":"servidor"}';
}
