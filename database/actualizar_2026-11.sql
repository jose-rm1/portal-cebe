-- Ajustes de datos para una base ya instalada (ejecutar una sola vez en phpMyAdmin, pestaña SQL).
-- 1) Corrige el nombre del grupo del directorio: PRITTE -> PRITE.
UPDATE directorio SET grupo = 'Docentes del SAANEE y PRITE' WHERE grupo = 'Docentes del SAANEE y PRITTE';
UPDATE directorio SET detalle = 'PRITE' WHERE detalle = 'PRITTE';
-- 2) La etiqueta de cada noticia ahora sale de su categoría.
UPDATE noticias SET etiqueta = CASE categoria
  WHEN 'aniversario' THEN 'Aniversario' WHEN 'actividades' THEN 'Actividades'
  WHEN 'familias' THEN 'Familias' WHEN 'convivencia' THEN 'Convivencia' ELSE etiqueta END;
