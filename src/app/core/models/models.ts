// Modelos de dominio — reflejan el esquema relacional del Design Doc MHESUS v1.0

export type Rol = 'recepcion' | 'mecanico' | 'almacen' | 'administracion';

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  passwordHash?: string; // el backend nunca lo envía (@JsonIgnore); queda opcional en el frontend
  rol: Rol;
  email?: string | null;
  activo: boolean;
}

export interface Cliente {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  celular: string;
  email?: string | null;
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
  precioAnterior?: number | null;
  descuentoMaximo?: number | null;
  stockActual: number;
  stockMinimo: number;
  lugar?: string; // "Ubicación" en la interfaz
  marcaMoto?: string | null;
  modeloMoto?: string | null;
  submodeloMoto?: string | null;
  anioDesde?: number | null;
  anioHasta?: number | null;
}

/** Catálogo de marcas/modelos/submodelos de moto que maneja el taller, para el registro y filtro de productos por compatibilidad. */
export const MARCAS_MOTO = ['Bajaj', 'TVS', 'KTM'] as const;
export type MarcaMoto = typeof MARCAS_MOTO[number];

export const MODELOS_POR_MARCA: Record<MarcaMoto, string[]> = {
  Bajaj: ['Pulsar', 'Discover', 'Boxer', 'Dominar'],
  TVS: ['Apache RTR', 'Apache RR', 'Raider', 'Sport', 'Stryker', 'Ronin'],
  KTM: ['Duke', 'RC', 'Adventure']
};

export const SUBMODELOS_POR_MODELO: Record<string, string[]> = {
  'Bajaj-Pulsar': ['125', '135', '150', 'N160', '160 NS', '180', '200 NS', 'N250', 'RS200'],
  'Bajaj-Discover': ['100', '125', '135', '150'],
  'Bajaj-Boxer': ['CT100', 'CT125', 'S', '150X'],
  'Bajaj-Dominar': ['250', '400'],
  'TVS-Apache RTR': ['160', '160 4V', '180', '200', '200 4V', '310'],
  'TVS-Apache RR': ['310'],
  'TVS-Raider': ['125', '125 FI'],
  'TVS-Sport': ['100'],
  'TVS-Stryker': ['125'],
  'TVS-Ronin': ['225'],
  'KTM-Duke': ['200', '250', '390', '790'],
  'KTM-RC': ['200', '390'],
  'KTM-Adventure': ['250', '390']
};

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
  nota?: string | null;
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
export type TipoVenta = 'FACTURA' | 'BOLETA' | 'NOTA_VENTA' | 'NOTA_CREDITO' | 'NOTA_DEBITO' | 'PROFORMA' | 'GUIA_REMISION';
export const NOMBRE_TIPO_VENTA: Record<TipoVenta, string> = {
  FACTURA: 'Factura',
  BOLETA: 'Boleta de venta',
  NOTA_VENTA: 'Nota de venta',
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

// ---------- Deudas (Administración) ----------
export type TipoDeuda = 'POR_COBRAR' | 'BANCO';

export interface Deuda {
  id: string;
  tipo: TipoDeuda;
  nombre: string;
  descripcion: string | null;
  clienteId: string | null;
  montoOriginal: number;
  montoPendiente: number;
  fechaVencimiento: string | null;
  estado: 'PENDIENTE' | 'PAGADA';
  creadoPor: string;
  creadoEn: string;
}

// ---------- Compras (para el cálculo de IGV) ----------
export interface Compra {
  id: string;
  proveedor: string;
  descripcion: string | null;
  numeroComprobante: string | null;
  montoTotal: number;
  igv: number;
  fecha: string; // YYYY-MM-DD
  creadoPor: string;
  creadoEn: string;
}

export interface ResumenIgv {
  igvVentas: number;
  igvCompras: number;
  igvAPagar: number;
  debePagar: boolean;
  sinVentasEsteMes: boolean;
  sinComprasEsteMes: boolean;
}
