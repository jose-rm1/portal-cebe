<?php
declare(strict_types=1);
/** Definición de cada sección editable y el motor genérico para listar, guardar y cambiar de estado. */

const ESTADOS = ['borrador', 'pendiente', 'publicado', 'archivado'];
const GRUPOS_DIRECTORIO = [
    'Personal directivo' => 'Personal directivo',
    'Docentes de Inicial' => 'Docentes de Inicial',
    'Docentes de Primaria' => 'Docentes de Primaria',
    'Docentes del SAANEE y PRITE' => 'Docentes del SAANEE y PRITE',
    'Auxiliares de educación' => 'Auxiliares de educación',
    'Personal administrativo' => 'Personal administrativo',
    'Personal de salud' => 'Personal de salud',
];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const RE_RUTA = '#^(img|uploads|video|documentos)/[A-Za-z0-9_./-]{1,200}$#';

function def_enlaces(string $entidad): array
{
    return ['enlaces' => [
        'etiqueta' => 'Enlaces', 'tabla' => 'enlaces', 'fk' => 'entidad_id', 'fijas' => ['entidad' => $entidad],
        'campos' => [
            ['n' => 'texto', 't' => 'texto', 'e' => 'Texto del enlace', 'max' => 120, 'req' => true],
            ['n' => 'href', 't' => 'enlace', 'e' => 'Dirección', 'max' => 255, 'req' => true, 'ayuda' => 'https://..., #vista (ej. #contacto), mailto: o tel:'],
            ['n' => 'externo', 't' => 'bool', 'e' => 'Abrir en otra pestaña'],
        ],
    ]];
}

function def_items(string $tipo, string $etiqueta, string $ea, string $eb, bool $conA = true): array
{
    $campos = [];
    if ($conA) {
        $campos[] = ['n' => 'col_a', 't' => 'texto', 'e' => $ea, 'max' => 500, 'req' => true];
    }
    $campos[] = ['n' => 'col_b', 't' => 'texto', 'e' => $eb, 'max' => 500, 'req' => true];
    return ['etiqueta' => $etiqueta, 'tabla' => 'aviso_items', 'fk' => 'aviso_id', 'fijas' => ['tipo' => $tipo], 'campos' => $campos];
}

