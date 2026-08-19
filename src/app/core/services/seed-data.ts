import {
  Cliente, Cotizacion, Diagnostico, Motocicleta, MovimientoInventario,
  OrdenTrabajo, PedidoAlmacen, PedidoDetalle, Producto, RegistroAuditoria, Usuario
} from '../models/models';

// Datos de ejemplo para que el taller pueda evaluar el sistema sin backend.
// Los IDs son fijos (no generados) para que las relaciones queden consistentes al primer arranque.

export const USUARIOS_SEED: Usuario[] = [
  { id: 'u_recepcion', nombre: 'Carla Ramos', usuario: 'recepcion', passwordHash: 'demo', rol: 'recepcion', activo: true },
  { id: 'u_mecanico1', nombre: 'Jhon Quispe', usuario: 'mecanico', passwordHash: 'demo', rol: 'mecanico', activo: true },
  { id: 'u_mecanico2', nombre: 'Luis Falcón', usuario: 'mecanico2', passwordHash: 'demo', rol: 'mecanico', activo: true },
  { id: 'u_almacen', nombre: 'Rosa Injante', usuario: 'almacen', passwordHash: 'demo', rol: 'almacen', activo: true },
  { id: 'u_jefe', nombre: 'Miguel Huamán', usuario: 'jefe', passwordHash: 'demo', rol: 'jefe_taller', activo: true },
  { id: 'u_admin', nombre: 'Administrador MHESUS', usuario: 'admin', passwordHash: 'demo', rol: 'administracion', activo: true }
];

export const CLIENTES_SEED: Cliente[] = [
  { id: 'c_1', dni: '42839112', nombres: 'Renato', apellidos: 'Salcedo Díaz', celular: '956821034', direccion: 'Jr. Lima 245, Chincha Alta', creadoEn: '2026-06-02T14:20:00.000Z' },
  { id: 'c_2', dni: '71982045', nombres: 'Milagros', apellidos: 'Torres Vega', celular: '944210987', direccion: 'Av. Oscar R. Benavides 810', creadoEn: '2026-06-10T09:05:00.000Z' },
  { id: 'c_3', dni: '46223190', nombres: 'Edwin', apellidos: 'Cárdenas Ponce', celular: '987654321', direccion: 'Calle Los Álamos 112, Pueblo Nuevo', creadoEn: '2026-07-01T11:40:00.000Z' }
];

export const MOTOS_SEED: Motocicleta[] = [
  { id: 'm_1', clienteId: 'c_1', placa: 'MTL-812', marca: 'Honda', modelo: 'CB160F', anio: 2023, kmActual: 8420 },
  { id: 'm_2', clienteId: 'c_2', placa: 'MTP-334', marca: 'Bajaj', modelo: 'Pulsar NS200', anio: 2022, kmActual: 15230 },
  { id: 'm_3', clienteId: 'c_3', placa: 'MTQ-556', marca: 'Honda', modelo: 'XR150L', anio: 2021, kmActual: 22110 }
];

export const PRODUCTOS_SEED: Producto[] = [
  { id: 'p_1', codigo: 'ACE-10W40', nombre: 'Aceite motor 10W-40 (1L)', categoria: 'Lubricantes', precio: 32, stockActual: 40, stockMinimo: 10 },
  { id: 'p_2', codigo: 'FIL-AIR-01', nombre: 'Filtro de aire universal', categoria: 'Filtros', precio: 18, stockActual: 14, stockMinimo: 5 },
  { id: 'p_3', codigo: 'PAS-DEL-01', nombre: 'Pastillas de freno delanteras', categoria: 'Frenos', precio: 45, stockActual: 6, stockMinimo: 8 },
  { id: 'p_4', codigo: 'CAD-428H', nombre: 'Cadena de transmisión 428H', categoria: 'Transmisión', precio: 95, stockActual: 9, stockMinimo: 4 },
  { id: 'p_5', codigo: 'BUJ-STD', nombre: 'Bujía estándar', categoria: 'Encendido', precio: 12, stockActual: 30, stockMinimo: 10 },
  { id: 'p_6', codigo: 'LLA-TRAS-01', nombre: 'Llanta trasera 100/90-17', categoria: 'Llantas', precio: 180, stockActual: 3, stockMinimo: 3 }
];

