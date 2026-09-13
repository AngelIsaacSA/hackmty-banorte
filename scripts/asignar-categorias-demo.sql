-- Asigna categoria_id a los 20 movimientos de la cuenta demo
-- (0218-1234-5678), que quedaron con categoria_id = null tras el script de
-- restauración (scripts/restaurar-cuenta-demo.sql). Sin esto,
-- get_gasto_por_categoria / get_resumen_gastos agrupan todo bajo
-- "Sin categoría" (ver Pendiente #5 en CONTEXT.md).
--
-- No usa TRUNCATE ni borra nada. Solo hace UPDATE ... WHERE categoria_id IS
-- NULL, así que es seguro correrlo más de una vez y no toca movimientos de
-- otras cuentas ni categorías ya asignadas a mano.
--
-- Usa ILIKE '%patron%' contra categoria.nombre en vez de un nombre exacto,
-- por si el catálogo real usa una variante de capitalización o redacción
-- distinta a la que se ve aquí (Restaurantes, Transporte, Supermercado,
-- etc., según lo reportado en CONTEXT.md). Si ningún patrón hace match para
-- un comercio, ese movimiento simplemente se queda sin tocar (no falla el
-- script) y hay que revisar el catálogo real de categoria a mano.

DO $$
DECLARE
  v_cuenta_id uuid;
BEGIN
  SELECT id INTO v_cuenta_id FROM cuenta WHERE numero_cuenta = '0218-1234-5678';
  IF v_cuenta_id IS NULL THEN
    RAISE NOTICE 'No se encontró la cuenta demo 0218-1234-5678, nada que actualizar.';
    RETURN;
  END IF;

  -- Vivienda / renta
  UPDATE movimiento SET categoria_id = (
    SELECT id FROM categoria
    WHERE nombre ILIKE '%vivienda%' OR nombre ILIKE '%renta%' OR nombre ILIKE '%hogar%'
    LIMIT 1
  )
  WHERE cuenta_id = v_cuenta_id AND categoria_id IS NULL AND comercio = 'Renta Departamento';

  -- Servicios (luz, gas, celular)
  UPDATE movimiento SET categoria_id = (
    SELECT id FROM categoria WHERE nombre ILIKE '%servicio%' LIMIT 1
  )
  WHERE cuenta_id = v_cuenta_id AND categoria_id IS NULL
    AND comercio IN ('CFE', 'Gas Natural', 'Telcel');

  -- Supermercado / conveniencia
  UPDATE movimiento SET categoria_id = (
    SELECT id FROM categoria
    WHERE nombre ILIKE '%super%' OR nombre ILIKE '%conveniencia%' OR nombre ILIKE '%tienda%'
    LIMIT 1
  )
  WHERE cuenta_id = v_cuenta_id AND categoria_id IS NULL
    AND comercio IN ('OXXO', 'Walmart');

  -- Entretenimiento (streaming, cine)
  UPDATE movimiento SET categoria_id = (
    SELECT id FROM categoria
    WHERE nombre ILIKE '%entreten%' OR nombre ILIKE '%streaming%' OR nombre ILIKE '%suscrip%'
    LIMIT 1
  )
  WHERE cuenta_id = v_cuenta_id AND categoria_id IS NULL
    AND comercio IN ('Netflix', 'Spotify', 'Cinépolis');

  -- Transporte
  UPDATE movimiento SET categoria_id = (
    SELECT id FROM categoria WHERE nombre ILIKE '%transporte%' LIMIT 1
  )
  WHERE cuenta_id = v_cuenta_id AND categoria_id IS NULL AND comercio = 'Uber';

  -- Restaurantes / comida
  UPDATE movimiento SET categoria_id = (
    SELECT id FROM categoria
    WHERE nombre ILIKE '%restaurant%' OR nombre ILIKE '%comida%' OR nombre ILIKE '%cafe%'
       OR nombre ILIKE '%café%'
    LIMIT 1
  )
  WHERE cuenta_id = v_cuenta_id AND categoria_id IS NULL
    AND comercio IN ('Starbucks', 'Restaurante La Parrilla', 'Uber Eats');

  -- Salud / deporte
  UPDATE movimiento SET categoria_id = (
    SELECT id FROM categoria
    WHERE nombre ILIKE '%salud%' OR nombre ILIKE '%farmacia%' OR nombre ILIKE '%deporte%'
       OR nombre ILIKE '%gimnasio%'
    LIMIT 1
  )
  WHERE cuenta_id = v_cuenta_id AND categoria_id IS NULL
    AND comercio IN ('Farmacia Guadalajara', 'Gimnasio Smart Fit');

  -- Compras / otros
  UPDATE movimiento SET categoria_id = (
    SELECT id FROM categoria WHERE nombre ILIKE '%compra%' OR nombre ILIKE '%otro%' LIMIT 1
  )
  WHERE cuenta_id = v_cuenta_id AND categoria_id IS NULL AND comercio = 'Amazon';

  -- Ingreso / nómina (abonos, no gastos, pero completan el catálogo)
  UPDATE movimiento SET categoria_id = (
    SELECT id FROM categoria
    WHERE nombre ILIKE '%ingreso%' OR nombre ILIKE '%nomina%' OR nombre ILIKE '%nómina%'
       OR nombre ILIKE '%sueldo%'
    LIMIT 1
  )
  WHERE cuenta_id = v_cuenta_id AND categoria_id IS NULL AND comercio = 'Depósito Nómina';

  RAISE NOTICE 'Categorías asignadas para cuenta_id=%', v_cuenta_id;
END $$;

-- Verificación: debe mostrar cada comercio con su categoría (nombre), y
-- ningún renglón en null si el catálogo real tenía todas estas categorías.
SELECT m.comercio, m.monto, c.nombre AS categoria
FROM movimiento m
JOIN cuenta cu ON cu.id = m.cuenta_id
LEFT JOIN categoria c ON c.id = m.categoria_id
WHERE cu.numero_cuenta = '0218-1234-5678'
ORDER BY m.fecha;