function definiciones(): array
{
    $meses = [1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril', 5 => 'Mayo', 6 => 'Junio', 7 => 'Julio',
        8 => 'Agosto', 9 => 'Setiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'];
    return [
        'noticias' => [
            'etiqueta' => 'Noticias', 'seccion' => 'noticias', 'tabla' => 'noticias', 'titulo' => 'titulo', 'slug' => true,
            'orden_lista' => 'creado_en DESC, orden, id',   // la más nueva primero
            'columnas' => ['titulo', 'categoria', 'fecha_texto'],
            'campos' => [
                ['n' => 'titulo', 't' => 'texto', 'e' => 'Título', 'max' => 200, 'req' => true],
                // 'texto_en': el nombre de la categoría se guarda también como etiqueta visible en el sitio.
                ['n' => 'categoria', 't' => 'opcion', 'e' => 'Categoría', 'req' => true, 'texto_en' => 'etiqueta', 'ayuda' => 'Se muestra como etiqueta en la noticia.',
                    'op' => ['aniversario' => 'Aniversario', 'actividades' => 'Actividades', 'familias' => 'Familias', 'convivencia' => 'Convivencia']],
                ['n' => 'fecha_texto', 't' => 'mes', 'e' => 'Fecha', 'ayuda' => 'Elige el mes y el año. Se mostrará como "Noviembre de 2026".'],
                ['n' => 'resumen', 't' => 'largo', 'e' => 'Resumen', 'max' => 1500, 'req' => true],
                ['n' => 'imagen', 't' => 'imagen', 'e' => 'Imagen (solo con autorización de las familias si aparecen estudiantes)'],
                // 'req_si': obligatorio solo cuando el otro campo tiene valor.
                ['n' => 'alt', 't' => 'texto', 'e' => 'Descripción de la imagen', 'max' => 255, 'req_si' => 'imagen',
                    'ayuda' => 'Obligatoria si hay imagen: describe qué se ve, para quienes usan lector de pantalla.'],
            ],
            'hijos' => def_enlaces('noticia'),
        ],
        'avisos' => [
            'etiqueta' => 'Comunicados', 'seccion' => 'avisos', 'tabla' => 'avisos', 'titulo' => 'titulo', 'slug' => true,
            'orden_lista' => 'creado_en DESC, orden, id',
            'columnas' => ['titulo', 'etiqueta'],
            'campos' => [
                ['n' => 'titulo', 't' => 'texto', 'e' => 'Título', 'max' => 200, 'req' => true],
                ['n' => 'etiqueta', 't' => 'texto', 'e' => 'Etiqueta', 'max' => 80, 'ayuda' => 'Ej.: Comisión de Aniversario'],
                ['n' => 'texto', 't' => 'largo', 'e' => 'Texto', 'max' => 2000],
                ['n' => 'cierre', 't' => 'texto', 'e' => 'Frase de cierre', 'max' => 200],
                ['n' => 'firma', 't' => 'texto', 'e' => 'Firma', 'max' => 100, 'ayuda' => 'Ej.: La Dirección'],
                ['n' => 'destacado', 't' => 'bool', 'e' => 'Destacado (borde rojo)'],
                ['n' => 'archivado', 't' => 'bool', 'e' => 'Pasar a "Comunicados anteriores"'],
                ['n' => 'vigente_desde', 't' => 'fecha', 'e' => 'Visible desde', 'ayuda' => 'Opcional.'],
                ['n' => 'vigente_hasta', 't' => 'fecha', 'e' => 'Visible hasta', 'ayuda' => 'Opcional: después de esta fecha pasa a "anteriores".'],
            ],
            'hijos' => [
                'filas' => def_items('fila', 'Cronograma (actividad y fecha)', 'Actividad', 'Fecha'),
                'detalles' => def_items('detalle', 'Datos (etiqueta y texto)', 'Etiqueta', 'Texto'),
                'notas' => def_items('nota', 'Notas', '', 'Nota', false),
            ],
        ],
        'calendario_proximas' => [
            'etiqueta' => 'Calendario: próximas actividades', 'seccion' => 'calendario', 'tabla' => 'calendario_proximas', 'titulo' => 'titulo',
            'mover' => true,
            'columnas' => ['titulo', 'etiqueta'],
            'campos' => [
                ['n' => 'titulo', 't' => 'texto', 'e' => 'Título', 'max' => 200, 'req' => true],
                ['n' => 'etiqueta', 't' => 'texto', 'e' => 'Etiqueta', 'max' => 80, 'ayuda' => 'Ej.: 3 al 29 de noviembre'],
                ['n' => 'texto', 't' => 'texto', 'e' => 'Texto', 'max' => 500],
                ['n' => 'enlace_texto', 't' => 'texto', 'e' => 'Texto del enlace', 'max' => 120],
                ['n' => 'enlace_href', 't' => 'enlace', 'e' => 'Dirección del enlace', 'max' => 255],
                ['n' => 'destacado', 't' => 'bool', 'e' => 'Destacado'],
            ],
        ],
        'calendario_items' => [
            'etiqueta' => 'Calendario cívico', 'seccion' => 'calendario', 'tabla' => 'calendario_items', 'titulo' => 'texto',
            'orden_lista' => 'mes, CAST(dia AS UNSIGNED), dia, id',   // por mes y día
            'columnas' => ['mes', 'dia', 'texto'],
            'campos' => [
                ['n' => 'mes', 't' => 'opcion', 'e' => 'Mes', 'req' => true, 'op' => $meses],
                ['n' => 'dia', 't' => 'texto', 'e' => 'Día', 'max' => 40, 'ayuda' => 'Ej.: 25, o 2.º domingo. Puede quedar vacío.'],
                ['n' => 'texto', 't' => 'texto', 'e' => 'Actividad', 'max' => 255, 'req' => true],
            ],
        ],
        'preguntas' => [
            'etiqueta' => 'Preguntas frecuentes', 'seccion' => 'preguntas', 'tabla' => 'preguntas', 'titulo' => 'pregunta',
            'mover' => true,
            'columnas' => ['pregunta'],
            'campos' => [
                ['n' => 'pregunta', 't' => 'texto', 'e' => 'Pregunta', 'max' => 255, 'req' => true],
                ['n' => 'respuesta', 't' => 'largo', 'e' => 'Respuesta', 'max' => 2000, 'req' => true],
            ],
            'hijos' => def_enlaces('pregunta'),
        ],
        'documentos' => [
            'etiqueta' => 'Documentos', 'seccion' => 'documentos', 'tabla' => 'documentos', 'titulo' => 'nombre',
            'mover' => true,
            'columnas' => ['nombre', 'tipo', 'fecha_texto'],
            'campos' => [
                ['n' => 'nombre', 't' => 'texto', 'e' => 'Nombre', 'max' => 200, 'req' => true],
                ['n' => 'descripcion', 't' => 'texto', 'e' => 'Descripción', 'max' => 500],
                ['n' => 'fecha_texto', 't' => 'mes', 'e' => 'Fecha', 'ayuda' => 'Elige el año y, si lo sabes, el mes.'],
                ['n' => 'tipo', 't' => 'opcion', 'e' => 'Tipo de archivo', 'req' => true, 'op' => ['PDF' => 'PDF']],
                ['n' => 'archivo', 't' => 'documento', 'e' => 'Archivo', 'req' => true],
            ],
        ],
        'galeria' => [
            'etiqueta' => 'Galería', 'seccion' => 'galeria', 'tabla' => 'galeria', 'titulo' => 'pie',
            'mover' => true,
            'columnas' => ['tipo', 'pie', 'titulo'],
            'campos' => [
                // 'si' => el campo solo se muestra y se guarda cuando "tipo" tiene ese valor.
                ['n' => 'tipo', 't' => 'opcion', 'e' => 'Tipo', 'req' => true, 'op' => ['foto' => 'Foto', 'video' => 'Video']],
                ['n' => 'src', 't' => 'medio', 'e' => 'Archivo', 'req' => true, 'ayuda' => 'Fotos (JPG, PNG o WEBP) o videos (MP4), según el tipo. De estudiantes, solo con autorización de las familias.',
                    'acepta_segun' => ['campo' => 'tipo', 'ext' => ['foto' => ['jpg', 'jpeg', 'png', 'webp'], 'video' => ['mp4']]]],
                ['n' => 'alt', 't' => 'texto', 'e' => 'Descripción de la foto', 'max' => 255, 'req' => true, 'ayuda' => 'Qué se ve en la foto. La leen los lectores de pantalla.', 'si' => ['tipo' => 'foto']],
                ['n' => 'pie', 't' => 'texto', 'e' => 'Pie de foto', 'max' => 255, 'si' => ['tipo' => 'foto']],
                ['n' => 'titulo', 't' => 'texto', 'e' => 'Título del video', 'max' => 200, 'si' => ['tipo' => 'video']],
                ['n' => 'descripcion', 't' => 'texto', 'e' => 'Descripción del video', 'max' => 500, 'si' => ['tipo' => 'video']],
                ['n' => 'poster', 't' => 'imagen', 'e' => 'Imagen de portada del video', 'ayuda' => 'Opcional: se ve antes de reproducir el video.', 'si' => ['tipo' => 'video']],
            ],
        ],
        'directorio' => [
            'etiqueta' => 'Directorio', 'seccion' => 'directorio', 'tabla' => 'directorio', 'titulo' => 'nombre',
            'mover' => true, 'mover_dentro' => 'grupo', 'orden_lista' => 'grupo_orden, grupo, orden, id',   // las flechas mueven dentro del mismo grupo
            'columnas' => ['nombre', 'cargo', 'grupo'],
            'campos' => [
                // Lista fija de grupos, en el orden en que aparecen en el sitio. "grupo_orden" se calcula solo a partir de esta lista.
                ['n' => 'grupo', 't' => 'opcion', 'e' => 'Grupo', 'req' => true, 'orden_en' => 'grupo_orden',
                    'op' => GRUPOS_DIRECTORIO, 'ayuda' => 'Los grupos aparecen en el sitio en este mismo orden.'],
                ['n' => 'nombre', 't' => 'texto', 'e' => 'Nombre', 'max' => 150, 'req' => true],
                ['n' => 'cargo', 't' => 'texto', 'e' => 'Cargo', 'max' => 100],
                ['n' => 'detalle', 't' => 'texto', 'e' => 'Grado y sección', 'max' => 100],
            ],
        ],
    ];
}

