import { EstadoOT, SECUENCIA_ESTADOS_OT } from '../models/models';

/**
 * "La API debe validar que todo cambio de estado siga esta secuencia (o una
 * ruta de excepción auditada por Administración); no se permiten saltos de
 * estado desde el cliente." — sección 7 del Design Doc.
 *
 * En el frontend replicamos la misma regla: por defecto solo se permite
 * avanzar un paso en la secuencia. Administración puede forzar cualquier
 * transición, pero queda registrada en auditoría (ver StoreService.cambiarEstadoOT).
 */
export function siguienteEstado(actual: EstadoOT): EstadoOT | null {
  const idx = SECUENCIA_ESTADOS_OT.indexOf(actual);
  if (idx === -1 || idx === SECUENCIA_ESTADOS_OT.length - 1) return null;
  return SECUENCIA_ESTADOS_OT[idx + 1];
}

export function esTransicionValida(actual: EstadoOT, siguiente: EstadoOT): boolean {
  return siguienteEstado(actual) === siguiente;
}

export function colorEstado(estado: EstadoOT): 'navy' | 'amber' | 'emerald' {
  if (estado === 'Creada' || estado === 'Asignada' || estado === 'En ejecución') return 'navy';
  if (estado === 'Lista para entrega' || estado === 'Cerrada') return 'emerald';
  return 'amber'; // Pedido de repuestos, En diagnóstico, En espera de autorización, Control de calidad
}
