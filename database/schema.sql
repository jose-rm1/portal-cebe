-- Base de datos del portal del CEBE "Félix y Carolina de Repetti"
-- Compatible con MySQL 5.7+ y MariaDB 10+ (XAMPP e InfinityFree).
-- Importa este archivo primero y luego datos_iniciales.sql.
CREATE DATABASE IF NOT EXISTS portal_cebe
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE portal_cebe;

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario VARCHAR(50) NOT NULL,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(150) NULL,
  clave_hash VARCHAR(255) NOT NULL,
  rol ENUM('administradora','editora') NOT NULL DEFAULT 'editora',
  principal TINYINT(1) NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  debe_cambiar_clave TINYINT(1) NOT NULL DEFAULT 1,
  intentos_fallidos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  bloqueado_hasta DATETIME NULL,
  ultimo_acceso DATETIME NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuario (usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permisos_usuario (
  usuario_id INT UNSIGNED NOT NULL,
  seccion VARCHAR(30) NOT NULL,
  PRIMARY KEY (usuario_id, seccion),
  CONSTRAINT fk_permisos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS noticias (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(100) NOT NULL,
  categoria VARCHAR(30) NOT NULL,
  etiqueta VARCHAR(40) NOT NULL,
  fecha_texto VARCHAR(40) NOT NULL DEFAULT '',
  titulo VARCHAR(200) NOT NULL,
  resumen TEXT NOT NULL,
  imagen VARCHAR(255) NOT NULL DEFAULT '',
  alt VARCHAR(255) NOT NULL DEFAULT '',
  estado ENUM('borrador','pendiente','publicado','archivado') NOT NULL DEFAULT 'borrador',
  orden INT NOT NULL DEFAULT 0,
  creado_por INT UNSIGNED NULL,
  actualizado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_noticia_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enlaces (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  entidad ENUM('noticia','pregunta') NOT NULL,
  entidad_id INT UNSIGNED NOT NULL,
  texto VARCHAR(120) NOT NULL,
  href VARCHAR(255) NOT NULL,
  externo TINYINT(1) NOT NULL DEFAULT 0,
  orden INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_enlace_entidad (entidad, entidad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS avisos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(100) NOT NULL,
  etiqueta VARCHAR(80) NOT NULL DEFAULT '',
  titulo VARCHAR(200) NOT NULL,
  texto TEXT NULL,
  cierre VARCHAR(200) NOT NULL DEFAULT '',
  firma VARCHAR(100) NOT NULL DEFAULT '',
  destacado TINYINT(1) NOT NULL DEFAULT 0,
  archivado TINYINT(1) NOT NULL DEFAULT 0,
  vigente_desde DATE NULL,
  vigente_hasta DATE NULL,
  estado ENUM('borrador','pendiente','publicado','archivado') NOT NULL DEFAULT 'borrador',
  orden INT NOT NULL DEFAULT 0,
  creado_por INT UNSIGNED NULL,
  actualizado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_aviso_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS aviso_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  aviso_id INT UNSIGNED NOT NULL,
  tipo ENUM('fila','detalle','nota') NOT NULL,
  col_a VARCHAR(500) NOT NULL DEFAULT '',
  col_b VARCHAR(500) NOT NULL DEFAULT '',
  orden INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_item_aviso (aviso_id),
  CONSTRAINT fk_item_aviso FOREIGN KEY (aviso_id) REFERENCES avisos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calendario_proximas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  etiqueta VARCHAR(80) NOT NULL DEFAULT '',
  titulo VARCHAR(200) NOT NULL,
  texto VARCHAR(500) NOT NULL DEFAULT '',
  enlace_texto VARCHAR(120) NOT NULL DEFAULT '',
  enlace_href VARCHAR(255) NOT NULL DEFAULT '',
  destacado TINYINT(1) NOT NULL DEFAULT 0,
  estado ENUM('borrador','pendiente','publicado','archivado') NOT NULL DEFAULT 'borrador',
  orden INT NOT NULL DEFAULT 0,
  creado_por INT UNSIGNED NULL,
  actualizado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS calendario_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  mes TINYINT UNSIGNED NOT NULL,
  dia VARCHAR(40) NOT NULL DEFAULT '',
  texto VARCHAR(255) NOT NULL,
  estado ENUM('borrador','pendiente','publicado','archivado') NOT NULL DEFAULT 'borrador',
  orden INT NOT NULL DEFAULT 0,
  creado_por INT UNSIGNED NULL,
  actualizado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cal_mes (mes)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS preguntas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pregunta VARCHAR(255) NOT NULL,
  respuesta TEXT NOT NULL,
  estado ENUM('borrador','pendiente','publicado','archivado') NOT NULL DEFAULT 'borrador',
  orden INT NOT NULL DEFAULT 0,
  creado_por INT UNSIGNED NULL,
  actualizado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documentos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(200) NOT NULL,
  descripcion VARCHAR(500) NOT NULL DEFAULT '',
  fecha_texto VARCHAR(40) NOT NULL DEFAULT '',
  tipo VARCHAR(20) NOT NULL DEFAULT 'PDF',
  archivo VARCHAR(255) NOT NULL,
  estado ENUM('borrador','pendiente','publicado','archivado') NOT NULL DEFAULT 'borrador',
  orden INT NOT NULL DEFAULT 0,
  creado_por INT UNSIGNED NULL,
  actualizado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS galeria (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tipo ENUM('foto','video') NOT NULL,
  src VARCHAR(255) NOT NULL,
  poster VARCHAR(255) NOT NULL DEFAULT '',
  alt VARCHAR(255) NOT NULL DEFAULT '',
  pie VARCHAR(255) NOT NULL DEFAULT '',
  titulo VARCHAR(200) NOT NULL DEFAULT '',
  descripcion VARCHAR(500) NOT NULL DEFAULT '',
  estado ENUM('borrador','pendiente','publicado','archivado') NOT NULL DEFAULT 'borrador',
  orden INT NOT NULL DEFAULT 0,
  creado_por INT UNSIGNED NULL,
  actualizado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS directorio (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  grupo VARCHAR(100) NOT NULL,
  grupo_orden INT NOT NULL DEFAULT 0,
  nombre VARCHAR(150) NOT NULL,
  cargo VARCHAR(100) NOT NULL DEFAULT '',
  detalle VARCHAR(100) NOT NULL DEFAULT '',
  estado ENUM('borrador','pendiente','publicado','archivado') NOT NULL DEFAULT 'borrador',
  orden INT NOT NULL DEFAULT 0,
  creado_por INT UNSIGNED NULL,
  actualizado_por INT UNSIGNED NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS registro_actividad (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NULL,
  accion VARCHAR(40) NOT NULL,
  entidad VARCHAR(40) NOT NULL DEFAULT '',
  entidad_id INT UNSIGNED NULL,
  detalle VARCHAR(500) NOT NULL DEFAULT '',
  ip VARCHAR(45) NOT NULL DEFAULT '',
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_actividad_fecha (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