/** Parte de la definición que se envía al navegador (sin datos internos). */
function esquema_para(array $u): array
{
    $res = [];
    foreach (definiciones() as $rec => $d) {
        if (!puede_seccion($u, $d['seccion'])) {
            continue;
        }
        $hijos = [];
        foreach ($d['hijos'] ?? [] as $hn => $h) {
            $hijos[$hn] = ['etiqueta' => $h['etiqueta'], 'campos' => $h['campos']];
        }
        $cols = [];
        foreach ($d['columnas'] as $c) {
            foreach ($d['campos'] as $campo) {
                if ($campo['n'] === $c) { $cols[] = ['n' => $c, 'e' => $campo['e'], 'op' => $campo['op'] ?? null]; }
            }
        }
        $res[$rec] = ['etiqueta' => $d['etiqueta'], 'seccion' => $d['seccion'], 'columnas' => $cols, 'campos' => $d['campos'], 'hijos' => $hijos,
            'mover' => !empty($d['mover']), 'mover_dentro' => $d['mover_dentro'] ?? null];
    }
    return $res;
}

function validar_valor(array $c, $v)
{
    $t = $c['t'];
    $e = $c['e'];
    $req = !empty($c['req']);
    if ($t === 'bool') {
        return ($v === true || $v === 1 || $v === '1' || $v === 'true') ? 1 : 0;
    }
    if ($t === 'mes') {
        // Acepta "Noviembre de 2026" o solo el año "2026".
        $s = trim((string)($v ?? ''));
        if ($s === '') {
            if ($req) {
                throw new ErrorCampo("$e es obligatorio.");
            }
            return '';
        }
        if (!preg_match('/^(?:(' . implode('|', MESES) . ') de )?(\d{4})$/u', $s, $m) || (int)$m[2] < 1950 || (int)$m[2] > 2100) {
            throw new ErrorCampo("$e: elige el mes y el año de la lista.");
        }
        return $s;
    }
    if ($t === 'entero') {
        if ($v === '' || $v === null) {
            return 0;
        }
        if (!is_numeric($v)) {
            throw new ErrorCampo("$e debe ser un número.");
        }
        $n = (int)$v;
        if ($n < -9999 || $n > 99999) {
            throw new ErrorCampo("$e está fuera de rango.");
        }
        return $n;
    }
    $s = (is_string($v) || is_numeric($v)) ? trim((string)$v) : '';
    if ($s === '') {
        if ($req) {
            throw new ErrorCampo("$e es obligatorio.");
        }
        return $t === 'fecha' ? null : '';
    }
    if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $s)) {
        throw new ErrorCampo("$e tiene caracteres no permitidos.");
    }
    $max = (int)($c['max'] ?? 255);
    switch ($t) {
        case 'texto':
        case 'largo':
            if (mb_strlen($s) > $max) {
                throw new ErrorCampo("$e no puede pasar de $max caracteres.");
            }
            return $s;
        case 'opcion':
            if (!array_key_exists($s, $c['op'])) {
                throw new ErrorCampo("$e: opción no válida.");
            }
            return is_int(array_key_first($c['op'])) ? (int)$s : $s;
        case 'fecha':
            $d = DateTime::createFromFormat('Y-m-d', $s);
            if (!$d || $d->format('Y-m-d') !== $s) {
                throw new ErrorCampo("$e: fecha no válida.");
            }
            return $s;
        case 'enlace':
            if (mb_strlen($s) > $max) {
                throw new ErrorCampo("$e es demasiado largo.");
            }
            $ok = preg_match('/^#[\w-]*$/', $s) || preg_match('/^mailto:[^\s@]+@[^\s@]+$/', $s) || preg_match('/^tel:\+?[0-9]{5,15}$/', $s)
                || (preg_match('#^https?://#i', $s) && filter_var($s, FILTER_VALIDATE_URL) !== false);
            if (!$ok) {
                throw new ErrorCampo("$e no es una dirección válida.");
            }
            return $s;
        case 'imagen':
        case 'documento':
        case 'medio':
            $permitidas = ['imagen' => ['jpg', 'jpeg', 'png', 'webp'], 'documento' => ['pdf'], 'medio' => ['jpg', 'jpeg', 'png', 'webp', 'mp4']][$t];
            $ext = strtolower(pathinfo($s, PATHINFO_EXTENSION));
            if (!preg_match(RE_RUTA, $s) || strpos($s, '..') !== false || !in_array($ext, $permitidas, true)) {
                throw new ErrorCampo("$e: archivo no válido. Sube el archivo con el botón.");
            }
            return $s;
    }
    throw new ErrorCampo("$e: tipo desconocido.");
}

