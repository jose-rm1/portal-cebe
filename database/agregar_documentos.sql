-- Agrega las 3 guías del Minedu a la sección Documentos (solo si usas la base de datos).
-- Antes, copia los PDF a la carpeta documentos/ del servidor. Ejecútalo una sola vez en phpMyAdmin (pestaña SQL).
INSERT INTO documentos (nombre, descripcion, fecha_texto, tipo, archivo, estado, orden) VALUES
('Organizar el trabajo con las familias en el CEBE', 'Guía de orientaciones del Ministerio de Educación para organizar el trabajo con las familias en el Centro de Educación Básica Especial.', 'Minedu, 2022', 'PDF', 'documentos/guia-orientaciones-organizar-trabajo-familias-cebe.pdf', 'publicado', 10),
('Organización del trabajo de los equipos interdisciplinarios en los CEBE', 'Guía de orientaciones del Ministerio de Educación sobre la organización y las funciones del equipo interdisciplinario.', 'Minedu, 2023', 'PDF', 'documentos/organizar-trabajo-equipos-interdisciplinarios-cebe.pdf', 'publicado', 20),
('El tránsito a la vida adulta en el CEBE', 'Guía de orientaciones del Ministerio de Educación para acompañar a los estudiantes en su tránsito a la vida adulta.', 'Minedu, 2023', 'PDF', 'documentos/el-transito-a-la-vida-adulta.pdf', 'publicado', 30);
