<?php
// Copia este archivo como config/config.php y cambia los datos.
// config.php NO debe subirse a GitHub (ya está en .gitignore).
return [
    'db_host'    => 'localhost',   // En InfinityFree: el "MySQL Hostname" de tu panel (ej. sql123.infinityfree.com)
    'db_nombre'  => 'cebe',        // Nombre de la base de datos
    'db_usuario' => 'root',        // En XAMPP: root. En InfinityFree: el usuario MySQL de tu panel
    'db_clave'   => '',            // En XAMPP: vacía. En InfinityFree: la contraseña de tu panel
    'entorno'    => 'local',       // 'local' o 'produccion'
];
