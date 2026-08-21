// Modelos de dominio — reflejan el esquema relacional del Design Doc MHESUS v1.0

export type Rol = 'recepcion' | 'mecanico' | 'almacen' | 'administracion';

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  passwordHash?: string; // el backend nunca lo envía (@JsonIgnore); queda opcional en el frontend
  rol: Rol;
  activo: boolean;
}

export interface Cliente {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  celular: string;
  direccion: string;
  creadoEn: string;
}

export interface Motocicleta {
  id: string;
  clienteId: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  kmActual: number;
}

// Nivel de combustible mostrado como en el tablero de la moto (no un slider numérico)
export type NivelCombustible = 'E' | '1/4' | '1/2' | '3/4' | 'F';
export const NIVELES_COMBUSTIBLE: NivelCombustible[] = ['E', '1/4', '1/2', '3/4', 'F'];

// Máquina de estados de la OT — sección 7 del Design Doc
export type EstadoOT =
  | 'Creada'
  | 'Asignada'
  | 'Pedido de repuestos'
  | 'En diagnóstico'
  | 'En espera de autorización'
  | 'En ejecución'
  | 'Control de calidad'
  | 'Lista para entrega'
  | 'Cerrada';

export const SECUENCIA_ESTADOS_OT: EstadoOT[] = [
  'Creada',
  'Asignada',
  'Pedido de repuestos',
  'En diagnóstico',
  'En espera de autorización',
  'En ejecución',
  'Control de calidad',
  'Lista para entrega',
  'Cerrada'
];

export interface OrdenTrabajo {
  id: string;
  numeroOT: string;
  clienteId: string;
  motoId: string;
  mecanicoId: string | null;
  asesorId: string | null;
  estado: EstadoOT;
  nivelCombustible: NivelCombustible;
  observacionCliente: string;
  observacionAsesor?: string | null;
  servicioARealizar: string;
  creadoEn: string;
  trabajoIniciadoEn: string | null;
  trabajoFinalizadoEn: string | null;
  fotoIngreso?: string | null;
  fotoIngresoTrasera?: string | null;
  fotoIngresoLateralIzq?: string | null;
  fotoIngresoLateralDer?: string | null;
  fotoTablero?: string | null;
  tableroNoEnciende?: boolean;
}

export interface Diagnostico {
  id: string;
  otId: string;
  diagnostico: string;
  sugerencias: string;
  mecanicoNombre: string;
  creadoEn: string;
  fotoDiagnostico?: string | null;
}

export interface Producto {
  id: string;
  codigo: string;
  codigoBarras?: string;
  nombre: string;
  categoria: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  lugar?: string;
}

export type EstadoPedido = 'Solicitado' | 'Aprobado' | 'Despachado parcial' | 'Despachado' | 'Cancelado';

export interface PedidoAlmacen {
  id: string;
  otId: string;
  estado: EstadoPedido;
  creadoPor: string;
  creadoEn: string;
  fotoDespacho?: string | null;
}

export interface PedidoDetalle {
  id: string;
  pedidoId: string;
  productoId: string;
  cantidadSolicitada: number;
  cantidadDespachada: number;
}

export type TipoMovimiento = 'ingreso' | 'salida' | 'ajuste';

export interface MovimientoInventario {
  id: string;
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  otId: string | null;
  usuarioId: string;
  creadoEn: string;
}

export interface ItemCotizacion {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Cotizacion {
  id: string;
  otId: string;
  detalle: ItemCotizacion[];
  montoTotal: number;
  autorizado: boolean;
  autorizadoEn: string | null;
}

export interface RegistroAuditoria {
  id: string;
  otId: string | null;
  usuarioId: string;
  accion: string;
  estadoAnterior: string | null;
  estadoNuevo: string | null;
  creadoEn: string;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  mensaje: string;
  otId: string | null;
  leida: boolean;
  creadoEn: string;
}

export type TipoTarea = 'nota' | 'recordatorio' | 'recordatorio_moto' | 'tarea_asignada';

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string; // YYYY-MM-DD
  hora: string | null; // HH:mm
  tipo: TipoTarea;
  motoId: string | null;
  creadoPor: string;
  asignadoA: string | null;
  completada: boolean;
  creadoEn: string;
}

// ---------- Facturación ----------
export type TipoVenta = 'FACTURA' | 'BOLETA' | 'NOTA_CREDITO' | 'NOTA_DEBITO' | 'PROFORMA' | 'GUIA_REMISION';
export const NOMBRE_TIPO_VENTA: Record<TipoVenta, string> = {
  FACTURA: 'Factura',
  BOLETA: 'Boleta de venta',
  NOTA_CREDITO: 'Nota de crédito',
  NOTA_DEBITO: 'Nota de débito',
  PROFORMA: 'Proforma',
  GUIA_REMISION: 'Guía de remisión'
};

export interface ItemVenta {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  productoId?: string | null;
}

export interface Venta {
  id: string;
  tipo: TipoVenta;
  serie: string;
  numero: number;
  otId: string | null;
  clienteId: string | null;
  clienteNombre: string | null;
  clienteDocumento: string | null;
  items: ItemVenta[];
  subtotal: number;
  igv: number;
  total: number;
  estado: 'EMITIDA' | 'ANULADA';
  creadoPor: string;
  creadoEn: string;
}

export interface ResumenDia {
  total: number;
  emisiones: number;
  promedio: number;
  igv: number;
  porTipo: Record<string, { monto: number; cantidad: number }>;
  ultimaEmision: string | null;
}