function slug_unico(string $tabla, string $texto): string
{
    $mapa = ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n'];
    $base = trim((string)preg_replace('/[^a-z0-9]+/', '-', strtr(mb_strtolower($texto), $mapa)), '-');
    $base = substr($base, 0, 80);
    if ($base === '') {
        $base = 'item';
    }
    $slug = $base;
    $st = db()->prepare("SELECT COUNT(*) FROM `$tabla` WHERE slug = ?");
    for ($i = 2; $i < 200; $i++) {
        $st->execute([$slug]);
        if ((int)$st->fetchColumn() === 0) {
            return $slug;
        }
        $slug = $base . '-' . $i;
    }
    return $base . '-' . bin2hex(random_bytes(3));
}

function def_de(string $rec): array
{
    $d = definiciones();
    if (!isset($d[$rec])) {
        error_api('Sección desconocida.', 404);
    }
    return $d[$rec];
}

function exigir_seccion(array $u, array $def): void
{
    if (!puede_seccion($u, $def['seccion'])) {
        error_api('No tienes permiso para esta sección.', 403);
    }
}

function fila_de(array $def, int $id): array
{
    $st = db()->prepare('SELECT * FROM `' . $def['tabla'] . '` WHERE id = ?');
    $st->execute([$id]);
    $f = $st->fetch();
    if (!$f) {
        error_api('No se encontró el elemento.', 404);
    }
    return $f;
}