const hoy = new Date().toISOString();

export const OTS_SEED: OrdenTrabajo[] = [
  {
    id: 'ot_1', numeroOT: 'OT-2026-0001', clienteId: 'c_1', motoId: 'm_1', mecanicoId: 'u_mecanico1', asesorId: 'u_recepcion',
    estado: 'En ejecución', nivelCombustible: '1/2',
    observacionCliente: 'Ruido en el motor al acelerar', servicioARealizar: 'Mantenimiento + revisión de ruido', creadoEn: hoy,
    trabajoIniciadoEn: hoy, trabajoFinalizadoEn: null
  },
  {
    id: 'ot_2', numeroOT: 'OT-2026-0002', clienteId: 'c_2', motoId: 'm_2', mecanicoId: null, asesorId: 'u_recepcion',
    estado: 'Creada', nivelCombustible: '1/4',
    observacionCliente: 'Testigo de check engine encendido', servicioARealizar: 'Diagnóstico eléctrico', creadoEn: hoy,
    trabajoIniciadoEn: null, trabajoFinalizadoEn: null
  },
  {
    id: 'ot_3', numeroOT: 'OT-2026-0003', clienteId: 'c_3', motoId: 'm_3', mecanicoId: 'u_mecanico2', asesorId: 'u_recepcion',
    estado: 'Lista para entrega', nivelCombustible: 'F',
    observacionCliente: 'Cambio de llanta trasera y cadena', servicioARealizar: 'Cambio de llanta y cadena', creadoEn: hoy,
    trabajoIniciadoEn: hoy, trabajoFinalizadoEn: hoy
  }
];

export const DIAGNOSTICOS_SEED: Diagnostico[] = [
  { id: 'd_1', otId: 'ot_1', diagnostico: 'Holgura en cadena de distribución, requiere ajuste.', sugerencias: 'Ajustar tensor y cambiar aceite.', mecanicoNombre: 'Jhon Quispe', creadoEn: hoy }
];

export const PEDIDOS_SEED: PedidoAlmacen[] = [
  { id: 'ped_1', otId: 'ot_1', estado: 'Despachado', creadoPor: 'u_mecanico1', creadoEn: hoy }
];

export const PEDIDO_DETALLE_SEED: PedidoDetalle[] = [
  { id: 'pd_1', pedidoId: 'ped_1', productoId: 'p_1', cantidadSolicitada: 1, cantidadDespachada: 1 }
];

export const MOVIMIENTOS_SEED: MovimientoInventario[] = [
  { id: 'mov_1', productoId: 'p_1', tipo: 'salida', cantidad: 1, otId: 'ot_1', usuarioId: 'u_almacen', creadoEn: hoy }
];

export const COTIZACIONES_SEED: Cotizacion[] = [
  {
    id: 'cot_1', otId: 'ot_3',
    detalle: [
      { descripcion: 'Llanta trasera 100/90-17', cantidad: 1, precioUnitario: 180 },
      { descripcion: 'Cadena de transmisión 428H', cantidad: 1, precioUnitario: 95 },
      { descripcion: 'Mano de obra', cantidad: 1, precioUnitario: 40 }
    ],
    montoTotal: 315,
    autorizado: true,
    autorizadoEn: hoy
  }
];

export const AUDITORIA_SEED: RegistroAuditoria[] = [
  { id: 'aud_1', otId: 'ot_1', usuarioId: 'u_recepcion', accion: 'Creación de OT', estadoAnterior: null, estadoNuevo: 'Creada', creadoEn: hoy }
];
