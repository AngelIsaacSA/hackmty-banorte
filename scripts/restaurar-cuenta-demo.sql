-- Restaura la cuenta demo de Carlos Ramírez Mendoza (0218-1234-5678) que se
-- perdió cuando el script de seed general truncó las tablas. Este script
-- NO usa TRUNCATE y NO toca ningún cliente/cuenta que ya exista de otros
-- seeds — solo inserta lo mínimo para que las tools del chatbot (historial,
-- búsqueda, proyección) vuelvan a tener datos.
--
-- Es seguro correrlo más de una vez: si la cuenta ya existe, no duplica
-- nada (los IF NOT EXISTS/IF v_x IS NULL lo cubren).

DO $$
DECLARE
  v_cliente_id uuid;
  v_cuenta_id uuid;
BEGIN

  -- 1. Cliente demo (reusa uno existente con este email si ya lo insertó
  -- el seed grande, o lo crea si no existe)
  SELECT id INTO v_cliente_id FROM cliente WHERE email = 'carlos.ramirez@banorte.demo';
  IF v_cliente_id IS NULL THEN
    INSERT INTO cliente (nombre, apellidos, fecha_nacimiento, email, telefono, estatus)
    VALUES ('Carlos', 'Ramírez Mendoza', '1988-04-12', 'carlos.ramirez@banorte.demo', '8112345678', 'activo')
    RETURNING id INTO v_cliente_id;
  END IF;

  -- 2. Cuenta con el número exacto que usa toda la app (CUENTA_DEMO_NUMERO
  -- en lib/queries.js). Si por algún motivo ya existe con otro cliente_id
  -- o saldo distinto, la deja consistente.
  SELECT id INTO v_cuenta_id FROM cuenta WHERE numero_cuenta = '0218-1234-5678';
  IF v_cuenta_id IS NULL THEN
    INSERT INTO cuenta (cliente_id, numero_cuenta, tipo, saldo, estatus, moneda)
    VALUES (v_cliente_id, '0218-1234-5678', 'debito', 18450.32, 'activa', 'MXN')
    RETURNING id INTO v_cuenta_id;
  ELSE
    UPDATE cuenta
    SET cliente_id = v_cliente_id, saldo = 18450.32, estatus = 'activa'
    WHERE id = v_cuenta_id;
  END IF;

  -- 3. Movimientos de agosto 2026 (solo si la cuenta todavía no tiene
  -- ninguno — no duplica si ya insertaron algo para ella)
  IF NOT EXISTS (SELECT 1 FROM movimiento WHERE cuenta_id = v_cuenta_id) THEN
    INSERT INTO movimiento (cuenta_id, fecha, monto, tipo, descripcion, comercio, tipo_operacion, saldo_despues, canal)
    VALUES
      (v_cuenta_id, '2026-08-01', -8500,    'cargo', 'Pago de renta mensual',    'Renta Departamento',      'transferencia', 30000.00, 'app'),
      (v_cuenta_id, '2026-08-02', -620.50,  'cargo', 'Pago de luz',              'CFE',                     'pago_servicio', 29379.50, 'app'),
      (v_cuenta_id, '2026-08-02', -67,      'cargo', 'Compra en tienda',         'OXXO',                    'compra',        29312.50, 'app'),
      (v_cuenta_id, '2026-08-03', -219,     'cargo', 'Suscripción mensual',      'Netflix',                 'pago_servicio', 29093.50, 'app'),
      (v_cuenta_id, '2026-08-04', -115,     'cargo', 'Suscripción mensual',      'Spotify',                 'pago_servicio', 28978.50, 'app'),
      (v_cuenta_id, '2026-08-05', -1245.80, 'cargo', 'Despensa quincenal',       'Walmart',                 'compra',        27732.70, 'app'),
      (v_cuenta_id, '2026-08-06', -134.20,  'cargo', 'Viaje al trabajo',         'Uber',                    'compra',        27598.50, 'app'),
      (v_cuenta_id, '2026-08-07', 22000,    'abono', 'Pago de nómina quincenal', 'Depósito Nómina',         'deposito',      49598.50, 'app'),
      (v_cuenta_id, '2026-08-08', -399,     'cargo', 'Plan celular',             'Telcel',                  'pago_servicio', 49199.50, 'app'),
      (v_cuenta_id, '2026-08-09', -89,      'cargo', 'Café',                     'Starbucks',               'compra',        49110.50, 'app'),
      (v_cuenta_id, '2026-08-10', -45.50,   'cargo', 'Compra en tienda',         'OXXO',                    'compra',        49065.00, 'app'),
      (v_cuenta_id, '2026-08-12', -312,     'cargo', 'Medicamentos',             'Farmacia Guadalajara',    'compra',        48753.00, 'app'),
      (v_cuenta_id, '2026-08-13', -280,     'cargo', 'Pago de gas',              'Gas Natural',             'pago_servicio', 48473.00, 'app'),
      (v_cuenta_id, '2026-08-15', -210,     'cargo', 'Boletos de cine',          'Cinépolis',               'compra',        48263.00, 'app'),
      (v_cuenta_id, '2026-08-16', -560.90,  'cargo', 'Compra de audífonos',      'Amazon',                  'compra',        47702.10, 'app'),
      (v_cuenta_id, '2026-08-18', -430,     'cargo', 'Cena',                     'Restaurante La Parrilla', 'compra',        47272.10, 'app'),
      (v_cuenta_id, '2026-08-20', -449,     'cargo', 'Membresía mensual',        'Gimnasio Smart Fit',      'pago_servicio', 46823.10, 'app'),
      (v_cuenta_id, '2026-08-22', 22000,    'abono', 'Pago de nómina quincenal', 'Depósito Nómina',         'deposito',      68823.10, 'app'),
      (v_cuenta_id, '2026-08-25', -67,      'cargo', 'Compra en tienda',         'OXXO',                    'compra',        68756.10, 'app'),
      (v_cuenta_id, '2026-08-28', -195.40,  'cargo', 'Pedido a domicilio',       'Uber Eats',               'compra',        68560.70, 'app');
  END IF;

  -- 4. Gastos recurrentes (para que "¿me alcanza?" tenga algo que sumar)
  IF NOT EXISTS (SELECT 1 FROM recurrente WHERE cuenta_id = v_cuenta_id) THEN
    INSERT INTO recurrente (cuenta_id, descripcion, monto, frecuencia, estatus, dia_cobro, fecha_siguiente)
    VALUES
      (v_cuenta_id, 'Netflix',            219, 'mensual', 'activo', 3,  '2026-08-31'),
      (v_cuenta_id, 'Spotify',            115, 'mensual', 'activo', 4,  '2026-08-30'),
      (v_cuenta_id, 'Gimnasio Smart Fit', 449, 'mensual', 'activo', 20, '2026-08-29');
  END IF;

  RAISE NOTICE 'Cuenta demo lista: cliente_id=%, cuenta_id=%', v_cliente_id, v_cuenta_id;
END $$;

-- Verificación rápida
SELECT c.numero_cuenta, c.saldo, cl.nombre, cl.apellidos,
       (SELECT count(*) FROM movimiento m WHERE m.cuenta_id = c.id) AS movimientos,
       (SELECT count(*) FROM recurrente r WHERE r.cuenta_id = c.id) AS recurrentes
FROM cuenta c
JOIN cliente cl ON cl.id = c.cliente_id
WHERE c.numero_cuenta = '0218-1234-5678';