function listar_recurso(array $u, string $rec, string $estado): array
{
    $def = def_de($rec);
    exigir_seccion($u, $def);
    $cols = array_map(function ($c) { return '`' . $c . '`'; }, $def['columnas']);
    if (!empty($def['mover_dentro']) && !in_array($def['mover_dentro'], $def['columnas'], true)) {
        $cols[] = '`' . $def['mover_dentro'] . '`';
    }
    $sql = 'SELECT id, estado, orden, actualizado_en, ' . implode(', ', $cols) . ' FROM `' . $def['tabla'] . '`';
    $par = [];
    if ($estado !== '' && in_array($estado, ESTADOS, true)) {
        $sql .= ' WHERE estado = ?';
        $par[] = $estado;
    }
    $sql .= ' ORDER BY ' . ($def['orden_lista'] ?? 'orden, id') . ' LIMIT 500';
    $st = db()->prepare($sql);
    $st->execute($par);
    $filas = [];
    foreach ($st as $f) {
        $celdas = [];
        foreach ($def['columnas'] as $c) { $celdas[$c] = (string)$f[$c]; }
        $filas[] = ['id' => (int)$f['id'], 'estado' => $f['estado'], 'actualizado_en' => $f['actualizado_en'], 'celdas' => $celdas,
            'grupo' => !empty($def['mover_dentro']) ? (string)$f[$def['mover_dentro']] : ''];
    }
    return $filas;
}

function obtener_recurso(array $u, string $rec, int $id): array
{
    $def = def_de($rec);
    exigir_seccion($u, $def);
    $f = fila_de($def, $id);
    $datos = [];
    foreach ($def['campos'] as $c) {
        $datos[$c['n']] = $c['t'] === 'bool' ? (bool)$f[$c['n']] : ($f[$c['n']] === null ? '' : $f[$c['n']]);
    }
    $hijos = [];
    foreach ($def['hijos'] ?? [] as $hn => $h) {
        $sql = 'SELECT * FROM `' . $h['tabla'] . '` WHERE `' . $h['fk'] . '` = ?';
        $par = [$id];
        foreach ($h['fijas'] as $k => $v) { $sql .= ' AND `' . $k . '` = ?'; $par[] = $v; }
        $st = db()->prepare($sql . ' ORDER BY orden, id');
        $st->execute($par);
        $hijos[$hn] = [];
        foreach ($st as $x) {
            $fila = [];
            foreach ($h['campos'] as $c) { $fila[$c['n']] = $c['t'] === 'bool' ? (bool)$x[$c['n']] : $x[$c['n']]; }
            $hijos[$hn][] = $fila;
        }
    }
    return ['id' => $id, 'estado' => $f['estado'], 'datos' => $datos, 'hijos' => $hijos];
}

function puede_editar_fila(array $u, array $fila): bool
{
    if (es_admin($u)) {
        return true;
    }
    return in_array($fila['estado'], ['borrador', 'pendiente'], true);
}

/** ¿El campo aplica según los valores enviados? (clave 'si' de la definición) */
function campo_aplica(array $c, array $datos): bool
{
    foreach ($c['si'] ?? [] as $otro => $valores) {
        if (!in_array((string)($datos[$otro] ?? ''), array_map('strval', (array)$valores), true)) {
            return false;
        }
    }
    return true;
}

function guardar_recurso(array $u, string $rec, array $in): array
{
    $db = db();
    $def = def_de($rec);
    exigir_seccion($u, $def);
    $id = (int)($in['id'] ?? 0);
    $datosIn = is_array($in['datos'] ?? null) ? $in['datos'] : [];
    $hijosIn = is_array($in['hijos'] ?? null) ? $in['hijos'] : [];

    $err = [];
    $vals = [];
    foreach ($def['campos'] as $c) {
        if (!campo_aplica($c, $datosIn)) {
            // Campo que no corresponde (ej.: "Título del video" en una foto): se guarda vacío.
            $vacio = $c;
            unset($vacio['req']);
            $vals[$c['n']] = validar_valor($vacio, null);
            continue;
        }
        try {
            $vals[$c['n']] = validar_valor($c, $datosIn[$c['n']] ?? null);
            $seg = $c['acepta_segun'] ?? null;
            if ($seg && $vals[$c['n']] !== '') {
                $permitidas = $seg['ext'][(string)($datosIn[$seg['campo']] ?? '')] ?? [];
                if (!in_array(strtolower(pathinfo((string)$vals[$c['n']], PATHINFO_EXTENSION)), $permitidas, true)) {
                    throw new ErrorCampo($c['e'] . ': para este tipo usa un archivo ' . strtoupper(implode(', ', $permitidas)) . '.');
                }
            }
        } catch (ErrorCampo $e) {
            $err[$c['n']] = $e->getMessage();
        }
    }
    $hijos = [];
    foreach ($def['hijos'] ?? [] as $hn => $h) {
        $hijos[$hn] = [];
        $filas = is_array($hijosIn[$hn] ?? null) ? array_slice($hijosIn[$hn], 0, 60) : [];
        foreach ($filas as $i => $f) {
            if (!is_array($f)) {
                continue;
            }
            $vacia = true;
            foreach ($h['campos'] as $c) {
                if ($c['t'] !== 'bool' && trim((string)($f[$c['n']] ?? '')) !== '') { $vacia = false; }
            }
            if ($vacia) {
                continue;
            }
            $fila = [];
            foreach ($h['campos'] as $c) {
                try {
                    $fila[$c['n']] = validar_valor($c, $f[$c['n']] ?? null);
                } catch (ErrorCampo $e) {
                    $err[$hn . '.' . $i . '.' . $c['n']] = $e->getMessage();
                }
            }
            $hijos[$hn][] = $fila;
        }
    }
    if ($err) {
        error_api('Revisa los campos marcados.', 422, ['campos' => $err]);
    }
    // Obligatorio solo si otro campo tiene valor (ej.: descripción de la imagen cuando hay imagen).
    foreach ($def['campos'] as $c) {
        if (!empty($c['req_si']) && ($vals[$c['req_si']] ?? '') !== '' && ($vals[$c['n']] ?? '') === '') {
            $err[$c['n']] = $c['e'] . ' es obligatoria cuando hay imagen.';
        }
    }
    if ($err) {
        error_api('Revisa los campos marcados.', 422, ['campos' => $err]);
    }
    // Campos de lista que también guardan su texto en otra columna (ej.: categoría -> etiqueta visible).
    foreach ($def['campos'] as $c) {
        if (!empty($c['texto_en']) && ($vals[$c['n']] ?? '') !== '') {
            $vals[$c['texto_en']] = (string)$c['op'][$vals[$c['n']]];
        }
    }
    // Campos de lista que también fijan un orden (ej.: el grupo del directorio fija "grupo_orden": 10, 20, 30…).
    foreach ($def['campos'] as $c) {
        if (!empty($c['orden_en']) && ($vals[$c['n']] ?? '') !== '') {
            $pos = array_search((string)$vals[$c['n']], array_map('strval', array_keys($c['op'])), true);
            $vals[$c['orden_en']] = ($pos === false ? count($c['op']) : $pos + 1) * 10;
        }
    }

    $db->beginTransaction();
    try {
        if ($id === 0) {
            if (($vals['orden'] ?? 0) === 0) {
                $m = $db->query('SELECT COALESCE(MAX(orden), 0) + 10 FROM `' . $def['tabla'] . '`');
                $vals['orden'] = (int)$m->fetchColumn();
            }
            $vals['estado'] = 'borrador';
            if (!empty($def['slug'])) {
                $vals['slug'] = slug_unico($def['tabla'], (string)$vals[$def['titulo']]);
            }
            $vals['creado_por'] = $u['id'];
            $vals['actualizado_por'] = $u['id'];
            $cols = array_keys($vals);
            $sql = 'INSERT INTO `' . $def['tabla'] . '` (`' . implode('`, `', $cols) . '`) VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')';
            $db->prepare($sql)->execute(array_values($vals));
            $id = (int)$db->lastInsertId();
            $accion = 'crear';
        } else {
            $fila = fila_de($def, $id);
            if (!puede_editar_fila($u, $fila)) {
                $db->rollBack();
                error_api('Solo una administradora puede editar contenido ya publicado o archivado.', 403);
            }
            $vals['actualizado_por'] = $u['id'];
            $sets = [];
            foreach (array_keys($vals) as $k) { $sets[] = '`' . $k . '` = ?'; }
            $par = array_values($vals);
            $par[] = $id;
            $db->prepare('UPDATE `' . $def['tabla'] . '` SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($par);
            $accion = 'editar';
        }
        foreach ($def['hijos'] ?? [] as $hn => $h) {
            $sql = 'DELETE FROM `' . $h['tabla'] . '` WHERE `' . $h['fk'] . '` = ?';
            $par = [$id];
            foreach ($h['fijas'] as $k => $v) { $sql .= ' AND `' . $k . '` = ?'; $par[] = $v; }
            $db->prepare($sql)->execute($par);
            foreach ($hijos[$hn] as $i => $fila) {
                $fila[$h['fk']] = $id;
                foreach ($h['fijas'] as $k => $v) { $fila[$k] = $v; }
                $fila['orden'] = ($i + 1) * 10;
                $cols = array_keys($fila);
                $db->prepare('INSERT INTO `' . $h['tabla'] . '` (`' . implode('`, `', $cols) . '`) VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')')
                   ->execute(array_values($fila));
            }
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }
    registrar($accion, $rec, $id, mb_substr((string)($vals[$def['titulo']] ?? ''), 0, 120));
    return ['id' => $id];
}

function cambiar_estado(array $u, string $rec, int $id, string $nuevo): void
{
    $def = def_de($rec);
    exigir_seccion($u, $def);
    if (!in_array($nuevo, ESTADOS, true)) {
        error_api('Estado no válido.', 422);
    }
    $fila = fila_de($def, $id);
    if (!es_admin($u)) {
        $permitido = ($fila['estado'] === 'borrador' && $nuevo === 'pendiente') || ($fila['estado'] === 'pendiente' && $nuevo === 'borrador');
        if (!$permitido) {
            error_api('Solo una administradora puede publicar, archivar o retirar contenido publicado.', 403);
        }
    }
    db()->prepare('UPDATE `' . $def['tabla'] . '` SET estado = ?, actualizado_por = ? WHERE id = ?')->execute([$nuevo, $u['id'], $id]);
    registrar('estado', $rec, $id, $fila['estado'] . ' -> ' . $nuevo);
}

/** Sube o baja un elemento un lugar (flechas de la lista). Solo administradoras. */
function mover_recurso(array $u, string $rec, int $id, string $dir): void
{
    $def = def_de($rec);
    exigir_seccion($u, $def);
    if (empty($def['mover'])) {
        error_api('Esta sección se ordena sola.', 422);
    }
    if (!es_admin($u)) {
        error_api('Solo una administradora puede cambiar el orden.', 403);
    }
    if (!in_array($dir, ['arriba', 'abajo'], true)) {
        error_api('Dirección no válida.', 422);
    }
    $fila = fila_de($def, $id);
    $tabla = $def['tabla'];
    $where = '';
    $par = [];
    if (!empty($def['mover_dentro'])) {
        $where = ' WHERE `' . $def['mover_dentro'] . '` = ?';
        $par[] = $fila[$def['mover_dentro']];
    }
    $db = db();
    $db->beginTransaction();
    try {
        $st = $db->prepare('SELECT id FROM `' . $tabla . '`' . $where . ' ORDER BY orden, id FOR UPDATE');
        $st->execute($par);
        $ids = array_map('intval', $st->fetchAll(PDO::FETCH_COLUMN));
        $i = array_search($id, $ids, true);
        $j = $dir === 'arriba' ? $i - 1 : $i + 1;
        if ($i === false || $j < 0 || $j >= count($ids)) {
            $db->rollBack();
            return;   // ya está en el extremo
        }
        [$ids[$i], $ids[$j]] = [$ids[$j], $ids[$i]];
        // Renumera 10, 20, 30… sin tocar la fecha de "Actualizado".
        $up = $db->prepare('UPDATE `' . $tabla . '` SET orden = ?, actualizado_en = actualizado_en WHERE id = ?');
        foreach ($ids as $n => $x) {
            $up->execute([($n + 1) * 10, $x]);
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }
    registrar('mover', $rec, $id, $dir);
}

function eliminar_recurso(array $u, string $rec, int $id): void
{
    $def = def_de($rec);
    exigir_seccion($u, $def);
    $fila = fila_de($def, $id);
    if (!es_admin($u) && !($fila['estado'] === 'borrador' && (int)$fila['creado_por'] === $u['id'])) {
        error_api('Solo una administradora puede eliminar contenido. Una editora puede eliminar sus propios borradores.', 403);
    }
    $db = db();
    $db->beginTransaction();
    try {
        foreach ($def['hijos'] ?? [] as $h) {
            $sql = 'DELETE FROM `' . $h['tabla'] . '` WHERE `' . $h['fk'] . '` = ?';
            $par = [$id];
            foreach ($h['fijas'] as $k => $v) { $sql .= ' AND `' . $k . '` = ?'; $par[] = $v; }
            $db->prepare($sql)->execute($par);
        }
        $db->prepare('DELETE FROM `' . $def['tabla'] . '` WHERE id = ?')->execute([$id]);
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        throw $e;
    }
    registrar('eliminar', $rec, $id, mb_substr((string)($fila[$def['titulo']] ?? ''), 0, 120));
}

function resumen_para(array $u): array
{
    $res = ['recursos' => [], 'pendientes' => []];
    foreach (definiciones() as $rec => $d) {
        if (!puede_seccion($u, $d['seccion'])) {
            continue;
        }
        $cuenta = ['borrador' => 0, 'pendiente' => 0, 'publicado' => 0, 'archivado' => 0];
        foreach (db()->query('SELECT estado, COUNT(*) AS n FROM `' . $d['tabla'] . '` GROUP BY estado') as $f) {
            $cuenta[$f['estado']] = (int)$f['n'];
        }
        $res['recursos'][$rec] = ['etiqueta' => $d['etiqueta'], 'conteo' => $cuenta];
        $st = db()->query("SELECT id, `" . $d['titulo'] . "` AS t FROM `" . $d['tabla'] . "` WHERE estado = 'pendiente' ORDER BY actualizado_en DESC LIMIT 20");
        foreach ($st as $f) {
            $res['pendientes'][] = ['recurso' => $rec, 'etiqueta' => $d['etiqueta'], 'id' => (int)$f['id'], 'titulo' => (string)$f['t']];
        }
    }
    return $res;
}
